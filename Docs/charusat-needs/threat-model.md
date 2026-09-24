# Charusat Needs — Formal Threat Model & Attack Surface Analysis

**Document Version:** 1.0.0  
**Target Environment:** Charusat Needs Staging & Production Baseline  
**Classification:** Internal Technical Security Architecture  
**Author:** Principal Application Security Architect & Penetration Testing Team  
**Governing Standard:** STRIDE / NIST SP 800-53 Rev 5 / OWASP Top 10 (2025)  

---

## 1. Executive Summary

This document establishes the authoritative threat model for the Charusat Needs campus dining, order management, and payment reconciliation platform. The threat model maps the system's operational architecture across ten distinct threat actors, identifies twenty-two core business and cryptographic assets, formalizes eight distinct trust boundaries, and evaluates threat vectors across the STRIDE taxonomy (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege).

Every threat is mapped to:
- Specific threat actor and attack vector
- Impacted assets and trust boundaries
- Existing verified controls in source code and configuration
- Residual risk rating
- Prescribed mitigations and non-destructive proof-of-concept evidence

---

## 2. Inventory of System Assets

| Asset ID | Asset Category | Description & Sensitivity Classification | Criticality |
|---|---|---|---|
| AST-01 | Passwords & Credentials | BCrypt hashed passwords (cost factor 10). Plaintext passwords in transit. | CRITICAL |
| AST-02 | JWT Access Tokens | HMAC-SHA256 signed JSON Web Tokens (15-minute expiration, containing email and role claims). | HIGH |
| AST-03 | Refresh Tokens | SHA-256 hashed cryptographically random UUID refresh tokens with 7-day TTL and rotation tracking. | CRITICAL |
| AST-04 | TOTP MFA Secrets | Base32 encoded 160-bit TOTP secret seeds used for RFC 6238 time-based one-time authentication. | CRITICAL |
| AST-05 | User Identities | Institutional student/faculty email addresses (`@charusat.edu.in`) and full legal names. | MEDIUM |
| AST-06 | Contact Information | User telephone numbers and contact details stored in customer profiles. | MEDIUM |
| AST-07 | Student Profiles | Department, enrollment number, dietary preferences, and account metadata. | LOW |
| AST-08 | Vendor Banking Data | Bank account numbers, IFSC codes, account holder names, bank branch names. | CRITICAL |
| AST-09 | Order Data | Order items, quantities, customizations, subtotal, GST, platform fee, timestamps. | HIGH |
| AST-10 | Payment Identifiers | Razorpay payment ID (`pay_*`), Razorpay order ID (`order_*`), HMAC signature. | HIGH |
| AST-11 | Coupon Logic & State | Discount calculation algorithms, usage counters, limits per user, minimum cart thresholds. | HIGH |
| AST-12 | Menu & Inventory | Dish pricing, category assignments, stock flags, variant definitions, addon groups. | MEDIUM |
| AST-13 | Complaints Queue | Customer grievance records, escalation statuses, resolution logs, feedback details. | MEDIUM |
| AST-14 | Reviews & Ratings | Star ratings, textual reviews, vendor feedback records. | LOW |
| AST-15 | Audit Records | Authentication event logs, lockout history, token revocations, IP audit trails. | HIGH |
| AST-16 | JWT Signing Key | 256-bit symmetric secret (`jwt.secret`) used for HMAC-SHA256 signature verification. | CRITICAL |
| AST-17 | AES Payload Key | 256-bit AES key derived via HMAC-SHA256 KDF for application-layer payload encryption. | CRITICAL |
| AST-18 | Razorpay Key Secret | Gateway webhook and API secret used to generate and verify payment signatures. | CRITICAL |
| AST-19 | SMTP Credentials | Brevo API key and SMTP relay credentials for transactional email delivery. | HIGH |
| AST-20 | Database Credentials | PostgreSQL connection credentials (`username`, `password`, host/port details). | CRITICAL |
| AST-21 | TLS Private Keys | Server private key certificates terminating HTTPS at reverse proxy layer. | CRITICAL |
| AST-22 | OAuth Client Secrets | Google OAuth 2.0 client secret (`client_secret`) for external institutional SSO. | HIGH |

---

## 3. Threat Actor Matrix

| Actor ID | Actor Designation | Access Level & Capabilities | Motivation & Objectives |
|---|---|---|---|
| ACT-01 | Unauthenticated Campus User | Network access to public HTTP/HTTPS ports. Can browse public menu endpoints, health checks, login. | Service discovery, account enumeration, brute-forcing credentials, scrapers. |
| ACT-02 | Authenticated Student / Customer | Possesses valid `@charusat.edu.in` JWT with role `ROLE_USER`. Access to cart, checkout, profile, history. | Privilege escalation to vendor/admin, tampering with order totals, coupon abuse. |
| ACT-03 | Authenticated Vendor | Possesses valid `@charusat.edu.in` JWT with role `ROLE_CANTEEN_OWNER`. Controls specific canteen menu/orders. | Cross-tenant access to rival vendor metrics, coupon theft, unauthorized payout manipulation. |
| ACT-04 | System Administrator | Role `ROLE_ADMIN`. Full operational access to all canteens, coupons, audits, and configurations. | Legitimate administrative management; compromised accounts lead to catastrophic takeover. |
| ACT-05 | Malicious Institutional User | Valid institutional student with malicious intent (insider student). | Targeted IDOR, SQL injection, script injection (XSS), race conditions on inventory/coupons. |
| ACT-06 | Compromised Vendor Account | Vendor credentials hijacked via credential stuffing, phishing, or session theft. | Fabricating payouts, altering banking destination, canceling orders, sabotaging menu. |
| ACT-07 | Malicious Browser / Client | Modified browser client using Developer Tools, Postman, custom HTTP scripts, or Burp Suite. | Circumventing client-side validation, altering price fields, replaying tokens, forging requests. |
| ACT-08 | Malicious Network Intermediary | Man-in-the-middle on campus Wi-Fi or compromised LAN proxy. | Inspecting traffic, session hijacking, SSL stripping, credential harvesting. |
| ACT-09 | Compromised API Client | External automated agent or compromised mobile client executing parallel API requests. | Rapid double-submission, distributed denial-of-service, automated checkout manipulation. |
| ACT-10 | Malicious Insider (DB Access) | Direct read/write access to PostgreSQL database or host operating system. | Direct data exfiltration, tampering with balances, bypassing all application-layer business rules. |

---

## 4. Trust Boundaries & Data Flow

```
[ Browser / Mobile Client ] 
             |
             | TB-1: Public Internet / Campus Wi-Fi (Untrusted -> DMZ)
             v
      [ Nginx Reverse Proxy ]
             |
             | TB-2: Internal Loopback / Private Container Network
             v
   [ Spring Boot 3.2.2 Backend ] <--- TB-4: STOMP/WebSocket Connection (Client -> Broker)
      |          |          |
      |          |          +---> TB-5: External Payment Gateway (Razorpay API)
      |          |          +---> TB-6: External Email Service (Brevo SMTP API)
      |          |
      | TB-3: Local Socket / Private Network (Port 5432)
      v
[ PostgreSQL 18.0 Database ]

Internal Logic Boundaries:
  - TB-7: Student Domain Boundary (Isolated to student's own cart, profile, and orders)
  - TB-8: Vendor Tenant Boundary (Isolated strictly to vendor's owned canteen outlet)
```

### Boundary Descriptions

- **TB-1: Browser -> Nginx:** External perimeter. Protects against slowloris attacks, enforces TLS 1.2/1.3 cipher suites, applies rate limiting, strips malicious host headers, and applies HTTP security headers (`Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`).
- **TB-2: Nginx -> Spring Boot:** Reverse proxy to application server bridge. Passes sanitized client IP via `X-Forwarded-For` and `X-Real-IP`. Enforces internal payload size limits (10MB max).
- **TB-3: Spring Boot -> PostgreSQL:** Internal persistence channel. All communication executes via parameterized `JdbcTemplate` queries. No raw string concatenation permitted.
- **TB-4: Browser -> WebSocket:** Bi-directional messaging boundary over SockJS/STOMP (`/ws-canteen`). Broadcasts menu toggles and order updates. Requires authentication tokens for private topic subscriptions.
- **TB-5: Backend -> Razorpay:** Payment processing boundary. All order creation requests and webhook/callback signature verifications use timing-safe HMAC-SHA256 calculations.
- **TB-6: Backend -> Brevo:** Transactional email boundary. REST API over TLS. Credentials must never be logged or echoed in HTTP responses.
- **TB-7: Student Isolation Boundary:** Enforces that customer A cannot inspect or modify customer B's cart, orders, or profile settings (Anti-IDOR).
- **TB-8: Vendor Multi-Tenant Boundary:** Enforces that Vendor A cannot inspect Vendor B's menu, sales analytics, coupon configurations, or banking payout balances.

---

## 5. STRIDE Threat Analysis & Defense Verification

### 5.1 Spoofing (Identity Deception)

| Threat ID | Scenario | Target Asset | Existing Control | Residual Risk | Status | Evidence |
|---|---|---|---|---|---|---|
| T-SPOOF-01 | Registration using commercial Gmail or Yahoo accounts | AST-05 | Backend domain validator in `AuthController.java` strictly enforces `@charusat.edu.in`. | LOW | PASS | Verified rejection of `student@gmail.com` and `vendor@yahoo.com` with HTTP 400. |
| T-SPOOF-02 | Subdomain attack (`user@charusat.edu.in.evil.com`) | AST-05 | Strict end-of-string regex matching `^.+@charusat\.edu\.in$`. | LOW | PASS | Subdomain attack rejected with HTTP 400. |
| T-SPOOF-03 | JWT forgery by altering header/payload | AST-02 | Spring Security JJWT validates HMAC-SHA256 signature using `jwt.secret`. | LOW | PASS | Modified signature rejected with HTTP 403. |
| T-SPOOF-04 | CAPTCHA bypass via token reuse | AST-01 | One-time token validation in `CaptchaService.java` consumes and deletes token upon evaluation. | LOW | PASS | CAPTCHA tokens have 3-minute TTL and single-use semantics. |
| T-SPOOF-05 | TOTP MFA replay attack | AST-04 | RFC 6238 time-step tolerance bounded to +/-1 window (30s) with consumed code tracking. | LOW | PASS | Code inspection verified timing-safe validation. |

---

### 5.2 Tampering (Data Modification)

| Threat ID | Scenario | Target Asset | Existing Control | Residual Risk | Status | Evidence |
|---|---|---|---|---|---|---|
| T-TAMP-01 | Client-side modification of item unit price in cart | AST-09 | `CartService.addToCart` re-fetches authoritative price from `menu_items` database record. | LOW | PASS | Client price payloads are ignored; DB price is authoritative. |
| T-TAMP-02 | Forging Razorpay payment verification signature | AST-10 | `PaymentService.verifyPayment` recalculates HMAC-SHA256 over `orderId|paymentId`. | LOW | PASS | Forged signature rejected with HTTP 400. |
| T-TAMP-03 | Negative cart item quantity injection | AST-09 | `@Min(1)` validation annotation on `AddToCartRequest.quantity()`. | LOW | PASS | Negative quantity `-5` rejected with HTTP 400. |
| T-TAMP-04 | Application-layer payload tampering in transit | AST-17 | AES-256-GCM authentication tag (128 bits) fails decryption on any 1-bit ciphertext modification. | LOW | PASS | 1-bit flipped ciphertext throws GCM authentication error. |
| T-TAMP-05 | Tampering with coupon discount value during checkout | AST-11 | Discount calculation executes entirely on backend in `CartService.applyCoupon`. | LOW | PASS | Client cannot inject discount amounts; calculated from rule engine. |

---

### 5.3 Repudiation (Disavowing Actions)

| Threat ID | Scenario | Target Asset | Existing Control | Residual Risk | Status | Evidence |
|---|---|---|---|---|---|---|
| T-REP-01 | Vendor disavowing order cancellation or acceptance | AST-15 | `OrderService.updateStatus` records timestamp, updated status, and broadcasts audit via WebSocket. | MEDIUM | PASS | Database timestamps updated on every transition. |
| T-REP-02 | User denying authentication attempt | AST-15 | `SecurityAuditService` logs every successful and failed login with client IP and timestamp. | LOW | PASS | Audits recorded in `security_audit_log` table. |
| T-REP-03 | Payout transaction disavowal | AST-08 | Payout requests record vendor ID, bank details snapshot, and requested amount. | MEDIUM | PASS | Payout model records immutability timestamp. |

---

### 5.4 Information Disclosure (Data Leakage)

| Threat ID | Scenario | Target Asset | Existing Control | Residual Risk | Status | Evidence |
|---|---|---|---|---|---|---|
| T-INFO-01 | Exfiltration of user passwords from database | AST-01 | BCrypt cryptographic hashing with unique salt per user. Plaintext never stored. | LOW | PASS | `BCryptPasswordEncoder` verified in `SecurityConfig.java`. |
| T-INFO-02 | Leakage of stack traces or database errors to clients | AST-20 | `GlobalExceptionHandler` intercepts all exceptions and returns sanitized `ApiResponse` JSON. | LOW | PASS | Malformed payload returned clean HTTP 400 without stack trace. |
| T-INFO-03 | Exfiltration of vendor bank accounts via IDOR | AST-08 | `VendorController` endpoints enforce role check and vendor ownership verification. | LOW | PASS | Student tokens rejected with HTTP 403 on vendor endpoints. |
| T-INFO-04 | MITM inspection of API payloads on campus network | AST-17 | Application-layer AES-256-GCM encryption wraps all JSON request/response payloads in `enc`. | LOW | PASS | Wire inspection reveals only Base64 ciphertext. |
| T-INFO-05 | User enumeration via differing login error messages | AST-05 | `AuthController.java` returns generic "Invalid email or password" for both missing user and bad password. | LOW | PASS | HTTP 401 with identical generic error message verified. |

---

### 5.5 Denial of Service (Service Disruption)

| Threat ID | Scenario | Target Asset | Existing Control | Residual Risk | Status | Evidence |
|---|---|---|---|---|---|---|
| T-DOS-01 | Password brute-force attack against single account | AST-01 | `AccountLockoutService` tracks consecutive failed attempts; locks account for 15m after 5 failures. | LOW | PASS | Lockout thresholds active in `AccountLockoutService`. |
| T-DOS-02 | Rapid double-submission of orders / cart items | AST-09 | Database transactions with row-level locks prevent concurrency corruption. | LOW | PASS | Two parallel cart POSTs completed cleanly without deadlock. |
| T-DOS-03 | Excessive payment creation requests | AST-10 | `RateLimiterService` enforces maximum 10 payment order creations per minute per user. | LOW | PASS | Verified in `PaymentController.createOrder`. |
| T-DOS-04 | PostgreSQL connection pool exhaustion | AST-20 | HikariCP connection pool configured with finite maximum connections and leak detection. | LOW | PASS | Health check reports database UP with sub-millisecond query time. |

---

### 5.6 Elevation of Privilege (Unauthorized Access)

| Threat ID | Scenario | Target Asset | Existing Control | Residual Risk | Status | Evidence |
|---|---|---|---|---|---|---|
| T-ELEV-01 | Student calling vendor menu/coupon management APIs | AST-11 | Method-level `@PreAuthorize("hasAnyRole('CANTEEN_OWNER', 'ADMIN')")` on `VendorController`. | LOW | PASS | Student token returned HTTP 403 Forbidden. |
| T-ELEV-02 | Student forging order status to COMPLETED | AST-09 | Method-level `@PreAuthorize` on `OrderController.updateStatus`. | LOW | PASS | Student token returned HTTP 403 Forbidden. |
| T-ELEV-03 | JWT role claim manipulation (`ROLE_USER` -> `ROLE_ADMIN`) | AST-16 | HMAC-SHA256 signature verification rejects tampered payload claims. | LOW | PASS | Tampered role claim token returned HTTP 403 Forbidden. |
| T-ELEV-04 | Vendor modifying another vendor's canteen status | AST-12 | `CanteenController.toggleOpen` checks `canteen.getOwnerId().equals(userId)`. | LOW | PASS | Unauthorized owner returned HTTP 403 Forbidden. |

---

## 6. Residual Risk & Production Dependencies

1. **Razorpay Live Merchant Onboarding:**
   - *Status:* OPEN (External Dependency).
   - *Residual Risk:* Payment subsystem functions correctly in Razorpay Test Mode (`rzp_test_*`). Live payment processing requires university merchant bank KYC completion before switching credentials in `application.properties`.
2. **Automated Gateway Refund Processing:**
   - *Status:* OPEN (External Dependency).
   - *Residual Risk:* Refund state transitions in the database are modeled and verified. Direct automated gateway refunds via Razorpay API require production merchant keys with refund privileges enabled.
3. **University SMTP Relay Integration:**
   - *Status:* OPEN (Configuration Dependency).
   - *Residual Risk:* Transactional emails currently route via Brevo HTTP API. Campus mail exchange configuration (`smtp.charusat.edu.in`) should be provisioned for production deployment.

---

## 7. Threat Modeling Conclusion

All internal software trust boundaries, authentication mechanisms, cryptographic layers, and role authorization barriers are implemented and verified in the Charusat Needs codebase. No critical or high unmitigated architectural risks remain within the application software boundary.
