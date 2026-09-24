# Charusat Needs — Transaction Integrity & State Machine Verification Report

**Document Version:** 1.0.0  
**Audit Date:** 2026-09-24  
**Classification:** Core System Architecture & Financial Transaction Assurance  
**Lead:** Transaction Integrity Engineer & Database Resilience Architect  
**Governing Principles:** ACID Compliance / Idempotency / Deterministic Finite State Automata (FSA)  

---

## 1. Executive Summary

This report formalizes the operational mechanics, transition invariants, concurrency controls, idempotency mechanisms, and failure recovery protocols across all transactional subdomains of Charusat Needs:
1. Shopping Cart Subsystem
2. Menu Inventory & Stock Control
3. Promotional Coupon & Discount Engine
4. Food Order Lifecycle
5. Digital Payment Processing (Razorpay)
6. Automated & Manual Refunds
7. Vendor Banking Settlement & Payouts
8. Customer Grievance & Complaint Handling
9. Review & Rating Submission
10. Canteen Operational Status Transitions

---

## 2. Comprehensive Transaction Subsystem Analysis

### 2.1 Shopping Cart Subsystem

- **State Model:**
  `EMPTY -> ACTIVE -> LOCKED_FOR_CHECKOUT -> CLEARED`
- **Authorized Actors:**
  Authenticated Student (`ROLE_USER`). Cart is strictly bound to the authenticated user ID via database foreign key.
- **Allowed Transitions:**
  - `EMPTY -> ACTIVE`: Initial addition of an item via `POST /api/cart/add`.
  - `ACTIVE -> ACTIVE`: Quantity modification, variant selection, or coupon application.
  - `ACTIVE -> LOCKED_FOR_CHECKOUT`: Initiation of checkout modal and Razorpay order generation.
  - `LOCKED_FOR_CHECKOUT -> CLEARED`: Payment verification success triggers order creation and empties cart.
  - `ACTIVE -> EMPTY`: Manual deletion of items or explicit cart clearing.
- **Forbidden Transitions:**
  - Direct checkout from `EMPTY` state.
  - Cart modifications while in `LOCKED_FOR_CHECKOUT` without resetting payment session.
- **Idempotency & Concurrency:**
  - `CartService.addToCart` checks if `(menuItemId, variant)` already exists in the cart. If found, it increments quantity rather than creating duplicate row entries.
  - Rapid double-submission testing (`TX-CONCURRENCY-01`) confirmed database transaction isolation prevents deadlocks and state corruption.
- **Rollback & Recovery:**
  - If checkout fails at the payment stage, the cart state is retained without data loss, allowing the student to reattempt payment.

---

### 2.2 Menu Inventory & Stock Control

- **State Model:**
  `IN_STOCK -> OUT_OF_STOCK -> DISABLED`
- **Authorized Actors:**
  Canteen Owner (`ROLE_CANTEEN_OWNER`) and Administrator (`ROLE_ADMIN`).
- **Allowed Transitions:**
  - `IN_STOCK -> OUT_OF_STOCK`: Stock depletion or vendor toggles `isAvailable = false`.
  - `OUT_OF_STOCK -> IN_STOCK`: Vendor replenishes stock and toggles `isAvailable = true`.
  - `IN_STOCK / OUT_OF_STOCK -> DISABLED`: Vendor deletes or deactivates dish.
- **Forbidden Transitions:**
  - Customer purchase of items flagged with `isAvailable = false`.
  - Customer updating quantity of an item that has been disabled.
- **Idempotency & Concurrency:**
  - Item toggle operations (`POST /api/canteens/menu/{id}/toggle`) are idempotent boolean sets.
  - State changes broadcast immediately via WebSocket topic `/topic/canteen-status` to update connected browser tabs in real time.

---

### 2.3 Promotional Coupon & Discount Engine

- **State Model:**
  `DRAFT -> ACTIVE -> PAUSED -> EXPIRED / DEPLETED`
- **Authorized Actors:**
  - Creation & Management: Canteen Owner (`ROLE_CANTEEN_OWNER`) and Administrator (`ROLE_ADMIN`).
  - Validation & Application: Authenticated Student (`ROLE_USER`).
- **Allowed Transitions:**
  - `ACTIVE -> PAUSED`: Vendor toggles coupon inactive via `PUT /api/coupons/{id}/toggle`.
  - `ACTIVE -> DEPLETED`: Total usage counter reaches `usageLimitTotal`.
  - `ACTIVE -> EXPIRED`: System time surpasses `endTime`.
- **Forbidden Transitions:**
  - Application of expired or paused coupons.
  - Discount amount exceeding the cart order value (negative totals prohibited).
  - Cross-canteen coupon application (coupons are scoped strictly to the issuing canteen ID).
- **Authoritative Server-Side Calculation:**
  - The client provides only the `couponCode`. The server recalculates cart subtotals, checks `minOrderValue`, applies percentage caps (`maxDiscountCap`), and sets `finalAmount`. The client-supplied subtotal is never trusted.

---

### 2.4 Food Order Lifecycle

- **State Model:**
  ```
  [ PENDING ] ─────────> [ CONFIRMED ] ─────────> [ PREPARING ] ─────────> [ READY ] ─────────> [ COMPLETED ]
       │                      │
       └──────────────────────┴─────────> [ CANCELLED ]
  ```
- **Authorized Actors:**
  - Order Creation: Authenticated Student (`ROLE_USER`) upon confirmed payment.
  - Status Progression: Canteen Owner (`ROLE_CANTEEN_OWNER`) or Administrator (`ROLE_ADMIN`).
- **Allowed Transitions:**
  - `PENDING -> CONFIRMED`: Vendor accepts new incoming order.
  - `CONFIRMED -> PREPARING`: Kitchen initiates preparation.
  - `PREPARING -> READY`: Dish completed and packaged for pickup.
  - `READY -> COMPLETED`: Customer claims order at the canteen counter.
  - `PENDING / CONFIRMED -> CANCELLED`: Vendor rejects order with documented `rejectionReason`.
- **Forbidden Transitions:**
  - `COMPLETED -> PENDING / PREPARING` (Backward transition prohibited).
  - `CANCELLED -> CONFIRMED / READY` (Resurrection of terminated order prohibited).
  - Student modifying order status post-submission (`RBAC-ESCALATE-03` tested and rejected with HTTP 403).
- **Idempotency:**
  - Repeated status update requests to the same target status execute idempotently without side effects.
  - Completed orders store `completedAt` timestamp once.

---

### 2.5 Digital Payment Processing (Razorpay)

- **State Model:**
  `CREATED -> AUTHORIZED -> CAPTURED -> FAILED / REFUNDED`
- **Authorized Actors:**
  - Order Generation: Authenticated Student (`ROLE_USER`).
  - Verification & Capture: Application Server via timing-safe HMAC-SHA256 signature check.
- **Allowed Transitions:**
  - `CREATED -> CAPTURED`: Successful gateway callback verified by server.
  - `CREATED -> FAILED`: Gateway payment failure, timeout, or invalid signature.
  - `CAPTURED -> REFUNDED`: Authorized refund following order cancellation.
- **Forbidden Transitions:**
  - Client directly marking payment status as `PAID` without cryptographic verification.
  - Processing payment verification without timing-safe comparison (`MessageDigest.isEqual`).
- **Idempotency & Concurrency:**
  - `PaymentService.createOrder` accepts an `idempotencyKey`. If an order with that key already exists, the server returns the existing Razorpay order details instead of creating duplicate charges.

---

### 2.6 Refund Subsystem

- **State Model:**
  `REQUESTED -> PENDING_GATEWAY -> PROCESSED -> REJECTED`
- **Authorized Actors:**
  System Administrator (`ROLE_ADMIN`) and automated background reconciliation job.
- **Current Operational Status:**
  - Database entity and status tracking are implemented and code-verified.
  - Live automated API refund trigger to Razorpay is classified as `BLOCKED BY INFRASTRUCTURE / BUSINESS DEPENDENCY` pending university merchant onboarding and production API credential provisioning.

---

### 2.7 Vendor Banking Settlement & Payouts

- **State Model:**
  `ACCUMULATING -> REQUESTED -> AUDITING -> SETTLED -> FAILED`
- **Authorized Actors:**
  Canteen Owner initiates request; Administrator approves settlement.
- **Security Invariants:**
  - Payout amount cannot exceed total settled order revenue minus platform commission and previous payouts.
  - Bank account details (`accountNumber`, `ifscCode`, `bankName`) are validated for standard Indian banking formats.
  - Multi-tenant isolation prevents Vendor A from requesting or inspecting Vendor B's payout queue.

---

### 2.8 Customer Grievance & Complaint Handling

- **State Model:**
  `SUBMITTED -> IN_REVIEW -> INVESTIGATING -> RESOLVED -> DISMISSED`
- **Authorized Actors:**
  Student creates complaint; Canteen Owner inspects complaints related to their outlet; Administrator moderates.
- **Integrity Controls:**
  - Complaints link to a verified `orderId` to prevent spam submissions.
  - Resolution logs record administrator ID, resolution note, and resolution timestamp.

---

### 2.9 Review & Rating Submission

- **State Model:**
  `SUBMITTED -> PUBLISHED -> FLAGGED -> REMOVED`
- **Authorized Actors:**
  Authenticated Student who has completed an order at the target canteen.
- **Integrity Controls:**
  - Rating bounded to integer range `1 <= rating <= 5`.
  - Single review per completed order prevents review bombing or score manipulation.

---

### 2.10 Canteen Operational Status Transitions

- **State Model:**
  `OPEN <──────> CLOSED`  
  `RUSH_HOUR_DISABLED <──────> RUSH_HOUR_ENABLED`
- **Authorized Actors:**
  Canteen Owner who owns the specific canteen ID or System Administrator.
- **Transition Synchronization:**
  - Calling `PATCH /api/canteens/{id}/toggle-open` updates the database record atomically and immediately broadcasts `CANTEEN_STATUS_CHANGED` via STOMP WebSocket.
  - Customer dashboards listen on `/topic/canteen-status` and update UI badges in real time without polling.

---

## 3. Transaction Integrity Verification Summary

| Subsystem | State Machine Verified | Idempotency Verified | Concurrency Tested | Authorization Enforced | Rollback Safe |
|---|---|---|---|---|---|
| Shopping Cart | YES | YES | YES (`TX-CONCURRENCY-01`) | YES | YES |
| Menu Inventory | YES | YES | YES | YES | YES |
| Coupons & Discounts | YES | YES | YES | YES (`RBAC-ESCALATE-02`) | YES |
| Food Order Lifecycle | YES | YES | YES | YES (`RBAC-ESCALATE-03`) | YES |
| Payment Gateway | YES | YES (`idempotencyKey`) | YES | YES (`PAY-VERIFY-01`) | YES |
| Refunds | YES | YES | CODE-VERIFIED | YES | PENDING LIVE ONBOARDING |
| Vendor Payouts | YES | YES | CODE-VERIFIED | YES | YES |
| Complaints & Reviews | YES | YES | YES | YES | YES |
| Canteen Operational Status | YES | YES | YES | YES | YES |

---

## 4. Conclusion

The Charusat Needs platform enforces rigid transaction integrity and state machine discipline across all business critical domains. State transitions are deterministic, server-authoritative, idempotent, and protected by database transactions.
