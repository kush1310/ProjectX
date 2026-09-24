# Charusat Needs — Defensive Security Assessment and Cryptographic Review

**Evaluation Framework:** OWASP Top 10 (2025/2026), OWASP ASVS v4.0.3  
**Execution Date:** 2026-09-23  
**Status:** High Assurance Defensive Baseline Established  

---

## 1. Executive Summary

This security assessment examines the boundary defenses, authentication mechanisms, cryptographic protocols, input validation pipelines, and role-based access controls of the **Charusat Needs** application.

The application exhibits defense-in-depth engineering with AES-256-GCM application-layer payload encryption, strict server-side institutional email enforcement (`@charusat.edu.in`), progressive account lockout, dynamic anti-automation CAPTCHA, and TOTP MFA support.

---

## 2. Authentication & Institutional Domain Enforcement

### 2.1 Institutional Domain Enforcement
* **Control:** Strict restriction of user and vendor registrations to institutional `@charusat.edu.in` accounts.
* **Client Boundary:** Evaluated in `Frontend/src/pages/Signup.tsx` and `Frontend/src/pages/Login.tsx`. Real-time validation halts form submission if email does not match `.*@charusat\.edu\.in$`. [REPRODUCED]
* **Server Boundary:** Enforced in `AuthController.java` (`if (!email.endsWith("@charusat.edu.in")) return badRequest(...)`), `RegisterRequest.java` validation annotations, and `GoogleAuthService.java` (`ALLOWED_DOMAIN = "charusat.edu.in"`). [CODE-VERIFIED]
* **Test Case - Negative Domain:** Attempting registration with `student.qa01@gmail.com` resulted in immediate validation halt with error message: `Use @charusat.edu.in email`. [OBSERVED & REPRODUCED]

### 2.2 Password Security & Hashing
* **Storage Standard:** Passwords hashed with BCrypt (strength 10/12) via Spring Security's `PasswordEncoder`. No plaintext passwords stored. [CODE-VERIFIED]
* **NIST 800-63B Compliance:** Passwords must meet minimum 8 characters, maximum 128 characters, with character complexity checked. Clipboard copying disabled on password fields. [CODE-VERIFIED]

### 2.3 Brute-Force & Lockout Controls
* **Rate Limiting:** IP-based and user-based token bucket rate limiting via `RateLimiterService`.
* **Lockout Policy:** 5 consecutive failed login attempts trigger an exponential account lockout period with visual countdown overlay (`LockoutOverlay` in `Login.tsx`). [CODE-VERIFIED]
* **CAPTCHA Challenge:** Visual distortion image CAPTCHA generated server-side with single-use token and 5-minute TTL in `CaptchaService.java`. [CODE-VERIFIED & OBSERVED]

---

## 3. Cryptographic Implementation Review

| Control | Algorithm | Key Derivation / Spec | Purpose | Status |
|---|---|---|---|---|
| Payload Encryption | AES-256-GCM | HMAC-SHA256 KDF with salt | Encrypts HTTP JSON bodies between client and server | VERIFIED |
| JWT Token Signing | HMAC-SHA256 (HS256) | 256-bit base64-encoded secret | Stateless bearer token authentication | VERIFIED |
| Multi-Factor Auth | TOTP (RFC 6238) | HMAC-SHA1 + Base32 secret | Two-factor authentication via Authenticator apps | VERIFIED |
| Field-Level Encryption | AES-256-GCM | `FieldEncryptor.java` | Protects sensitive database columns (bank account, phone) | VERIFIED |

---

## 4. Authorization & Role-Based Access Control (RBAC)

### 4.1 Role Hierarchy
1. `USER` (University Student / Faculty)
2. `CANTEEN_OWNER` (Campus Dining Vendor)
3. `ADMIN` (University Platform Administrator)

### 4.2 Endpoint & Route Boundary Verification
* Client-side route guard (`ProtectedRoute.tsx`) intercepts unauthenticated navigations and redirects to `/login`. [REPRODUCED]
* Role mismatch navigations (e.g. `USER` attempting `/dashboard` or `/vendor/payout`) trigger automatic redirect to `/customer/dashboard`. [CODE-VERIFIED]
* Server-side `@PreAuthorize` and Spring Security filter chains validate JWT claims independently of client state. [CODE-VERIFIED]

---

## 5. Security Findings and Remediation Matrix

| Finding ID | Severity | Category | Description | Remediation | Status |
|---|---|---|---|---|---|
| SEC-001 | Low | Header Hardening | Permissions-Policy header can be expanded to explicitly disable camera, microphone, and geolocation. | Add standard directives in `SecurityHeadersFilter.java`. | Identified |
| SEC-002 | Low | Payload Encryption Uniformity | Specific public/semi-public endpoints (`/cart/apply-coupon`) bypass payload encryption. | Migrate endpoints to typed DTOs supporting AES encryption uniformly. | Identified |
| SEC-003 | Informational | Token Expiry | Access tokens have a 15-minute TTL; refresh token rotation active. | Design matches standard industry practice. | Verified |
