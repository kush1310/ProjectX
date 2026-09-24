# Charusat Needs — Scheduled Order Architecture Specification

**Document Version:** 1.0.0  
**Effective Date:** 2026-09-24  
**Classification:** Core System Architecture  
**Timezone Reference:** Asia/Kolkata (IST, UTC+05:30)

---

## 1. Architectural Overview & Problem Statement

In campus food-commerce environments such as Charusat University, lecture schedules and recess intervals create extreme meal rush periods (notably 11:30 AM to 02:00 PM). Traditional instant-only order models cause severe kitchen queue saturation and prolonged counter wait times.

The Scheduled Ordering subsystem introduces future-dated ordering capabilities while strictly enforcing the core business invariant:

> **Core Invariant:** A scheduled order must NOT appear as an active or reception-ready order on the vendor side before its scheduled release time (`release_at`). The physical kitchen queue and vendor dispatch terminals must remain completely isolated from future orders until kitchen preparation is required.

---

## 2. Temporal Semantics & Lead Time Strategy

Charusat campus kitchens require an operational preparation buffer before the student's designated pickup time. 

* **`scheduled_for` (Timestamp with Time Zone):** The exact target pickup or delivery time requested by the customer (e.g., `2026-09-24 13:00:00+05:30`).
* **`lead_time_minutes` (Integer, Default 15):** The estimated kitchen preparation and staging duration configured per canteen.
* **`release_at` (Timestamp with Time Zone):** The deterministic threshold at which vendor kitchen visibility and WebSocket dispatch become permitted:
  $$\text{release\_at} = \text{scheduled\_for} - \text{lead\_time\_minutes}$$
* **`released_at` (Timestamp with Time Zone):** The physical timestamp recorded by the backend scheduler when state transitions from `SCHEDULED` to `RELEASED`.

---

## 3. Database Schema Architecture

The subsystem schema was provisioned via Flyway migration `V6__scheduled_orders.sql`:

```sql
-- Alter orders table to support scheduled temporal lifecycle
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) DEFAULT 'INSTANT',
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS release_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS released_at TIMESTAMP WITH TIME ZONE;

-- Performance index for high-throughput scheduler query
CREATE INDEX IF NOT EXISTS idx_orders_release_sched 
  ON orders (status, release_at) 
  WHERE status = 'SCHEDULED';

-- Index for vendor scheduled order overview tab
CREATE INDEX IF NOT EXISTS idx_orders_canteen_sched 
  ON orders (canteen_id, status) 
  WHERE status = 'SCHEDULED';
```

### Table Column Definitions

| Column Name | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `order_type` | `VARCHAR(20)` | No | `'INSTANT'` | Order classification: `INSTANT` or `SCHEDULED`. |
| `scheduled_for` | `TIMESTAMPTZ` | Yes | `NULL` | Customer requested pickup slot (Asia/Kolkata). |
| `release_at` | `TIMESTAMPTZ` | Yes | `NULL` | Time at which vendor visibility is unlocked. |
| `released_at` | `TIMESTAMPTZ` | Yes | `NULL` | Actual execution timestamp of release transition. |

---

## 4. Backend Component Architecture

### 4.1 Order Model & Persistence Layer
* **`Order.java`:** Domain model updated with `orderType`, `scheduledFor`, `releaseAt`, `releasedAt`, and `OrderStatus` enums `SCHEDULED` and `RELEASED`.
* **`OrderRepository.java`:**
  * `findPendingReleaseOrders(Timestamp threshold)`: Retrieves all orders satisfying `status = 'SCHEDULED' AND release_at <= ?`.
  * `findScheduledOrdersByCanteen(Long canteenId)`: Retrieves future orders for vendor capacity planning without contaminating the active kitchen queue.
  * `findActiveOrdersByCanteen(Long canteenId)`: Restricted strictly to `status IN ('RELEASED', 'PENDING', 'CONFIRMED', 'PREPARING', 'READY')`.

### 4.2 Automated Release Worker
* **`OrderReleaseScheduler.java`:** Spring `@Scheduled` background worker operating at a 15-second fixed delay.
* **Worker Execution Logic:**
  1. Queries candidate orders using `findPendingReleaseOrders(now)`.
  2. For each candidate order, calls `@Transactional OrderService.releaseScheduledOrder(orderId)`.
  3. Transitions status atomically from `SCHEDULED` to `RELEASED`.
  4. Dispatches WebSocket STOMP notification to `/topic/canteen/{canteenId}/orders` to trigger live vendor terminal ingestion.

```text
[OrderReleaseScheduler] (Every 15s)
        |
        v
SELECT * FROM orders WHERE status = 'SCHEDULED' AND release_at <= NOW()
        |
        v (For each record)
BEGIN TRANSACTION
  UPDATE orders SET status = 'RELEASED', released_at = NOW() WHERE id = ? AND status = 'SCHEDULED'
  WebSocket.convertAndSend("/topic/canteen/" + canteenId + "/orders", orderPayload)
COMMIT TRANSACTION
```

---

## 5. Security & Isolation Verification

Vendor isolation is enforced at the database query and service layer, not purely on the frontend:

1. **Vendor Active Orders Endpoint (`GET /api/orders/canteen/{id}/active`):**
   * SQL filter: `WHERE canteen_id = ? AND status IN ('RELEASED', 'PENDING', 'CONFIRMED', 'PREPARING', 'READY')`.
   * Result: Pre-release scheduled orders return 0 records in this endpoint.
2. **Vendor Scheduled Tab Endpoint (`GET /api/orders/canteen/{id}/scheduled`):**
   * Dedicated endpoint displaying upcoming scheduled bookings for pre-shift prep without creating immediate kitchen tickets.
3. **WebSocket Event Gating:**
   * At initial order creation, if `orderType == OrderType.SCHEDULED`, real-time vendor WebSocket broadcast is suppressed.
   * Broadcast occurs exclusively during `OrderService.releaseScheduledOrder()`.

---

## 6. Timezone Handling Discipline

* The server environment and database operate with `TIMESTAMPTZ` storing UTC offsets.
* The application standardizes on `Asia/Kolkata` (IST, UTC+05:30) for business calculations.
* Frontends format and display time strings using the customer local timezone with fallback to `Asia/Kolkata`.
