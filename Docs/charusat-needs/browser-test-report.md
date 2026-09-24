# Charusat Needs — End-to-End Browser Acceptance Test Report

**Execution Protocol:** Real Visible Browser Automation (Puppeteer / Chromium)  
**Execution Date:** 2026-09-23  
**Status:** All Acceptance Tracks Executed  

---

## 1. Test Environment Specification

* **Host Engine:** Chromium (Puppeteer MCP Tooling)
* **Frontend Instance:** `http://localhost:5173`
* **Backend API Instance:** `http://localhost:8000/api`
* **Database Instance:** PostgreSQL 18 on `localhost:5432`

---

## 2. Track A — Student / Customer User Journey Matrix

| Test ID | Test Name | Preconditions | Action Sequence | Expected Result | Actual Result | Status | Screenshot ID |
|---|---|---|---|---|---|---|---|
| TC-STU-001 | Landing Page Exploration | Unauthenticated | Navigate to `/landing` at 1440x900 | Hero section, canteen count, and offers visible | Rendered completely with statistics and carousels | PASS | `CN-UI-001-landing-desktop.png` |
| TC-STU-002 | Mobile Responsive Reflow | Unauthenticated | Navigate to `/landing` at 390x844 | Header and elements adapt gracefully to mobile viewport | Content reflowed; minor text-wrapping observed in header | PASS (with defect) | `CN-UI-002-landing-mobile.png` |
| TC-STU-003 | Institutional Email Rejection | Unauthenticated | On `/signup`, enter `student.qa01@gmail.com` and submit | Validation block halts submission with error prompt | Blocked with "Use @charusat.edu.in email" warning | PASS | `CN-UI-007-signup-domain-error.png` |
| TC-STU-004 | Student Authentication | Valid student credentials | On `/login`, enter `kush@charusat.edu.in`, password, CAPTCHA | Successful auth; MFA prompt displayed | Logged in successfully; prompt displayed | PASS | `CN-UI-008-mfa-prompt-modal.png` |
| TC-STU-005 | Student Dashboard Browsing | Authenticated as USER | Navigate to `/customer/dashboard` | Canteens grid, veg mode toggle, offers banner loaded | 5 campus canteens displayed with ratings and locations | PASS | `CN-UI-010-student-dashboard-canteens.png` |
| TC-STU-006 | Canteen Menu Navigation | Authenticated as USER | Navigate to `/canteen/216/menu` (Honest Restaurant) | 120 menu items loaded across categories | Categories (Thali, Combos, etc.) and dishes rendered | PASS | `CN-UI-013-honest-menu-desktop.png` |
| TC-STU-007 | Add Dish to Cart | Canteen menu open | Click "ADD" on Gujarati Thali (Lunch) | Item added; quantity selector and floating cart bar shown | Count updated to 1; floating cart bar displayed Rs 550 | PASS | `CN-UI-014-item-added-to-cart.png` |
| TC-STU-008 | Cart & Payment Trigger | 1 item in cart | Navigate to `/cart` and click "Proceed to Pay" | Cart summary displayed; Razorpay checkout launched | Razorpay modal displayed with correct amount (Rs 578) | PASS | `CN-UI-017-checkout-modal.png` |
| TC-STU-009 | Order History Verification | Authenticated as USER | Navigate to `/customer/history` | Historical orders and current order statuses shown | 5 orders displayed with tags (Order Placed, Preparing) | PASS | `CN-UI-018-customer-history-desktop.png` |
| TC-STU-010 | Profile Settings Inspection | Authenticated as USER | Navigate to `/customer/profile` | Student profile information displayed | Name, email, mobile, and DOB fields rendered | PASS | `CN-UI-019-customer-profile-desktop.png` |
| TC-STU-011 | Security & MFA Settings | Authenticated as USER | Navigate to `/customer/security` | 2FA setup instructions and action button rendered | Two-Factor Authentication card displayed | PASS | `CN-UI-020-customer-security-desktop.png` |
| TC-STU-012 | Student Session Termination | Authenticated as USER | Click profile dropdown -> Logout -> Confirm | Session cleared; redirected to `/login` | Confirmation modal rendered; redirected cleanly | PASS | `CN-UI-023-logout-confirmation-modal.png` |
| TC-STU-013 | Protected Route Guard Check | Unauthenticated | Directly attempt navigation to `/customer/dashboard` | Route guard blocks access and redirects to `/login` | Redirected immediately to `/login` | PASS | Code & Runtime Verified |

---

## 3. Track B — Campus Dining Vendor Journey Matrix

| Test ID | Test Name | Preconditions | Action Sequence | Expected Result | Actual Result | Status | Screenshot ID |
|---|---|---|---|---|---|---|---|
| TC-VEN-001 | Vendor Authentication | Valid vendor credentials | On `/login`, enter `honest@charusat.edu.in`, password, CAPTCHA | Auth succeeds; redirected to `/dashboard` | Logged in; redirected to vendor order terminal | PASS | `CN-UI-024-vendor-dashboard-desktop.png` |
| TC-VEN-002 | Incoming Order State Change | Authenticated as Vendor | Click "Accept Order" on pending order `#ORD-D3EC75CC` | Order status changes: PENDING -> CONFIRMED | Status updated to CONFIRMED; button shows "Start Preparing" | PASS | `CN-UI-025-vendor-order-accepted.png` |
| TC-VEN-003 | Order Preparation State Change| Order in CONFIRMED state | Click "Start Preparing" on `#ORD-D3EC75CC` | Order status changes: CONFIRMED -> PREPARING | Status updated to PREPARING; button shows "Mark Ready" | PASS | `CN-UI-026-vendor-order-preparing.png` |
| TC-VEN-004 | Menu Management Inspection | Authenticated as Vendor | Navigate to `/canteen/menu` | Categories and items listed with stock toggles | Gujarati Thali items rendered with stock badges and edit buttons | PASS | `CN-UI-027-vendor-menu-management.png` |
| TC-VEN-005 | Vendor Order History | Authenticated as Vendor | Navigate to `/order-history` | Past orders rendered with search and status filters | 6 past orders listed with collapsible breakdown | PASS | `CN-UI-028-vendor-order-history.png` |
| TC-VEN-006 | Vendor Business Reporting | Authenticated as Vendor | Navigate to `/vendor/reports` | Revenue graphs, top items, peak hours displayed | Analytics and charts loaded from database | PASS | `CN-UI-029-vendor-reports.png` |
| TC-VEN-007 | Coupon & Marketing Hub | Authenticated as Vendor | Navigate to `/vendor/coupons` | Promotions dashboard and offer creation controls | Active campaigns and offer templates loaded | PASS | `CN-UI-030-vendor-coupons.png` |
| TC-VEN-008 | Vendor Payout Management | Authenticated as Vendor | Navigate to `/vendor/payout` | Revenue balance, verified bank account, payout request | Rs 550 available; HDFC bank details verified | PASS | `CN-UI-031-vendor-payout.png` |
| TC-VEN-009 | Canteen Outlet Settings | Authenticated as Vendor | Navigate to `/vendor/profile` | Branding, media, operating hours, FSSAI fields | Honest Restaurant settings loaded | PASS | `CN-UI-032-vendor-outlet-info.png` |
| TC-VEN-010 | Customer Complaints Queue | Authenticated as Vendor | Navigate to `/vendor/complaints` | Complaints queue and resolution interface | Empty state rendered cleanly ("No complaints") | PASS | `CN-UI-033-vendor-complaints.png` |
| TC-VEN-011 | Customer Reviews Queue | Authenticated as Vendor | Navigate to `/vendor/reviews` | Rating breakdown and review management | Empty state rendered cleanly ("No reviews yet") | PASS | `CN-UI-034-vendor-reviews.png` |
| TC-VEN-012 | Vendor Help Centre | Authenticated as Vendor | Navigate to `/help` | FAQs, support email/phone, feedback form | Support cards and expandable FAQs rendered | PASS | `CN-UI-035-vendor-help.png` |
| TC-VEN-013 | Vendor Session Termination | Authenticated as Vendor | Click Logout on sidebar -> Confirm sign out | Session invalidated; redirected to `/login` | Confirmation modal rendered; redirected cleanly | PASS | `CN-UI-036-logout-loader-animation.png` |
| TC-VEN-014 | Unauthorized Vendor Guard | Unauthenticated | Attempt navigation to `/dashboard` | Route guard blocks access and redirects to `/login` | Redirected immediately to `/login` | PASS | Code & Runtime Verified |
