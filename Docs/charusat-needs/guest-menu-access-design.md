# Charusat Needs — Guest Menu Access & Discovery Design

**Document Version:** 1.0.0  
**Effective Date:** 2026-09-24  
**Classification:** Product Experience & Security Architecture  

---

## 1. Executive Summary & Problem Context

Prior versions of the Charusat Needs application gated all routes behind mandatory authentication (`/login`), preventing prospective students, visitors, or non-logged-in users from exploring canteen menus, pricing, dietary options, and current promotions. This created significant friction and cart abandonment.

The modern food-commerce pattern requires:
> **Discovery is Public; Checkout is Authenticated.**

Guests must be able to explore canteens, browse dishes, view dietary flags (veg/non-veg), check prices, and construct a preliminary cart. Authentication is enforced only when placing an order or accessing personal user history.

---

## 2. Public vs Authenticated Boundary Specification

```text
[ Guest User ]
      |
      +---> GET /api/canteens -----------------> [ PUBLIC: 200 OK ]
      |
      +---> GET /api/canteens/{id}/menu --------> [ PUBLIC: 200 OK ]
      |
      +---> GET /api/coupons/active -----------> [ PUBLIC: 200 OK ]
      |
      +---> Build Cart in Browser LocalState --> [ PERMITTED ]
      |
      +---> Click "Proceed to Pay" ------------> [ AUTHENTICATION GATE ]
                                                        |
                                                        v
                                              Modal: "Login Required"
                                                        |
                                                        v
                                              Login with CHARUSAT ID
                                                        |
                                                        v
                                              Cart Restored & Proceed
```

### 2.1 Endpoint Authorization Policy

| Endpoint | Method | Guest Access | Auth Role Required | Security Controls |
|---|---|---|---|---|
| `/api/canteens` | GET | Allowed | None | Sanitized outlet info only. No bank/payout data. |
| `/api/canteens/{id}/menu` | GET | Allowed | None | Item name, price, category, veg status, image. |
| `/api/coupons/active` | GET | Allowed | None | Code, discount type, min order. |
| `/api/orders` | POST | Denied (403) | `ROLE_STUDENT`, `ROLE_CUSTOMER` | Requires valid JWT token. Server revalidation. |
| `/api/orders/user/**` | GET | Denied (403) | `ROLE_STUDENT` | Authenticated customer history only. |
| `/api/cart/**` | POST/PUT | Denied (403) | Authenticated | Server cart sync requires authenticated user. |

---

## 3. Client-Side State Preservation Flow

To ensure guests do not lose their selections after authenticating:

1. **Local State Retention:** Cart items, selected canteen ID, selected delivery address, and scheduled time preference are maintained in `localStorage` under `charusat_cart_state`.
2. **Checkout Interception:**
   ```typescript
   if (!user) {
     setShowLoginPrompt(true);
     return;
   }
   ```
3. **Redirect with Context:** When navigating to `/login`, the return path is recorded via URL search param (`/login?redirect=/cart`).
4. **Post-Login Restoration:**
   * Upon successful login and token reception, the application redirects the user directly back to `/cart`.
   * The local cart state is inspected and synchronized with the backend.
   * Server validates item pricing, availability, and canteen operational status.
   * User immediately proceeds to payment without having to re-add items.

---

## 4. Institutional Security Preservation

Guest menu discovery does NOT weaken the core institutional security model:
* **Email Restriction:** Student registration and login remain strictly restricted to `@charusat.edu.in`.
* **Zero Sensitive Exposure:** The public endpoints return DTOs stripped of:
  * Vendor bank account and settlement numbers.
  * Vendor personal mobile numbers.
  * Internal commission structures.
  * Administrative telemetry flags.
* **Server Authoritative Billing:** Even if a guest attempts to manipulate client-side prices in localStorage, the backend order creation controller re-queries active database prices and recalculates subtotals, taxes, and coupon discounts from authoritative records.
