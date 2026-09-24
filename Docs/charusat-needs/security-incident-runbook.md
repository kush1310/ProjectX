# Security Incident Response and Key Compromise Runbook

**Classification:** SECURITY STANDARD OPERATING PROCEDURE (SOP)  
**Date:** 2026-09-24  
**Audience:** Security Incident Response Team (SIRT), Security Architects, and DevOps  

---

## 1. Universal Security Incident Lifecycle

Every suspected or confirmed credential leak follows this mandatory 8-stage sequence:

```
[1. DETECT]
  * Git secret scan alert / cloud provider notification / anomaly detection
      ↓
[2. REVOKE]
  * Disable compromised API key in provider console immediately
      ↓
[3. ROTATE]
  * Generate cryptographically secure replacement key
      ↓
[4. REDEPLOY]
  * Inject new secret into orchestration vault and rolling restart services
      ↓
[5. INVALIDATE]
  * Invalidate active JWTs, refresh tokens, and cached sessions
      ↓
[6. VERIFY]
  * Authenticate and execute synthetic end-to-end transaction test
      ↓
[7. FORENSICS]
  * Snapshot audit logs, IP access traces, and Git commit history
      ↓
[8. DOCUMENT]
  * Author formal security incident report and report to campus DPO
```

---

## 2. Compromise Scenarios and Execution Steps

### 2.1 Scenario A: Leaked JWT Signing Secret
* **Impact:** Adversary can forge arbitrary administrative or student JWTs and bypass authentication.
* **Emergency Procedure:**
  1. **Generate New Key:** Generate 256-bit Base64 key: `openssl rand -base64 32`.
  2. **Update Environment:** Replace `JWT_SECRET` in production vault/orchestrator.
  3. **Invalidate Active Sessions:**
     ```sql
     -- Invalidate all active refresh tokens in database
     UPDATE users SET token_version = token_version + 1;
     ```
  4. **Redeploy Backend:** Trigger rolling restart of all backend containers.
  5. **Audit Access:** Query logs for `reqId` associated with administrative actions during the compromise window.

---

### 2.2 Scenario B: Leaked AES-256 Field Encryption Key
* **Impact:** Adversary can decrypt sensitive student phone numbers, MFA secrets, and vendor bank account details.
* **Emergency Procedure:**
  1. **Generate New Key:** `openssl rand -base64 32`.
  2. **Execute Re-encryption Migration:**
     * Run dual-key re-encryption script: decrypt columns using old key, re-encrypt using new key, update rows.
  3. **Update Environment:** Update `FIELD_ENCRYPTION_KEY`.
  4. **Redeploy Backend:** Restart backend instances.
  5. **Audit Decryption:** Review access logs for bulk user queries.

---

### 2.3 Scenario C: Compromised Database Password
* **Impact:** Direct read/write access to PostgreSQL database if port 5432 is reachable.
* **Emergency Procedure:**
  1. **Isolate Database:** Verify firewall blocks port 5432 from all external public IPs.
  2. **Change Database Password:**
     ```sql
     ALTER USER charusat_app WITH PASSWORD 'NEW_STRONG_GENERATED_PASSWORD';
     ```
  3. **Update Environment:** Update `SPRING_DATASOURCE_PASSWORD`.
  4. **Restart Application:** Trigger container restart.

---

### 2.4 Scenario D: Compromised Payment Gateway (Razorpay) Secret
* **Impact:** Adversary can forge payment webhooks, falsely confirm unpaid orders, or initiate unauthorized refunds.
* **Emergency Procedure:**
  1. **Revoke Old Key:** Log in to Razorpay Merchant Dashboard; immediately generate replacement API Key and revoke old key.
  2. **Update Webhook Secret:** Regenerate Webhook Secret in dashboard.
  3. **Update Environment:** Update `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`.
  4. **Redeploy Backend:** Trigger immediate rolling restart.
  5. **Reconcile Transactions:** Compare orders marked `PAID` in database against verified settlements in Razorpay Settlement Ledger.

---

### 2.5 Scenario E: Compromised Institutional SMTP Credentials
* **Impact:** Adversary can send phishing emails from official `@charusat.edu.in` domain.
* **Emergency Procedure:**
  1. **Revoke Password:** Contact Campus IT Helpdesk to reset password immediately.
  2. **Update Environment:** Update `SMTP_PASSWORD` in production vault.
  3. **Redeploy Backend:** Restart backend containers.

---

## 3. Data Retention and Log Hygiene Policy

| Data Type | Retention Period | Storage Location | Purge / Archival Mechanism |
|---|---|---|---|
| Application Access Logs | 30 days | Local / Logstash | Automated Logrotate + daily Gzip |
| Security & Audit Logs | 365 days (1 year) | Immutable S3 Bucket | Compliance legal hold |
| Database Daily Backups | 14 days | Encrypted Backup Volume | Automated cron cleanup |
| Database Monthly Snapshots | 90 days | Offsite Cold Storage | Glacier lifecycle policy |
| Temporary Files / Uploads | 24 hours | `/tmp/charusat/` | Daily cron purge |

---

## 4. Log Sanitization & Sensitive Data Scrubbing

To prevent secondary leaks:
* **Passwords & Hashes:** Never output to logs under any log level.
* **Raw Card / Bank Details:** Never logged; handled solely by PCI-DSS compliant Razorpay frame.
* **AES Encryption Keys:** Prohibited in logs.
* **PII Redaction:** Mobile numbers and student IDs logged only in masked format (`+91 98****1234`).
