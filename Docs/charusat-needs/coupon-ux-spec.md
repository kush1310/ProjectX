# Charusat Needs — Coupon & Offers UX Specification

**Document Version:** 1.0.0  
**Effective Date:** 2026-09-24  
**Classification:** UX/UI & Promotion Engine Specification  

---

## 1. Information Architecture & Discovery

Coupons are elevated from a hidden text input to an active discovery component within the Cart and Checkout journey.

### 1.1 Cart Coupon Banner
* Embedded between the item list and bill details.
* Styled as an elevated card with dashed border or ticket stub aesthetics (`border border-dashed border-red-300 bg-red-50/50`).
* Displays current status:
  * Unapplied: "Apply Coupon" with badge indicating count of eligible offers (e.g., "3 offers available").
  * Applied: Active coupon pill displaying code (e.g., `SAVE50`), discount amount (`- ₹50.00`), and a clear `[ Remove ]` button.

---

## 2. Coupon Drawer / Sheet Experience

Tapping "Apply Coupon" opens a mobile-optimized Bottom Sheet (or modal dialog on desktop) displaying:

1. **Custom Code Entry:**
   * Text input with automatic uppercase transformation.
   * "APPLY" CTA button with inline spinner.
2. **Available Campus Offers List:**
   * Each offer card displays:
     * Coupon Code badge (e.g., `CHARUSAT50`, `WELCOME20`).
     * Offer Title: "Flat ₹50 OFF on orders above ₹199".
     * Validity and expiry countdown.
     * Applicable canteen restrictions (e.g., "Valid at Honest Restaurant and Campus Food Court").
     * Eligibility State:
       * **Eligible:** Active red "APPLY" pill button.
       * **Ineligible:** Disabled pill displaying precise shortfall reason (e.g., "Add items worth ₹45 more to apply this coupon").

---

## 3. Server-Authoritative Validation Engine

To eliminate coupon abuse and timing race conditions:
1. **Never Trust Client Calculations:** The client displays estimated discount preview, but the final total is recalculated and authorized exclusively by `CouponService.java` on order submission.
2. **Server Validation Checks:**
   * Coupon exists and `is_active == true`.
   * Current server timestamp is within `valid_from` and `valid_until`.
   * Order total meets or exceeds `min_order_amount`.
   * User redemption count does not exceed `max_uses_per_user`.
   * Target canteen ID matches coupon canteen scope (or global if null).
3. **Discount Recalculation on Quantity Modification:**
   * If an item is decremented or removed in the cart such that the subtotal drops below the coupon's minimum threshold, the coupon is automatically disqualified and the bill is dynamically refreshed with an explanatory toast notification.
