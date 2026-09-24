# Charusat Needs — Scheduled Order State Machine

**Document Version:** 1.0.0  
**Effective Date:** 2026-09-24  
**Classification:** Business Logic & State Machine Specification  
**Timezone Reference:** Asia/Kolkata (IST, UTC+05:30)

---

## 1. Domain State Model

The order lifecycle encapsulates both immediate (instant) and scheduled meal orders. The comprehensive order states are:

```text
       [ Customer Places Scheduled Order ]
                       |
                       v
                 +-----------+
                 | SCHEDULED | (Vendor Kitchen Blind)
                 +-----------+
                       |
                       | [ release_at <= NOW() triggered by Scheduler ]
                       v
                 +-----------+
                 | RELEASED  | (Appears on Vendor Active Kitchen Terminal)
                 +-----------+
                       |
                       +-----------------------+
                       |                       |
        [ Vendor Accepts ]           [ Vendor Rejects ]
                       |                       |
                       v                       v
                 +-----------+           +-----------+
                 | CONFIRMED |           | REJECTED  |
                 +-----------+           +-----------+
                       |                       |
                       v                       v
                 +-----------+           +----------------+
                 | PREPARING |           | REFUND_PENDING |
                 +-----------+           +----------------+
                       |                       |
                       v                       v
                 +-----------+           +-----------+
                 |   READY   |           |  REFUNDED |
                 +-----------+           +-----------+
                       |
                       v
                 +-----------+
                 | COMPLETED |
                 +-----------+
```

---

## 2. State Transition Matrix

| Current State | Event / Trigger | Target State | Permitted Roles | Actions Executed |
|---|---|---|---|---|
| `CART` | Checkout (Scheduled) | `SCHEDULED` | `STUDENT`, `SYSTEM` | Order record created, payment captured/verified, vendor WebSocket suppressed. |
| `CART` | Checkout (Instant) | `PENDING` | `STUDENT`, `SYSTEM` | Order record created, instant vendor WebSocket broadcast. |
| `SCHEDULED` | Clock reaches `release_at` | `RELEASED` | `SYSTEM` (Scheduler) | Atomically updates `released_at`, broadcasts to `/topic/canteen/{id}/orders`. |
| `SCHEDULED` | Student cancels before release | `CANCELLED` | `STUDENT` | Order cancelled, initiates refund workflow if paid online. |
| `RELEASED` | Vendor accepts ticket | `CONFIRMED` | `CANTEEN_OWNER` | Kitchen prep timer begins, push notification to customer. |
| `RELEASED` | Vendor rejects ticket | `REJECTED` | `CANTEEN_OWNER` | Kitchen capacity overflow flag, automatic refund trigger. |
| `CONFIRMED` | Kitchen marks prep started | `PREPARING` | `CANTEEN_OWNER` | Live status bar on customer mobile screen moves to Preparing. |
| `PREPARING` | Food packaged & ready | `READY` | `CANTEEN_OWNER` | OTP / token display triggered for counter pickup. |
| `READY` | Customer presents token & collects | `COMPLETED` | `CANTEEN_OWNER` | Order closed, escrow moved to settled balance. |

---

## 3. Invariant Guarantees

### 3.1 Vendor Invisibility Invariant
```text
IF status == 'SCHEDULED' AND NOW() < release_at:
  Order is EXCLUDED from GET /api/orders/canteen/{canteenId}/active
  Order is EXCLUDED from live WebSocket kitchen dispatch
  Order is INCLUDED in GET /api/orders/canteen/{canteenId}/scheduled (Informational Only)
```

### 3.2 Idempotent Release Transition Invariant
The scheduler transition query uses optimistic row-level locking:
```sql
UPDATE orders 
SET status = 'RELEASED', released_at = NOW() 
WHERE id = :orderId AND status = 'SCHEDULED';
```
If multiple scheduler worker threads or node instances execute concurrently, exactly one thread updates the status from `SCHEDULED` to `RELEASED` (rows affected = 1). Subsequent threads match zero rows and abort safely.

---

## 4. Cancellation & Refund Policies

1. **Cancellation Prior to Release (`status == 'SCHEDULED'`):**
   * Customer cancellation is fully permitted up to 5 minutes before `release_at`.
   * Digital payment: Full refund initiated immediately.
   * Cash on Delivery / Counter: Record flagged as `CANCELLED` with zero financial liability.
2. **Cancellation After Release (`status == 'RELEASED'` or later):**
   * Once released, preparation may have commenced. Cancellation requires canteen manager intervention or direct phone contact with the canteen.
   * If vendor rejects the order (`REJECTED`), full automatic refund is triggered without customer penalty.
