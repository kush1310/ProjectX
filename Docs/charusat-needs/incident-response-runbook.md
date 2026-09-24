# Incident Response Runbook

**Classification:** OPERATIONAL PROCEDURES & STANDARD OPERATING PROCEDURES (SOP)  
**Date:** 2026-09-24  
**Audience:** On-Call SREs, DevOps Engineers, and System Administrators  

---

## 1. Global Incident Response Framework

All operational incidents follow this four-phase protocol:
1. **Triage & Containment (< 15 mins):** Acknowledge page, assess blast radius, isolate affected components or rollback.
2. **Investigation & Mitigation (< 30 mins):** Identify root cause using correlation ID (`X-Request-Id`) and metrics; apply standard runbook remediations.
3. **Recovery & Verification (< 45 mins):** Verify `/api/public/health/readiness` and synthetic transaction smoke tests.
4. **Post-Mortem & Remediation (Within 48 hours):** Publish blameless post-mortem report and file preventative remediation tickets.

---

## 2. Component-Specific Operational Runbooks

### 2.1 Backend Service Outage (Spring Boot Down)
* **Symptoms:** Nginx returns HTTP 502 Bad Gateway; `/api/public/health` unreachable; elevated error rate on dashboard.
* **Initial Checks:**
  ```bash
  docker compose ps backend
  docker compose logs --tail=100 backend
  ```
* **Decision Points:**
  * If container exited with Code 137 -> Out-Of-Memory (OOM) killed. Increase container memory limit or investigate heap leak.
  * If container is restarting in a loop -> Check database connectivity or missing environment secrets.
* **Recovery Actions:**
  ```bash
  docker compose restart backend
  ```
* **Verification:** `curl -f http://localhost:8000/api/public/health/readiness`
* **Escalation:** If service fails to recover after 2 restarts, page Principal Backend Engineer.

---

### 2.2 Database Outage (PostgreSQL Down)
* **Symptoms:** Health probe returns `HTTP 503 {"status":"DOWN","database":"DOWN"}`; all API writes and reads fail.
* **Initial Checks:**
  ```bash
  docker compose ps postgres
  pg_isready -h localhost -p 5432
  docker compose logs --tail=100 postgres
  ```
* **Decision Points:**
  * If disk full -> Prune old WAL files or expand volume storage.
  * If corrupted database cluster -> Initiate disaster recovery restore drill (`psql` restore from latest logical backup).
* **Recovery Actions:**
  ```bash
  docker compose restart postgres
  ```
* **Verification:** Verify `SELECT 1;` succeeds and `/api/public/health/readiness` returns HTTP 200 UP.
* **Escalation:** Page Lead DBA & Infrastructure Engineer.

---

### 2.3 Nginx Reverse Proxy Outage
* **Symptoms:** Complete connection refusal on port 80/443; frontend and API completely inaccessible from internet.
* **Initial Checks:**
  ```bash
  docker compose ps frontend
  nginx -t -c /etc/nginx/nginx.conf
  ```
* **Recovery Actions:**
  ```bash
  docker compose restart frontend
  ```
* **Verification:** `curl -I http://localhost/` returns HTTP 200 OK.

---

### 2.4 Payment Gateway (Razorpay) Outage / Webhook Failures
* **Symptoms:** Orders created in `PENDING` status never transition to `PAID` or `CONFIRMED`; students report money debited without order confirmation.
* **Initial Checks:**
  * Check Razorpay status page: `https://status.razorpay.com/`
  * Inspect backend webhook logs for HMAC signature verification failures:
    ```bash
    grep "Webhook signature" /var/log/charusat/backend.log
    ```
* **Recovery Actions:**
  * If Razorpay API is down: Place banners on canteen frontend informing students of temporary gateway maintenance.
  * For orders where student account was debited: Use Razorpay Merchant Dashboard to cross-reference payment IDs and trigger manual payment capture or refund.
* **Escalation:** Contact Razorpay Enterprise Support via Merchant Desk.

---

### 2.5 Institutional SMTP / Email Outage
* **Symptoms:** Registration verification emails or password reset OTPs not arriving; logs show `MailSendException` or SMTP timeout.
* **Initial Checks:**
  ```bash
  nc -zv smtp.charusat.edu.in 587
  ```
* **Recovery Actions:**
  * Verify campus network DNS resolves SMTP host.
  * Fallback to secondary SMTP provider or Brevo HTTP API integration.
* **Escalation:** Contact CHARUSAT Campus Network & IT Infrastructure Desk.

---

### 2.6 WebSocket (STOMP) Connection Instability
* **Symptoms:** Live order status does not update on student or vendor screens; repeated console reconnect logs.
* **Initial Checks:**
  * Verify Nginx WebSocket upgrade headers: `proxy_set_header Upgrade $http_upgrade;`
  * Check backend active thread count.
* **Recovery Actions:**
  * Restart frontend proxy to clear stale WebSocket sockets.
  * Frontend automatically falls back to manual polling or page refresh if WebSocket fails.

---

### 2.7 High API Latency Spike
* **Symptoms:** p95 latency exceeds 1500 ms; students experience lag during checkout.
* **Initial Checks:**
  ```bash
  # Check active database queries
  psql -U postgres -d charusatneeds -c "SELECT pid, query, state, age(clock_timestamp(), query_start) FROM pg_stat_activity WHERE state != 'idle';"
  ```
* **Recovery Actions:**
  * Terminate any long-running locking query: `SELECT pg_terminate_backend(<pid>);`
  * Scale backend replicas from 1 to 2 instances if CPU usage exceeds 85%.

---

### 2.8 Disk Space Exhaustion
* **Symptoms:** PostgreSQL logs fail to write; database transitions to read-only mode.
* **Initial Checks:** `df -h /var/lib/docker`
* **Recovery Actions:**
  ```bash
  docker system prune -f
  # Truncate old archived log files older than 14 days
  find /var/log/charusat/ -type f -name "*.log.*" -mtime +14 -delete
  ```

---

### 2.9 Failed Deployment Rollback
* **Symptoms:** Canary or newly deployed version reports HTTP 5xx errors or fails readiness checks.
* **Recovery Actions:**
  * Execute fast rollback runbook (documented in `rollback-drill-report.md`):
    ```bash
    docker compose stop backend frontend
    # Revert image tags to previous stable Git SHA
    docker compose up -d
    ```
  * Verify post-rollback readiness.
