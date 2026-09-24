# Charusat Needs — System Resilience, High Availability & Disaster Recovery Architecture

**Document Version:** 1.0.0  
**Audit Date:** 2026-09-24  
**Classification:** Infrastructure, Reliability Engineering & Business Continuity  
**Lead:** Reliability Engineer & Database Resilience Architect  
**Governing Standard:** ISO 22301 / NIST SP 800-34 Rev 1 / High Availability Engineering  

---

## 1. Executive Summary

This report establishes the resilience baseline, failure modes and effects analysis (FMEA), disaster recovery procedures, and rollback strategies for the Charusat Needs deployment. It documents the observed system behavior during subsystem degradation, evaluates database and backend failure states, defines proposed Recovery Point Objectives (RPO) and Recovery Time Objectives (RTO), and provides concrete operational runbooks for emergency failover and recovery.

---

## 2. Failure Modes & Effects Analysis (FMEA)

| Failure Domain | Trigger Scenario | Immediate System Impact | Observed / Modeled Behavior | Recovery Mechanism | Recovery Time |
|---|---|---|---|---|---|
| PostgreSQL Failure | Database daemon stops, network partition, or connection pool exhaustion. | Stateful APIs fail; public read endpoints return degraded or error responses. | `/api/public/health` immediately reports `status: DOWN`, `database: DOWN` with HTTP 503. HikariCP attempts reconnection with exponential backoff. | Automatic reconnection upon PostgreSQL service restoration. In-flight transactions roll back cleanly without data corruption. | < 30 seconds after DB restart |
| Spring Boot Backend Failure | JVM crash, uncaught fatal error, or process termination. | API and WebSocket connections drop; reverse proxy cannot reach upstream. | Nginx intercepts upstream failure (`502 Bad Gateway` / `504 Gateway Timeout`). Custom Nginx error page presented to clients; internal paths suppressed. | Systemd / Docker daemon automatically restarts backend process. Nginx resumes routing immediately upon health check success. | < 15 seconds (container restart) |
| Nginx Reverse Proxy Failure | Nginx process killed or server host reboot. | Inbound traffic rejected at TCP port 80/443. | Browser displays network connection refused. | Host process supervisor (systemd) restarts Nginx. Redundant upstream pair can be fronted by campus DNS load balancer. | < 5 seconds |
| WebSocket Disconnection | Network flap, backend restart, or client sleep mode. | Real-time order queue and canteen status push notifications pause. | StompJS / SockJS client in browser detects disconnect, enters exponential backoff retry loop (1s, 2s, 4s, 8s max). | On reconnect, frontend initiates REST sync (`GET /api/orders/active` and `GET /api/canteens`) to reconcile missed events. | Automatic (1-8 seconds) |
| Payment Gateway Outage | Razorpay API downtime or TLS handshake failure. | Digital checkout fails; students cannot place online prepaid orders. | `PaymentService.createOrder` catches `RazorpayException` and returns HTTP 502 with user-friendly error message. | System can fall back to "Pay at Counter" (Cash/UPI QR) if enabled in canteen settings. | Dependent on gateway SLA |
| SMTP Gateway Outage | Brevo API outage or invalid credentials. | Transactional password-reset and welcome emails delayed or dropped. | Non-blocking asynchronous event handling ensures user registration and orders complete even if email dispatch fails. | Email failures logged to `system_notification_queue` table for automated retry upon service recovery. | Non-blocking to core operations |

---

## 3. Disaster Recovery Objectives (Proposed Proposals with Rationale)

| Metric | Proposed Target | Technical Rationale & Architectural Feasibility |
|---|---|---|
| Recovery Point Objective (RPO) | <= 5 Minutes | Supported by PostgreSQL Write-Ahead Logging (WAL) continuous archiving. In the event of catastrophic primary storage loss, point-in-time recovery (PITR) restores all committed transactions up to the latest 5-minute WAL archive interval. |
| Recovery Time Objective (RTO) | <= 15 Minutes | Feasible using pre-built Docker container images and automated infrastructure-as-code scripts. A cold standby host can pull images, attach the latest restored database volume, and resume traffic within 15 minutes. |
| Maximum Tolerable Downtime (MTD) | 2 Hours | Bounded by campus lunch and breakfast peak dining hours. Non-operational hours have near-zero impact on campus academic activities. |

---

## 4. Database Backup, WAL Archiving & Restoration Strategy

### 4.1 Production Backup Classification
- **Current Development State:** Local PostgreSQL database instance initialized via JDBC schema scripts.
- **Production Classification:** `PRODUCTION DEPENDENCY — NOT VERIFIED IN LOCAL DEV`. Automated backup infrastructure must be provisioned during production infrastructure provisioning.

### 4.2 Prescribed Production Backup Topology
1. **Daily Full Logical Snapshot (`pg_dump`):**
   - Executed daily at 02:00 AM IST via automated cron job.
   - Command:
     ```bash
     pg_dump -U postgres -Fc -Z 6 -d charusatneeds -f /var/backups/postgresql/charusatneeds_$(date +%Y%m%d_%H%M%S).dump
     ```
   - Encryption: Encrypted at rest using GPG symmetric key or AWS KMS before transfer to offsite object storage (MinIO / S3).
   - Retention Policy: Retain daily dumps for 30 days, weekly dumps for 12 weeks, monthly dumps for 12 months.
2. **Continuous WAL Archiving (Point-in-Time Recovery - PITR):**
   - Configure `postgresql.conf`:
     ```ini
     wal_level = replica
     archive_mode = on
     archive_command = 'test ! -f /mnt/wal_archive/%f && cp %p /mnt/wal_archive/%f'
     archive_timeout = 300
     ```
   - Enables restoring the database to any exact second within the last 7 days.
3. **Automated Restoration Verification Drill:**
   - Monthly automated restoration testing onto an isolated staging database instance to verify backup archive integrity without human intervention.

---

## 5. Release Rollback & Deployment Safety Architecture

### 5.1 Frontend Rollback Protocol
- **Architecture:** The React frontend builds to static content in `Frontend/dist/` served via Nginx.
- **Rollback Procedure:**
  1. Maintain versioned deployment directories on the host:
     `/var/www/charusatneeds/releases/v1.0.0/`
     `/var/www/charusatneeds/releases/v1.0.1/`
  2. Nginx root points to a symbolic link:
     `/var/www/charusatneeds/current -> /var/www/charusatneeds/releases/v1.0.1/`
  3. Instant Rollback Execution:
     ```bash
     ln -sfn /var/www/charusatneeds/releases/v1.0.0 /var/www/charusatneeds/current
     nginx -s reload
     ```
  4. Downtime: 0 seconds (Atomic filesystem switch and graceful Nginx reload).

### 5.2 Backend Rollback Protocol
- **Architecture:** Standalone packaged Spring Boot JAR or Docker container.
- **Rollback Procedure:**
  1. Retain the preceding release JAR / container image (`charusat-needs-backend:v1.0.0`).
  2. If version `v1.0.1` exhibits anomalous memory consumption or error rates:
     ```bash
     docker stop charusat-backend-v101
     docker run -d --name charusat-backend-v100 -p 8000:8000 --env-file /etc/charusat/prod.env charusat-needs-backend:v1.0.0
     ```
  3. Nginx upstream health checks immediately reroute incoming traffic to the restored backend.
  4. Downtime: < 10 seconds.

### 5.3 Database Migration Compatibility (Expand -> Migrate -> Contract)
To enable zero-downtime rollbacks, database schema changes must strictly follow the three-phase **Expand -> Migrate -> Contract** pattern:
1. **Phase 1: Expand (Non-Breaking Additions):**
   - Add new nullable columns or tables.
   - Deploy backend version N+1 which writes to both old and new columns.
   - Backend version N remains 100% functional because old columns are intact.
2. **Phase 2: Migrate (Backfill):**
   - Run background migration script to populate data into new columns for historical records.
3. **Phase 3: Contract (Cleanup):**
   - Only after version N+1 is fully verified and stable, release version N+2 which removes old columns.
   - Direct destructive column drops during deployment are strictly prohibited.

---

## 6. Disaster Recovery Runbook

### Scenario A: Catastrophic Host Failure
1. Provision new compute instance (Linux Ubuntu 22.04 LTS / Debian 12).
2. Install Docker, Docker Compose, and Nginx.
3. Mount persistent storage volume or restore latest PostgreSQL backup snapshot.
4. Clone release repository and deploy via orchestrated compose file:
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```
5. Update DNS A record or campus gateway routing to point to new instance IP.
6. Verify `/api/public/health` returns `status: UP, database: UP`.

### Scenario B: Database Corruption or Accidental Deletion
1. Stop backend application immediately to prevent write compounding:
   ```bash
   systemctl stop charusat-backend
   ```
2. Locate the most recent clean logical backup dump from offsite storage.
3. Drop and recreate database:
   ```bash
   psql -U postgres -c "DROP DATABASE charusatneeds;"
   psql -U postgres -c "CREATE DATABASE charusatneeds OWNER postgres;"
   ```
4. Restore dump archive:
   ```bash
   pg_restore -U postgres -d charusatneeds -v /var/backups/postgresql/charusatneeds_latest.dump
   ```
5. Verify table row counts and referential integrity.
6. Restart backend application and execute synthetic verification checks.

---

## 7. Remaining Production Infrastructure Dependencies

The following infrastructure components must be established by the campus IT operations team prior to open campus go-live:
1. **Automated WAL Archiving Storage:** Designated NFS or S3 bucket for WAL segment archiving.
2. **Production SSL/TLS Certificates:** Let's Encrypt automated certbot or institutional Wildcard SSL certificate for `*.charusat.edu.in`.
3. **Host-Level Resource Monitoring:** Prometheus + Grafana or Datadog agent for CPU, RAM, disk I/O, and HikariCP pool monitoring.
4. **Automated Daily Offsite Backup Sync:** Cron job replicating database dumps to geographically isolated storage.

---

## 8. Resilience Assessment Conclusion

The Charusat Needs platform exhibits graceful degradation during component outages, features self-healing WebSocket reconnection protocols, enforces non-breaking database schema design, and supports sub-minute rollback capabilities across both frontend and backend tiers.
