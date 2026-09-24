# Charusat Needs — Cart Experience Redesign Specification

**Document Version:** 1.0.0  
**Effective Date:** 2026-09-24  
**Classification:** UX/UI Specification  
**Design Reference:** Zomato Food Commerce Information Architecture  

---

## 1. Information Hierarchy & Layout Structure

The redesigned Cart page transforms from a rudimentary tabular view into a modern, dense, high-clarity transactional surface.

### 1.1 Responsive Layout Composition

#### Desktop Viewport (>= 1024px)
* **Two-Column Asymmetric Grid:**
  * **Left Column (60%):** Canteen details header, Item Stepper list, Delivery Address & Instructions, Order Timing Selector (ASAP vs Schedule).
  * **Right Column (40% - Sticky):** Coupon Apply Card, Comprehensive Bill Summary, Primary Checkout CTA button.

#### Mobile Viewport (< 768px)
* **Single Column Flow with Sticky Bottom Bar:**
  1. Header: Back button, Canteen Name & Estimated Time.
  2. Order Timing Segmented Pills (`ASAP` vs `Schedule for later`).
  3. Item List with individual Stepper Controls (`[-] 1 [+]`).
  4. Delivery Instruction text area.
  5. Coupon Banner ("Apply Coupon / View Offers").
  6. Detailed Bill Breakdown card.
  7. Cancellation policy reminder note.
  8. Sticky Footer: Selected total amount on the left, high-contrast Red Pill "Proceed to Pay" button on the right.

---

## 2. Core Interactive Components

### 2.1 Quantity Stepper Control
* Implemented using a compact, rounded neumorphic pill container (`rounded-lg bg-red-50 border border-red-200 text-red-600 font-bold`).
* Direct decrement `[-]` reduces quantity; hitting 0 triggers item removal with an immediate total recalculation.
* Direct increment `[+]` increases count subject to stock limits.

### 2.2 Order Timing Control (Feature A Integration)
* Segmented button toggle:
  * `[ ASAP ]` (Icon: Lightning bolt / timer) -> Delivers within standard canteen prep time (approx 20 mins).
  * `[ Schedule for later ]` (Icon: Calendar) -> Expands slot selector.
* Slot Selector reveals:
  * Day selection: `Today` | `Tomorrow`.
  * Time chips: 30-minute intervals (`11:30 AM`, `12:00 PM`, `12:30 PM`, `01:00 PM`, etc.) dynamically filtered to eliminate past slots.

### 2.3 Transparent Bill Breakdown
Visual clarity without hidden fees:
* **Item Total:** Gross sum of all cart item lines.
* **Taxes & Restaurant Charges:** Explicit 5% GST calculation.
* **Delivery Fee:** Campus delivery flat rate (displayed with green "FREE" badge for orders meeting threshold).
* **Coupon Discount:** Rendered in bold emerald green (`- ₹XX.XX`) when active.
* **Grand Total:** Prominent numeric price with currency symbol (`₹`).

---

## 3. Empty Cart State Experience

When the cart contains zero items:
* Clean centered graphic illustration.
* Headline: "Your cart is empty".
* Subtext: "Looks like you have not added anything to your cart yet. Explore delicious meals from your favorite campus canteens!"
* Primary Action: Red pill button "Explore Canteens" navigating directly to `/dashboard`.
