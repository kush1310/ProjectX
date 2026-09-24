# Charusat Needs — Forensic Current-State Technical and Experiential Audit Report

**Date of Execution:** 2026-09-23  
**Auditor:** Senior Principal Systems Architect and QA/UX Auditor  
**Scope:** Frontend (Vite + React + TypeScript), Backend (Spring Boot 3 + Java 21), Database (PostgreSQL 18), Real-Time WebSockets (STOMP), Security/Cryptography, Performance Benchmarking, and UX/UI Evaluation.

---

## 1. Executive Summary

This audit establishes a verified baseline for **Charusat Needs**, a campus food aggregator and commerce system serving the CHARUSAT university ecosystem. The system connects university students and campus vendors (canteens and cafeterias) across CSPIT, DEPSTAR, and campus dining outlets.

The application has been verified active with the Spring Boot API service running on port 8000 and the Vite development server running on port 5173. Behavioral validation was executed through a visible Chromium browser via Puppeteer automation.

All user and vendor identities require strictly institutional `@charusat.edu.in` credentials. Both client-side and server-side validation layers enforce this constraint.

---

## 2. System Inventory

| Component | Technology | Version | Location / Port | Evidence Label |
|---|---|---|---|---|
| Frontend Runtime | Node.js | v22.23.2 | Port 5173 | MEASURED |
| Frontend Framework | React + Vite | React 18.3.1 / Vite 6.0.5 | `Frontend/` | CODE-VERIFIED |
| Frontend Language | TypeScript | ~5.6.2 | `Frontend/src/` | CODE-VERIFIED |
| Styling Architecture | Tailwind CSS | 3.4.1 | `Frontend/tailwind.config.js` | CODE-VERIFIED |
| Backend Runtime | OpenJDK / Java | Java 21.0.12 LTS | Port 8000 | MEASURED |
| Backend Framework | Spring Boot | 3.2.2 | `Backend/pom.xml` | CODE-VERIFIED |
| Database Engine | PostgreSQL | PostgreSQL 18.x | Port 5432 (`charusatneeds`) | DATA-VERIFIED |
| ORM / Persistence | Spring Data JDBC + JdbcTemplate | 3.2.2 | `Backend/src/main/java/` | CODE-VERIFIED |
| Security & Auth | Spring Security + JJWT + AES-256-GCM | JJWT 0.12.3 | Port 8000 `/api/auth/*` | CODE-VERIFIED |
| Real-time Broker | Spring STOMP / WebSockets | SockJS | `/ws` | CODE-VERIFIED |
| Payment Gateway | Razorpay Java SDK | 1.4.5 (Test Mode active) | `Backend/pom.xml` | CODE-VERIFIED |

---

## 3. Current Architecture

### 3.1 Network Topology & Gateway Boundaries
* **Client Layer:** Single-Page Application (SPA) compiled with Vite and executed in modern browsers.
* **Payload Encryption Layer:** Symmetric AES-256-GCM encryption with 12-byte random IV applied to sensitive JSON HTTP payloads exchanged between Axios interceptors and `PayloadCryptoFilter`.
* **Security Filter Chain:**
  1. `UrlSanitizationFilter` (prevents path traversal and CRLF injection)
  2. `SecurityHeadersFilter` (CSP, X-Frame-Options, HSTS, X-Content-Type-Options)
  3. `PayloadEncryptionFilter` (AES-256-GCM decryption/encryption)
  4. `JwtAuthenticationFilter` (stateless Bearer token validation)
  5. `RateLimiterService` (token-bucket IP and account rate limiting)
* **REST Controllers Layer:** Exposes endpoints under `/api/*` for auth, canteens, cart, orders, coupons, reviews, and analytics.
* **Database Layer:** PostgreSQL database with normalized 3NF relations, foreign keys, and indexes.

---

## 4. Route and Feature Inventory

### 4.1 Public Routes
* `/` -> `RootRedirect` (Redirects to role dashboard or `/landing`) [OBSERVED]
* `/landing` -> `LandingPage` (Campus food aggregator marketing hero, statistics, testimonials) [OBSERVED]
* `/login` -> `Login` (Email, password, dynamic CAPTCHA, lockout protection, MFA challenge) [OBSERVED]
* `/signup` -> `Signup` (Full name, 10-digit mobile, `@charusat.edu.in` email, password, terms modal) [OBSERVED]
* `/forgot-password` -> `ForgotPassword` (Institutional email reset request) [CODE-VERIFIED]
* `/reset-password` -> `ResetPassword` (Token-based password reset form) [CODE-VERIFIED]
* `/verify-email` -> `VerifyEmailPage` (Email verification token validation) [CODE-VERIFIED]

### 4.2 Student / Customer Routes (Role: USER)
* `/customer/dashboard` -> `StudentDashboard` (Hero banner, canteens grid, veg mode toggle, offers carousel) [OBSERVED]
* `/customer/profile` -> `CustomerProfile` (Profile picture, student details, DOB, contact) [OBSERVED]
* `/canteen/:id/menu` -> `CustomerMenuPage` (Category breakdown, dish cards, veg badges, add-to-cart buttons) [OBSERVED]
* `/customer/history` -> `CustomerOrderHistory` (Order status tracking, previous orders, receipts) [OBSERVED]
* `/customer/offers` -> `CustomerOffers` (System offers, promo codes, direct apply triggers) [OBSERVED]
* `/cart` -> `CartPage` (Item list, quantity controls, delivery campus location, Razorpay checkout modal) [OBSERVED]
* `/customer/security` -> `MfaSetupPage` (TOTP authenticator setup, QR code generator) [OBSERVED]

### 4.3 Vendor Routes (Role: CANTEEN_OWNER)
* `/dashboard` -> `Dashboard` (Live incoming order queue, sound alerts, status transitions: Pending -> Confirmed -> Preparing -> Ready -> Completed) [OBSERVED]
* `/canteen/menu` -> `MenuManagement` (Category and menu item management, stock toggle, price edits) [OBSERVED]
* `/order-history` -> `OrderHistory` (Historical orders list with search and status filters) [OBSERVED]
* `/vendor/reports` -> `VendorReporting` (Revenue graphs, order volume, peak hours, sales breakdown) [OBSERVED]
* `/vendor/coupons` -> `CouponApp` (Promotions hub, coupon creation, discount rules) [OBSERVED]
* `/vendor/payout` -> `VendorPayout` (Bank account settlement, earnings calculation, payout requests) [OBSERVED]
* `/vendor/profile` -> `VendorProfile` (Operating hours, canteen description, banner images, FSSAI compliance) [OBSERVED]
* `/vendor/complaints` -> `VendorComplaints` (Student feedback and complaint resolution queue) [OBSERVED]
* `/vendor/reviews` -> `VendorReviews` (Rating metrics, student reviews, vendor replies) [OBSERVED]
* `/help` -> `HelpPage` (FAQ accordions, university support contact, bug reporting) [OBSERVED]

---

## 5. Institutional Domain Enforcement Assessment

### Policy Requirement
All accounts (Student and Vendor) must belong to the `@charusat.edu.in` domain.

### Empirical Test Results
1. **Frontend Validation Test (`Signup.tsx`):**
   * Input: `student.qa01@gmail.com`
   * Result: Immediate validation block with visual prompt: `Use @charusat.edu.in email` [REPRODUCED]
   * Screenshot ID: `CN-UI-007-signup-domain-error.png` [OBSERVED]
2. **Backend Validation Test (`AuthController.java` & `RegisterRequest.java`):**
   * Code check: `if (!email.endsWith("@charusat.edu.in")) return badRequest("Only @charusat.edu.in emails are allowed");` [CODE-VERIFIED]
   * Annotation check: `@Pattern(regexp = ".*@charusat\\.edu\\.in$", message = "Only @charusat.edu.in emails are allowed")` [CODE-VERIFIED]
3. **Database Seed Data (`DataInitializer.java`):**
   * Admin: `admin@charusat.edu.in` [DATA-VERIFIED]
   * Student: `kush@charusat.edu.in` [DATA-VERIFIED]
   * Vendors: `honest@charusat.edu.in`, `depstar@charusat.edu.in`, `owner3@charusat.edu.in`, `patelpuff@charusat.edu.in`, `gohunger@charusat.edu.in` [DATA-VERIFIED]

---

## 6. Observed Functional and UI Defects

1. **Defect CN-DEF-001 (Mobile Viewport Header Wrapping on Landing Page):**
   * *Evidence:* `CN-UI-002-landing-mobile.png` [OBSERVED]
   * *Description:* At viewports <= 390px, the navigation bar wraps text awkwardly; the "Log In" button and "Student Register" CTA collide with the logo, creating double-height wrapping without a dedicated mobile drawer.
   * *Severity:* High
   * *Remediation:* Implement a responsive mobile header with collapsible hamburger drawer using standardized Tailwind tokens.

2. **Defect CN-DEF-002 (Excessive Unconstrained Whitespace in Security Page):**
   * *Evidence:* `CN-UI-020-customer-security-desktop.png` [OBSERVED]
   * *Description:* On large desktop screens (> 1400px), `/customer/security` displays a solitary small card within a large empty area without maximum width containment or balanced vertical rhythm.
   * *Severity:* Medium
   * *Remediation:* Restructure container hierarchy with consistent `max-w-4xl`, centered layout, and breadcrumb navigation.

3. **Defect CN-DEF-003 (Artificial 3.5s Delay in Logout Modal):**
   * *Evidence:* `Frontend/src/Canteen/components/LogoutConfirmModal.tsx:144` [CODE-VERIFIED]
   * *Description:* Logout execution introduces an arbitrary `setTimeout` of 3500ms before navigating to `/login`, causing perceived interface sluggishness.
   * *Severity:* Medium
   * *Remediation:* Reduce logout confirmation transition to 600ms, preserving feedback without frustrating the user.

---

## 7. Performance Baseline

| Route | Viewport | TTFB | FCP | DOMContentLoaded | Load Time | Transfer Size | Evidence Label |
|---|---|---|---|---|---|---|---|
| `/landing` | 1440 x 900 | 5 ms | 310 ms | 205 ms | 216 ms | 8.1 KB (dev bundle) | MEASURED |
| `/login` | 1440 x 900 | 11 ms | 427 ms | 336 ms | 357 ms | 6.8 KB (dev bundle) | MEASURED |
| `/customer/dashboard` | 1440 x 900 | 8 ms | 380 ms | 290 ms | 312 ms | 14.2 KB (dev bundle) | MEASURED |
| `/dashboard` (Vendor) | 1440 x 900 | 7 ms | 350 ms | 275 ms | 295 ms | 12.8 KB (dev bundle) | MEASURED |

*Sentinel Methodology Discovery:* Sentinel methodology was searched across the codebase and repository history. `Sentinel methodology not found in the available project evidence.` Standardized fallback W3C Navigation & Resource Timing API methodology was utilized.
