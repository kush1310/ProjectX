# Alerting and Monitoring Specification

**Classification:** VERIFIED BY STATIC INSPECTION & ARCHITECTURAL SYNTHESIS  
**Date:** 2026-09-24  
**Operator:** Principal SRE & Monitoring Architect  

---

## 1. Executive Summary

This document defines the operational alerting thresholds, severity classifications, escalation pathways, and dashboard specifications for the Charusat Needs production environment. The alerting architecture adheres to Google SRE principles, focusing on symptoms that impact end-user experience (availability, latency, data integrity) rather than noisy low-priority warnings.

---

## 2. Operational Alerting Catalog

| Alert ID | Alert Name | Condition / Trigger | Threshold | Severity | Immediate Response | Escalation Pathway | Recovery Condition |
|---|---|---|---|---|---|---|---|
| ALT-01 | Elevated HTTP 5xx Rate | HTTP 5xx responses / Total requests | > 2% over 5 min window | P1 (Critical) | Inspect recent deployments; check database pool and backend logs | On-call SRE -> DevOps Lead -> Principal Architect | HTTP 5xx < 0.5% for 10 min |
| ALT-02 | Service Outage (Backend Down) | Readiness probe (`/api/public/health/readiness`) fails | 3 consecutive failures (30s) | P1 (Critical) | Check container status, host OOM killer, database connectivity | On-call SRE immediately | Health returns HTTP 200 for 60s |
| ALT-03 | Database Pool Exhaustion | HikariCP pending connection requests | > 5 pending for > 30s | P1 (Critical) | Inspect slow running queries; scale pool or kill hung locks | On-call SRE -> DBA Lead | Pending connections drop to 0 |
| ALT-04 | High API Latency | Order creation or menu fetch p95 latency | > 1500 ms over 5 min | P2 (High) | Check database CPU, query execution plans, network hops | On-call SRE | p95 latency < 500 ms for 5 min |
| ALT-05 | Authentication Failure Spike | Failed login attempts from single IP or subnet | > 50 failures / 5 min | P2 (High) | Verify IP rate limiter activation; check for credential stuffing | Security Engineer | Failed logins < 5 / min |
| ALT-06 | Payment Verification Failure Spike | Razorpay HMAC signature validation failures | > 3 failures / 10 min | P1 (Critical) | Audit webhook secret mismatch or gateway API payload changes | Payments Engineer -> DevOps Lead | Zero signature failures for 30 min |
| ALT-07 | JVM Memory Pressure | JVM Old Gen Heap utilization | > 85% sustained for 5 min | P2 (High) | Trigger thread dump; inspect heap histogram; prepare rolling restart | Application SRE | Heap usage < 70% |
| ALT-08 | Disk Space Exhaustion | Host or volume disk space remaining | < 15% available storage | P2 (High) | Purge rotated logs; prune unused container images; expand volume | Infrastructure Engineer | Disk available > 25% |
| ALT-09 | WebSocket Drop Spike | Sudden mass disconnect of STOMP sessions | > 20% drops in 1 min | P3 (Moderate) | Check Nginx proxy_read_timeout and backend thread pool | Application SRE | Reconnection rate stabilizes |

---

## 3. Severity Tiers & SLA Response Times

* **P1 — Critical (Immediate Service Disruption):** Response within 15 minutes. High-impact customer outage, payment failure, or active security breach. Automatically pages on-call engineer via PagerDuty/Opsgenie.
* **P2 — High (Degraded Performance / Capacity Warning):** Response within 1 hour. Elevated latency, approaching disk limits, or memory pressure. Slack/Teams channel notification + ticket creation.
* **P3 — Moderate (Non-Customer Impairing Anomaly):** Response within 4 hours during business hours. Minor worker restart, temporary WebSocket reconnects.
* **P4 — Low (Informational / Periodic Audit):** Review during weekly operational review. Certificate expiration warnings (> 30 days).

---

## 4. Operational Dashboard Specification

### 4.1 Dashboard 1: Executive & Service Availability
* **Service Status Indicator:** Real-time health state of Nginx, Spring Boot backend, and PostgreSQL database.
* **Global Uptime Percentage:** 30-day and 7-day trailing SLO compliance (Target: 99.9% availability).
* **Active Order Throughput:** Orders per minute, active cart operations, and revenue per canteen.

### 4.2 Dashboard 2: Golden Signals & Performance
* **Latency:** Requests grouped by route (`/api/orders`, `/api/canteen/*/menu`, `/api/auth/*`) showing p50, p90, p95, and p99 percentiles.
* **Traffic:** Total Requests Per Second (RPS) partitioned by status code class (2xx, 3xx, 4xx, 5xx).
* **Errors:** Error rate percentage and error logs filtered by `reqId`.
* **Saturation:** Database connection pool usage (Hikari active vs max), JVM heap usage, and container CPU usage.

### 4.3 Dashboard 3: Security & Transaction Integrity
* **Auth Activity:** Successful logins vs failed attempts vs MFA challenges.
* **Rate Limiting Events:** HTTP 429 Too Many Requests count by client IP.
* **Payment Pipeline:** Orders created -> Razorpay orders generated -> Webhooks received -> Orders marked CONFIRMED.
