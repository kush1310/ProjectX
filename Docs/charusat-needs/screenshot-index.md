# Charusat Needs — Forensic Screenshot Index and Visual Artifact Register

**Timestamp:** 2026-09-23  
**Capture Methodology:** Real Visible Chromium Browser via Puppeteer Automation  

---

## 1. Visual Evidence Register

| Screenshot ID | Route | Role | Viewport | State | Description & Key Findings | Related Test ID | Related Defect ID |
|---|---|---|---|---|---|---|---|
| `CN-UI-001-landing-desktop.png` | `/landing` | Public | 1440 x 900 | Loaded | Desktop hero with flash offer banner, live statistics counter (5+ canteens, 258+ dishes), and trust indicators. | TC-STU-001 | None |
| `CN-UI-002-landing-mobile.png` | `/landing` | Public | 390 x 844 | Loaded | Mobile viewport inspection. Shows content reflow; observed header text wrapping on CTA buttons. | TC-STU-002 | CN-DEF-001 |
| `CN-UI-003-landing-tablet.png` | `/landing` | Public | 768 x 1024 | Loaded | Tablet viewport inspection. Balanced two-column hero reflow. | TC-STU-001 | None |
| `CN-UI-004-login-desktop.png` | `/login` | Public | 1440 x 900 | Idle | Login interface with email input, password input, dynamic CAPTCHA challenge (`2KW998`), and remember me toggle. | TC-STU-004 | None |
| `CN-UI-005-signup-desktop.png` | `/signup` | Public | 1440 x 900 | Idle | Registration interface with full name, 10-digit mobile (+91), email, password, confirm password, and terms checkbox. | TC-STU-003 | None |
| `CN-UI-006-signup-invalid-domain.png` | `/signup` | Public | 1440 x 900 | Submitted | Terms and Conditions modal displayed upon submission with `student.qa01@gmail.com`. | TC-STU-003 | None |
| `CN-UI-007-signup-domain-error.png` | `/signup` | Public | 1440 x 900 | Error | Visual validation error prompt: "Use @charusat.edu.in email" displayed under email field with yellow border. | TC-STU-003 | None |
| `CN-UI-008-mfa-prompt-modal.png` | `/login` | Public | 1440 x 900 | Modal | Post-login Two-Factor Authentication prompt modal offering "Set up now" or "I'll do this later". | TC-STU-004 | None |
| `CN-UI-009-student-dashboard-desktop.png` | `/customer/dashboard` | Student | 1440 x 900 | Loaded | Student dashboard header, veg mode toggle, search bar, filter pills, hero carousel, and active coupons list. | TC-STU-005 | None |
| `CN-UI-010-student-dashboard-canteens.png` | `/customer/dashboard` | Student | 1440 x 900 | Scrolled | All Canteens grid featuring Honest Restaurant, Campus Bites, Spice Junction, Patel Puff, and Go Hunger Cafe. | TC-STU-005 | None |
| `CN-UI-011-customer-offers-desktop.png` | `/customer/offers` | Student | 1440 x 900 | Loaded | Offers & Discounts page displaying 11 active coupons (WELCOME50, THALI100, FEAST200) with copy and apply buttons. | TC-STU-005 | None |
| `CN-UI-012-canteen-menu-desktop.png` | `/canteen/1/menu` | Student | 1440 x 900 | Empty | Canteen menu route with non-existent ID 1; shows zero dishes empty state. | TC-STU-006 | None |
| `CN-UI-013-honest-menu-desktop.png` | `/canteen/216/menu` | Student | 1440 x 900 | Loaded | Honest Restaurant menu with 120 dishes across categories (Gujarati Thali, Combo Meals, South Indian, Starters). | TC-STU-006 | None |
| `CN-UI-014-item-added-to-cart.png` | `/canteen/216/menu` | Student | 1440 x 900 | Interactive | Item added to cart; quantity selector active (- 1 +) and floating cart summary bar displayed (Rs 550 total). | TC-STU-007 | None |
| `CN-UI-015-cart-desktop.png` | `/cart` | Student | 1440 x 900 | Loaded | Cart page with campus delivery location, order breakdown, coupon application card, and "Proceed to Pay Rs 578" button. | TC-STU-008 | None |
| `CN-UI-016-cart-coupon-applied.png` | `/cart` | Student | 1440 x 900 | Interactive | Cart coupon selection interface showing available canteen offers. | TC-STU-008 | None |
| `CN-UI-017-checkout-modal.png` | `/cart` | Student | 1440 x 900 | Modal | Razorpay checkout popup (Test Mode) displaying contact details and UPI payment option for Rs 578. | TC-STU-008 | None |
| `CN-UI-018-customer-history-desktop.png` | `/customer/history` | Student | 1440 x 900 | Loaded | Student order history page listing 5 orders with live status badges (Order Placed, Preparing, Paid). | TC-STU-009 | None |
| `CN-UI-019-customer-profile-desktop.png` | `/customer/profile` | Student | 1440 x 900 | Loaded | Student profile page with editable fields (Full Name, Mobile, Email with Verified badge, DOB, Gender). | TC-STU-010 | None |
| `CN-UI-020-customer-security-desktop.png` | `/customer/security` | Student | 1440 x 900 | Loaded | 2FA management card. Shows excessive unconstrained whitespace in large desktop viewports. | TC-STU-011 | CN-DEF-002 |
| `CN-UI-021-user-dropdown.png` | `/customer/dashboard` | Student | 1440 x 900 | Interactive | Profile header action area. | TC-STU-012 | None |
| `CN-UI-022-profile-dropdown-open.png` | `/customer/security` | Student | 1440 x 900 | Open | Expanded user profile dropdown displaying student name, email, Profile, Order History, Security, and Logout links. | TC-STU-012 | None |
| `CN-UI-023-logout-confirmation-modal.png` | `/customer/security` | Student | 1440 x 900 | Modal | Glassmorphic logout confirmation dialog asking "Sign out? You'll need to sign in again to access your account." | TC-STU-012 | None |
| `CN-UI-024-vendor-dashboard-desktop.png` | `/dashboard` | Vendor | 1440 x 900 | Loaded | Campus vendor order terminal with 4 live order cards across statuses with "Accept Order" and "Mark Ready" buttons. | TC-VEN-001 | None |
| `CN-UI-025-vendor-order-accepted.png` | `/dashboard` | Vendor | 1440 x 900 | Interactive | Order `#ORD-D3EC75CC` accepted; status transitioned from PENDING to CONFIRMED; button shows "Start Preparing". | TC-VEN-002 | None |
| `CN-UI-026-vendor-order-preparing.png` | `/dashboard` | Vendor | 1440 x 900 | Interactive | Order `#ORD-D3EC75CC` moved to preparation; status shows PREPARING; button shows "Mark Ready". | TC-VEN-003 | None |
| `CN-UI-027-vendor-menu-management.png` | `/canteen/menu` | Vendor | 1440 x 900 | Loaded | Vendor menu catalogue editor with category tabs, dish cards, prices, and In Stock status toggles. | TC-VEN-004 | None |
| `CN-UI-028-vendor-order-history.png` | `/order-history` | Vendor | 1440 x 900 | Loaded | Historical vendor orders list with collapsible itemized cards and search functionality. | TC-VEN-005 | None |
| `CN-UI-029-vendor-reports.png` | `/vendor/reports` | Vendor | 1440 x 900 | Loaded | Financial analytics dashboard with revenue trends, order status breakdown donut chart, and top 5 items. | TC-VEN-006 | None |
| `CN-UI-030-vendor-coupons.png` | `/vendor/coupons` | Vendor | 1440 x 900 | Loaded | Vendor Marketing Hub with campaign presets, active discount cards, and new offer creator. | TC-VEN-007 | None |
| `CN-UI-031-vendor-payout.png` | `/vendor/payout` | Vendor | 1440 x 900 | Loaded | Vendor payout terminal with revenue summary, verified HDFC bank details, and Request Payout CTA. | TC-VEN-008 | None |
| `CN-UI-032-vendor-outlet-info.png` | `/vendor/profile` | Vendor | 1440 x 900 | Loaded | Restaurant settings page with branding images, operating hours (08:00 AM - 10:00 PM), and FSSAI details. | TC-VEN-009 | None |
| `CN-UI-033-vendor-complaints.png` | `/vendor/complaints` | Vendor | 1440 x 900 | Empty | Customer complaints queue displaying intentional empty state ("No complaints"). | TC-VEN-010 | None |
| `CN-UI-034-vendor-reviews.png` | `/vendor/reviews` | Vendor | 1440 x 900 | Empty | Customer reviews dashboard with rating breakdown and intentional empty state ("No reviews yet"). | TC-VEN-011 | None |
| `CN-UI-035-vendor-help.png` | `/help` | Vendor | 1440 x 900 | Loaded | Vendor help centre with contact cards, 8 FAQ accordions, and feedback submission interface. | TC-VEN-012 | None |
| `CN-UI-036-logout-loader-animation.png` | `/help` | Vendor | 1440 x 900 | Modal | Logout progress dialog showing "Securely logging you out... Clearing your session data". | TC-VEN-013 | CN-DEF-003 |
| `CN-UI-037-after-landing-mobile.png` | `/` | Public | 390 x 844 | Loaded | Post-modernization mobile landing page. Clean header with brand logo, compact Register button, and hamburger toggle. | TC-MOD-001 | CN-DEF-001 |
| `CN-UI-038-after-landing-mobile-drawer.png` | `/` | Public | 390 x 844 | Interactive | Post-modernization open mobile navigation drawer displaying navigation links, partner CTA, and auth actions. | TC-MOD-001 | CN-DEF-001 |
| `CN-UI-039-after-mfa-desktop.png` | `/customer/security` | Student | 1440 x 900 | Loaded | Post-modernization MFA setup card. Elegant max-w-2xl container with rounded-3xl corners, border, and shadow. | TC-MOD-002 | CN-DEF-002 |
| `CN-UI-040-after-logout-modal.png` | `/dashboard` | Vendor | 1440 x 900 | Modal | Post-modernization vendor logout confirmation dialog with accelerated 650ms progress and redirect. | TC-MOD-003 | CN-DEF-003 |
