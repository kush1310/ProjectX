# Charusat Needs — System Requirements Traceability Matrix (RTM)

**Execution Date:** 2026-09-23  
**Status:** Baseline Verification Complete  

---

## 1. Traceability Matrix

| Requirement | Evidence Label | Implementation File | Verification Test ID | Screenshot Reference | Status | Confidence |
|---|---|---|---|---|---|---|
| Institutional Email Restriction (`@charusat.edu.in`) | REPRODUCED & CODE-VERIFIED | `Frontend/src/pages/Signup.tsx`, `Backend/src/main/java/.../AuthController.java` | TC-STU-003 | `CN-UI-007-signup-domain-error.png` | PASS | High |
| Student Registration & Terms Agreement | OBSERVED & REPRODUCED | `Frontend/src/pages/Signup.tsx`, `TermsModal.tsx` | TC-STU-003 | `CN-UI-006-signup-invalid-domain.png` | PASS | High |
| User Authentication & CAPTCHA | OBSERVED & REPRODUCED | `Frontend/src/pages/Login.tsx`, `Backend/.../CaptchaService.java` | TC-STU-004 | `CN-UI-004-login-desktop.png` | PASS | High |
| Student Dashboard Canteen Discovery | OBSERVED | `Frontend/src/Canteen/pages/StudentDashboard.tsx` | TC-STU-005 | `CN-UI-010-student-dashboard-canteens.png` | PASS | High |
| Canteen Menu Exploration (120 items) | OBSERVED | `Frontend/src/Canteen/pages/CustomerMenuPage.tsx` | TC-STU-006 | `CN-UI-013-honest-menu-desktop.png` | PASS | High |
| Cart Management & Quantity Modification | OBSERVED & REPRODUCED | `Frontend/src/Canteen/pages/CartPage.tsx` | TC-STU-007 | `CN-UI-014-item-added-to-cart.png` | PASS | High |
| Digital Payment Integration (Razorpay Test Mode) | OBSERVED | `Frontend/src/Canteen/pages/CartPage.tsx`, `CheckoutModal.tsx` | TC-STU-008 | `CN-UI-017-checkout-modal.png` | PASS | High |
| Student Order History & Status | OBSERVED | `Frontend/src/Canteen/pages/CustomerOrderHistory.tsx` | TC-STU-009 | `CN-UI-018-customer-history-desktop.png` | PASS | High |
| Customer Profile Management | OBSERVED | `Frontend/src/Canteen/pages/CustomerProfile.tsx` | TC-STU-010 | `CN-UI-019-customer-profile-desktop.png` | PASS | High |
| Two-Factor Authentication Setup | OBSERVED | `Frontend/src/Canteen/pages/MfaSetupPage.tsx` | TC-STU-011 | `CN-UI-020-customer-security-desktop.png` | PASS | High |
| Student Session Invalidation | OBSERVED & REPRODUCED | `Frontend/src/Canteen/components/LogoutConfirmModal.tsx` | TC-STU-012 | `CN-UI-023-logout-confirmation-modal.png` | PASS | High |
| Client-Side Protected Route Guarding | REPRODUCED | `Frontend/src/components/ProtectedRoute.tsx` | TC-STU-013 | Code & Runtime Verified | PASS | High |
| Vendor Live Order Queue & Terminal | OBSERVED | `Frontend/src/Canteen/pages/Dashboard.tsx` | TC-VEN-001 | `CN-UI-024-vendor-dashboard-desktop.png` | PASS | High |
| Vendor Order Acceptance State Transition | OBSERVED & REPRODUCED | `Frontend/src/Canteen/pages/Dashboard.tsx`, `OrderController.java` | TC-VEN-002 | `CN-UI-025-vendor-order-accepted.png` | PASS | High |
| Vendor Order Preparation State Transition | OBSERVED & REPRODUCED | `Frontend/src/Canteen/pages/Dashboard.tsx`, `OrderController.java` | TC-VEN-003 | `CN-UI-026-vendor-order-preparing.png` | PASS | High |
| Vendor Menu Item & Category Management | OBSERVED | `Frontend/src/Canteen/pages/MenuManagement.tsx` | TC-VEN-004 | `CN-UI-027-vendor-menu-management.png` | PASS | High |
| Vendor Historical Order Audit | OBSERVED | `Frontend/src/Canteen/pages/OrderHistory.tsx` | TC-VEN-005 | `CN-UI-028-vendor-order-history.png` | PASS | High |
| Vendor Financial & Order Analytics | OBSERVED | `Frontend/src/Canteen/pages/VendorReporting.tsx` | TC-VEN-006 | `CN-UI-029-vendor-reports.png` | PASS | High |
| Vendor Marketing & Coupon Creation | OBSERVED | `Frontend/src/Canteen/pages/CouponApp.tsx` | TC-VEN-007 | `CN-UI-030-vendor-coupons.png` | PASS | High |
| Vendor Bank Settlement & Payout | OBSERVED | `Frontend/src/Canteen/pages/VendorPayout.tsx` | TC-VEN-008 | `CN-UI-031-vendor-payout.png` | PASS | High |
| Canteen Outlet Profile & Operating Hours | OBSERVED | `Frontend/src/Canteen/pages/VendorProfile.tsx` | TC-VEN-009 | `CN-UI-032-vendor-outlet-info.png` | PASS | High |
| Customer Complaints Management | OBSERVED | `Frontend/src/Canteen/pages/VendorComplaints.tsx` | TC-VEN-010 | `CN-UI-033-vendor-complaints.png` | PASS | High |
| Customer Reviews & Feedback Queue | OBSERVED | `Frontend/src/Canteen/pages/VendorReviews.tsx` | TC-VEN-011 | `CN-UI-034-vendor-reviews.png` | PASS | High |
| Vendor Help Centre & FAQs | OBSERVED | `Frontend/src/Canteen/pages/HelpPage.tsx` | TC-VEN-012 | `CN-UI-035-vendor-help.png` | PASS | High |
| Vendor Session Invalidation | OBSERVED & REPRODUCED | `Frontend/src/Canteen/components/LogoutConfirmModal.tsx` | TC-VEN-013 | `CN-UI-036-logout-loader-animation.png` | PASS | High |
| Vendor Role Isolation & Route Guard | REPRODUCED | `Frontend/src/components/ProtectedRoute.tsx` | TC-VEN-014 | Code & Runtime Verified | PASS | High |
| Application-Layer Payload Encryption | CODE-VERIFIED | `Frontend/src/utils/payloadCrypto.ts`, `Backend/.../PayloadCryptoService.java` | TC-STU-005 | Code & Runtime Verified | PASS | High |

---

## 2. Deep Security & Threat Defense Matrix

| Requirement | Evidence Label | Implementation File | Verification Test ID | Artifact Reference | Status | Confidence |
|---|---|---|---|---|---|---|
| Institutional Email Domain Regex Restriction | REPRODUCED & CODE-VERIFIED | `Backend/.../AuthController.java` | AUTH-REG-01 to 06 | `deep-security-test-report.md` | PASS | High |
| Login Enumeration Resistance & Generic Errors | OBSERVED & REPRODUCED | `Backend/.../AuthController.java` | AUTH-LOG-01, 02 | `deep-security-test-report.md` | PASS | High |
| CAPTCHA Generation & Single-Use Semantics | OBSERVED & REPRODUCED | `Backend/.../CaptchaController.java`, `CaptchaService.java` | CAPTCHA-01, 02 | `deep-security-test-report.md` | PASS | High |
| JWT HMAC-SHA256 Signature Tamper Defense | OBSERVED & REPRODUCED | `Backend/.../JwtAuthenticationFilter.java` | JWT-TAMPER-01 | `deep-security-test-report.md` | PASS | High |
| JWT Forged Role Claim Defense | OBSERVED & REPRODUCED | `Backend/.../JwtAuthenticationFilter.java` | JWT-TAMPER-02 | `deep-security-test-report.md` | PASS | High |
| Vendor Controller Method Security RBAC | CODE-VERIFIED & REPRODUCED | `Backend/.../VendorController.java` | RBAC-ESCALATE-01 | `deep-security-test-report.md` | PASS | High |
| Coupon Creation Method Security RBAC | CODE-VERIFIED & REPRODUCED | `Backend/.../CouponController.java` | RBAC-ESCALATE-02 | `deep-security-test-report.md` | PASS | High |
| Order Status Update Method Security RBAC | CODE-VERIFIED & REPRODUCED | `Backend/.../OrderController.java` | RBAC-ESCALATE-03 | `deep-security-test-report.md` | PASS | High |
| Object-Level Authorization / Non-Owned Order IDOR | OBSERVED & REPRODUCED | `Backend/.../OrderService.java` | IDOR-ORDER-01 | `deep-security-test-report.md` | PASS | High |
| SQL Injection Defense via Parameterized Queries | CODE-VERIFIED & TESTED | `Backend/.../MenuItemRepository.java` | SQLI-SEARCH-01 | `deep-security-test-report.md` | PASS | High |
| Reflected XSS Neutralization in API Parameters | OBSERVED & TESTED | `Backend/.../PublicController.java` | XSS-REFLECT-01 | `deep-security-test-report.md` | PASS | High |
| Path Traversal Defense via URL Sanitization | OBSERVED & REPRODUCED | `Backend/.../UrlSanitizationFilter.java` | PATH-TRAVERSAL-01 | `deep-security-test-report.md` | PASS | High |
| Malformed Payload / Enum Deserialization Defense | CODE-VERIFIED & REPRODUCED | `Backend/.../GlobalExceptionHandler.java` | VAL-MALFORMED-PAYLOAD | `deep-security-test-report.md` | PASS | High |
| Negative Item Quantity Validation (@Min) | CODE-VERIFIED & REPRODUCED | `Backend/.../CartController.java` | VAL-NEGATIVE-QTY | `deep-security-test-report.md` | PASS | High |
| AES-256-GCM Round-Trip Cryptography | MEASURED & VERIFIED | `Backend/.../PayloadCryptoService.java` | CRYPTO-GCM-01 | `deep-security-test-report.md` | PASS | High |
| AES-256-GCM 1-Bit Ciphertext Tamper Detection | MEASURED & VERIFIED | `Backend/.../PayloadCryptoService.java` | CRYPTO-GCM-02 | `deep-security-test-report.md` | PASS | High |
| AES-256-GCM Truncated Ciphertext Rejection | MEASURED & VERIFIED | `Backend/.../PayloadCryptoService.java` | CRYPTO-GCM-03 | `deep-security-test-report.md` | PASS | High |
| Razorpay Timing-Safe HMAC Signature Verification | CODE-VERIFIED & TESTED | `Backend/.../PaymentService.java` | PAY-VERIFY-01 | `deep-security-test-report.md` | PASS | High |

---

## 3. Transaction Integrity, Resilience & Recovery Matrix

| Requirement | Evidence Label | Implementation File | Verification Test ID | Artifact Reference | Status | Confidence |
|---|---|---|---|---|---|---|
| Concurrent Rapid Cart Additions (Double-Click) | MEASURED & TESTED | `Backend/.../CartService.java` | TX-CONCURRENCY-01 | `transaction-integrity-report.md` | PASS | High |
| Payment Creation Idempotency Key Tracking | CODE-VERIFIED | `Backend/.../PaymentService.java` | PAY-IDEMP-01 | `transaction-integrity-report.md` | PASS | High |
| Server-Authoritative Cart Total Calculation | CODE-VERIFIED | `Backend/.../CartService.java` | CART-AUTH-01 | `transaction-integrity-report.md` | PASS | High |
| Authoritative Coupon Discount Cap Recalculation | CODE-VERIFIED | `Backend/.../CouponService.java` | COUPON-AUTH-01 | `transaction-integrity-report.md` | PASS | High |
| Deterministic Database Health Probe (`SELECT 1`) | OBSERVED & MEASURED | `Backend/.../HealthController.java` | HEALTH-PROBE-01 | `resilience-and-disaster-recovery-report.md` | PASS | High |
| Non-Breaking Schema Migration (Expand-Migrate-Contract) | CONFIG-VERIFIED | `Docs/charusat-needs/resilience-...` | ARCH-MIGRATE-01 | `resilience-and-disaster-recovery-report.md` | PASS | High |
| Zero-Downtime Atomic Frontend Rollback | CONFIG-VERIFIED | `Docs/charusat-needs/nginx-production.conf` | ARCH-ROLLBACK-01 | `resilience-and-disaster-recovery-report.md` | PASS | High |
| Sub-Minute Containerized Backend Rollback | CONFIG-VERIFIED | `Docs/charusat-needs/resilience-...` | ARCH-ROLLBACK-02 | `resilience-and-disaster-recovery-report.md` | PASS | High |
| Live Payment Settlement Onboarding | BLOCKED | `Backend/.../RazorpayConfig.java` | EXT-DEP-01 | `production-security-signoff.md` | OPEN (DEPENDENCY) | High |
| Automated Gateway Refund Processing | BLOCKED | `Backend/.../PaymentService.java` | EXT-DEP-02 | `production-security-signoff.md` | OPEN (DEPENDENCY) | High |
| Campus Enterprise SMTP Integration | BLOCKED | `Backend/.../resources/application.properties` | EXT-DEP-03 | `production-security-signoff.md` | OPEN (DEPENDENCY) | High |

