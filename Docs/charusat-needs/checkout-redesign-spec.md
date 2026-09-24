# Charusat Needs — Checkout Redesign Specification

**Document Version:** 1.0.0  
**Effective Date:** 2026-09-24  
**Classification:** UX/UI & Payment Engineering Specification  

---

## 1. Checkout Journey Stages

The checkout journey is restructured into a coherent, 5-stage progressive flow designed to eliminate transaction anxiety and provide explicit clarity on meal timing and location.

```text
[ 1. Order Review ]
       |
       v
[ 2. Location / Hostel Confirmation ]
       |
       v
[ 3. Timing Mode (ASAP vs Scheduled) ]
       |
       v
[ 4. Offer / Coupon Application ]
       |
       v
[ 5. Payment Selection & Authorization ]
       |
       v
[ 6. Order Confirmation Screen ]
```

---

## 2. Payment Modal & Selection Interaction

When the user taps "Proceed to Pay", an elevated payment sheet modal appears with clear payment rails:

1. **Online Payment (Razorpay Test Gateway):**
   * UPI (Google Pay, PhonePe, Paytm).
   * Credit / Debit Cards (Visa, MasterCard, RuPay).
   * Net Banking.
   * Direct server-side signature verification with SHA256 HMAC.
2. **Pay at Counter (Cash / Token on Pickup):**
   * Enabled for verified campus students.
   * Generates order directly with status `PENDING` (Instant) or `SCHEDULED` (Scheduled).

---

## 3. Order Confirmation Screen Specifications

Upon successful authorization, the user is transitioned to the Order Confirmation view displaying:

* **Header Status Banner:**
  * For Instant Orders: "Order Placed Successfully! Your order has been sent to the kitchen."
  * For Scheduled Orders: "Order Scheduled! Your order #CN-XXXX will be sent to the kitchen at [Release Time]."
* **Order Summary Card:**
  * Order Reference ID: e.g., `#CN-434`.
  * Canteen Name & Campus Building Location.
  * Target Time: e.g., `Today at 01:00 PM (Scheduled)`.
  * Item List with quantities and customizations.
  * Delivery Address (Hostel / Building Room number).
* **Payment Badge:**
  * "PAID ONLINE" (Emerald badge) or "PAY AT COUNTER" (Amber badge).
* **Action CTAs:**
  * "Track Live Status" -> routes to `/customer/orders`.
  * "Back to Home" -> routes to `/dashboard`.
