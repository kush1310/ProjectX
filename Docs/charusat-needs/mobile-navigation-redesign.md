# Charusat Needs — Mobile Navigation Architecture Redesign

**Document Version:** 1.0.0  
**Effective Date:** 2026-09-24  
**Classification:** UX/UI & Mobile Ergonomics Specification  

---

## 1. Baseline Defect Analysis & Forensic Context

In the baseline application layout (identified in prompt Section 2 and verified in UI review), the Cart destination suffered from duplicate navigation entry points:

### Baseline Structure (Problematic)
* **Top Header:** `CharusatNeeds Brand | Location | Notification Bell | Cart Icon`
* **Bottom Navigation Bar:** `Home | Offers | Orders | Cart | Profile` (5 items)

This redundancy caused customer confusion, wasted precious horizontal space on compact mobile viewports (360px–390px widths), and violated the core mobile design principle:
> **"One purpose, one canonical location."**

---

## 2. Redesigned Mobile Navigation Architecture

The redesign establishes a single canonical entry point for checkout while optimizing bottom navigation touch ergonomics.

```text
=============================================================
TOP HEADER (Sticky / Elevated)
-------------------------------------------------------------
[Brand: CharusatNeeds]               [Notification]  [Cart (3)]
=============================================================
MAIN CONTENT (Scrollable)
...
=============================================================
BOTTOM NAVIGATION (Fixed / Safe-Area Aware)
-------------------------------------------------------------
  [Home]          [Offers]          [Orders]         [Profile]
    *                
=============================================================
```

### 2.1 Top Header Specifications
* **Position:** Fixed top with `backdrop-blur-md bg-white/95` and subtle bottom divider (`border-b border-gray-100`).
* **Canonical Cart Entry Point:**
  * Lucide `ShoppingCart` icon.
  * Live Item Count Badge: Rendered as an elevated red circle with white bold text (`bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full -top-1.5 -right-1.5`).
  * Only rendered when cart has items (`count > 0`).
  * Minimum tap target size: 44 × 44 CSS pixels.
* **Notification Bell:**
  * Lucide `Bell` icon with unread indicator dot.

### 2.2 Bottom Navigation Bar Specifications
* **Item Count:** Exactly 4 destinations:
  1. **Home (`/dashboard`):** Lucide `Home` icon.
  2. **Offers (`/customer/offers`):** Lucide `Tag` icon.
  3. **Orders (`/customer/orders`):** Lucide `ShoppingBag` icon.
  4. **Profile (`/customer/profile`):** Lucide `User` icon.
* **Active State Presentation:**
  * Active icon and label tinted with primary brand red (`text-red-600 font-bold`).
  * Inactive items rendered in balanced neutral slate (`text-gray-500 font-medium`).
  * Active indicator: A subtle 4px red dot centered directly below the active tab label (`h-1 w-1 rounded-full bg-red-600 mt-0.5`).
* **Safe-Area Insets:** Incorporates `pb-[env(safe-area-inset-bottom)]` to prevent clipping on iPhone home indicators and modern Android gesture navigation bars.
* **Touch Target Verification:** Each tab column spans 25% viewport width with a minimum interactive vertical height of 56px.
