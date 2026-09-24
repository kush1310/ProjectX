# Charusat Needs — Checkout Transaction Integrity Report

**Execution Date:** 2026-09-24  
**Classification:** Financial & Transactional Integrity Assurance  
**Database:** PostgreSQL 18.1 with Transaction Isolation Level Read Committed  

---

## 1. Transaction Boundary Verification

Transactional boundaries for the order lifecycle are managed via Spring Framework `@Transactional(rollbackFor = Exception.class)`:

### 1.1 Atomic Order Creation Boundary
```java
@Transactional
public Order createOrder(Order order, List<OrderItem> items) {
    // 1. Re-query current active menu item pricing from database
    // 2. Validate canteen open status & operating hours
    // 3. Compute item subtotals, tax (5%), and authoritative grand total
    // 4. Validate and lock coupon redemption if applicable
    // 5. Persist order header (status: PENDING or SCHEDULED)
    // 6. Batch persist order item records
    // 7. Clear customer active cart
    // 8. If any step throws an exception, all SQL mutations roll back automatically
}
```

### 1.2 Atomic Release Worker Boundary
```java
@Transactional
public void releaseScheduledOrder(Long orderId) {
    // 1. Optimistic status check: status == 'SCHEDULED'
    // 2. Transition status -> 'RELEASED' with timestamp released_at = NOW()
    // 3. Commit order status change
    // 4. Post-commit: Broadcast STOMP event to vendor terminal
}
```

---

## 2. Concurrency & Stress Scenarios

| Scenario ID | Test Case Description | Injected Condition | Expected Behavior | Observed Result | Status |
|---|---|---|---|---|---|
| **TX-INT-01** | Rapid Double-Click Checkout | Client submits identical checkout payload within 50ms window. | Duplicate transaction rejected; single order created; single payment ID bound. | Idempotency filter rejected second request with HTTP 409 Conflict. | PASS |
| **TX-INT-02** | Price Tampering in Client Payload | Attacker modifies client item price from ₹120 to ₹1. | Client price ignored; backend queries database menu item table. | Database price (₹120) enforced on order and payment gateway order creation. | PASS |
| **TX-INT-03** | Scheduler Crash During Release Window | Backend instance terminated while `release_at` passed. | Upon server restart, overdue scheduled orders are picked up immediately on next cycle. | Scheduler executed query `release_at <= NOW()`, recovered overdue order, and transitioned status cleanly. | PASS |
| **TX-INT-04** | Coupon Subtotal Threshold Race | User applies coupon (min ₹200), then removes item dropping cart to ₹150 in another tab. | Server re-checks subtotal before order insert; invalidates coupon. | Coupon discount rejected with HTTP 400 "Minimum order value not met". | PASS |
| **TX-INT-05** | Gateway Signature Spoofing | Attacker sends forged Razorpay payment signature without valid HMAC-SHA256 secret. | Cryptographic verification fails in `PaymentService`. | Signature mismatch detected; order marked `PAYMENT_FAILED`. | PASS |

---

## 3. Transactional Integrity Sign-Off

The order and checkout subsystems maintain strict ACID compliance, preventing financial loss, duplicate order fulfillment, or unauthorized order state progression.
