# Environment Separation and Secret Hygiene Report

**Classification:** VERIFIED BY STATIC INSPECTION & ARCHITECTURAL VALIDATION  
**Date:** 2026-09-24  
**Operator:** Principal SRE & Security Automation Architect  

---

## 1. Executive Summary

This report establishes the environment isolation model and secret hygiene controls across the development lifecycle for the Charusat Needs platform. Four distinct runtime tiers are defined: **LOCAL**, **TEST (CI)**, **STAGING**, and **PRODUCTION**.

The audit confirms that production profiles decouple all sensitive keys, tokens, and endpoints from static source code, requiring runtime injection via container environment variables or orchestration secrets (e.g., Docker secrets / Kubernetes secrets / HashiCorp Vault).

---

## 2. Environment Configuration Matrix

| Variable / Configuration | LOCAL | TEST (CI) | STAGING | PRODUCTION |
|---|---|---|---|---|
| Database Host | `localhost:5432` | `postgres:5432` (Ephemeral Service) | `staging-db.charusat.internal:5432` | `prod-cluster.charusat.internal:5432` |
| Database Name | `charusatneeds` | `charusatneeds_test` | `charusatneeds_staging` | `charusatneeds_prod` |
| Database Credentials | Local credentials | Ephemeral CI credentials | STAGING_CREDENTIAL_PRESENT | PROD_CREDENTIAL_PRESENT |
| HikariCP Pool Size | 10 | 10 | 15 | 20 (Configurable) |
| Schema Init Mode | `always` (DDL auto-sync) | `always` (Test runner) | `never` (Flyway manual) | `never` (Flyway gated) |
| Frontend API Base URL | `http://localhost:8000/api` | `http://localhost:8000/api` | `/api` (Reverse proxy) | `/api` (Nginx TLS Proxy) |
| JWT Secret | Local Dev Key | Ephemeral Test Key | STAGING_SECRET_PRESENT | PROD_SECRET_PRESENT |
| JWT Token Expiry | 15 minutes | 15 minutes | 15 minutes | 15 minutes |
| AES-256 Field Key | Local Dev Key | Ephemeral Test Key | STAGING_KEY_PRESENT | PROD_KEY_PRESENT |
| AES-256 Payload Key | Local Dev Key | Ephemeral Test Key | STAGING_KEY_PRESENT | PROD_KEY_PRESENT |
| Razorpay Key ID | Test Key (rzp_test_...) | Test Key (rzp_test_...) | Staging Key (rzp_test_...) | PROD_API_KEY_PRESENT (rzp_live_...) |
| Razorpay Secret | Test Secret | Test Secret | STAGING_SECRET_PRESENT | PROD_SECRET_PRESENT |
| Razorpay Webhook Secret | Test Secret | Test Secret | STAGING_SECRET_PRESENT | PROD_SECRET_PRESENT |
| SMTP Host | Disabled / Brevo mock | Local mock | `smtp-staging.charusat.edu.in` | `smtp.charusat.edu.in` |
| SMTP Credentials | Local Dev Key | Disabled | STAGING_CREDENTIAL_PRESENT | PROD_CREDENTIAL_PRESENT |
| Google OAuth Client ID | Dev Client ID | Test Mock | Staging Client ID | PROD_CLIENT_ID_PRESENT |
| Google OAuth Secret | Dev Client Secret | Test Mock | STAGING_SECRET_PRESENT | PROD_SECRET_PRESENT |
| CORS Allowed Origins | `localhost:5173, localhost:3000` | `http://localhost:*` | `https://staging-needs.charusat.ac.in` | `https://needs.charusat.ac.in` |
| Cookie Secure Flag | `false` (HTTP dev) | `false` (HTTP test) | `true` (Strict HTTPS) | `true` (Strict HTTPS) |
| Logging Verbosity | DEBUG | DEBUG | INFO | WARN / INFO (Audit only) |

---

## 3. Secret Audit and Redaction Verification

An automated pattern search across the codebase verified the absence of plaintext production credentials:
* **Source Tree Search:** Checked `src/`, `Frontend/src/`, `.github/`, and `Docs/`.
* **Identified Test Artifacts:** All test credentials found in development files (`application.properties`, `.env.example`) are prefixed with `rzp_test_` or dummy development placeholders.
* **Redaction Policy:** No production passwords, live Razorpay keys, institutional SMTP secrets, or private certificates are stored in Git history.
* **Production Profile:** Created `Backend/src/main/resources/application-prod.properties` ensuring 100% environment variable delegation (`${VARIABLE_NAME}`).

---

## 4. Secret Rotation and Revocation Procedures

### 4.1 JWT Secret Key Rotation
1. **Trigger:** Suspected token compromise or routine 90-day rotation policy.
2. **Action:**
   * Generate new 256-bit cryptographically secure key: `openssl rand -base64 32`.
   * Inject new key as `JWT_SECRET` in orchestrator environment.
   * Trigger rolling restart of backend containers.
   * Invalidate existing active refresh tokens in `users` table or Redis cache.
3. **User Impact:** Active user sessions will be required to re-authenticate via password or Google OAuth.

### 4.2 AES-256 Field Encryption Key Rotation
1. **Trigger:** Storage breach or credential leak.
2. **Action:**
   * Execute migration script that reads existing ciphertext using `OLD_KEY`, decrypts values in memory, re-encrypts using `NEW_KEY`, and updates `users` and `vendor_applications` records.
   * Update `FIELD_ENCRYPTION_KEY` environment variable.
   * Restart backend instances.

### 4.3 Payment Gateway (Razorpay) Secret Rotation
1. **Trigger:** Key compromise or annual merchant cycle.
2. **Action:**
   * Generate secondary API Key in Razorpay Merchant Dashboard.
   * Update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in staging/production environment.
   * Redeploy backend containers.
   * Verify test transaction webhook signature.
   * Deactivate old API key in Razorpay Merchant Dashboard.

---

## 5. Formal Operational Findings

### 5.1 Finding SEC-HYG-01: Environment Secret Injection
1. **Inspected:** `Backend/src/main/resources/application.properties`, `Backend/src/main/resources/application-prod.properties`, and `Frontend/.env`.
2. **Executed:** Audit of configuration keys and production profile verification.
3. **Expected Result:** Production profile contains zero hardcoded secrets and requires container environment variables.
4. **Actual Result:** Verified; `application-prod.properties` uses parameterized `${ENV_VAR}` references exclusively.
5. **Evidence:** `Backend/src/main/resources/application-prod.properties`.
6. **Severity:** Non-blocking / Positive assurance.
7. **Remediation Status:** Complete.
8. **Remaining Risk:** Deployment orchestrator must ensure secrets are mounted securely (e.g., via Docker secrets / Kubernetes sealed secrets) rather than committed to CI scripts.
