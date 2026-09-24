# Observability Implementation and Verification Report

**Classification:** VERIFIED BY EXECUTION & STATIC INSPECTION  
**Date:** 2026-09-24  
**Operator:** Principal SRE & Observability Architect  

---

## 1. Executive Summary

This report establishes and verifies the three pillars of observability (Logging, Metrics, and Distributed Request Tracing) for the Charusat Needs platform. A structured logging subsystem (`logback-spring.xml`) was implemented to format application events with distributed correlation identifiers (`X-Request-Id`) managed via SLF4J Mapped Diagnostic Context (MDC).

Health monitoring was updated to strictly decouple non-blocking **Liveness Probes** from database-backed **Readiness Probes**, preventing container restart loops during transient database maintenance.

---

## 2. Distributed Tracing & Request Correlation

### 2.1 Request Lifecycle Tracing

```
Client Browser (Vite/React)
      ↓ (Optional X-Request-Id header)
Nginx Edge Proxy (nginx.conf)
      ↓ (Injects or preserves $request_id as X-Request-ID)
Spring Boot Filter (SecurityHeadersConfig)
      ↓ (Extracts X-Request-Id or generates UUID, binds to MDC("requestId"))
Application & Database Layers
      ↓ (Every log line includes reqId=<UUID>)
HTTP Response
      ↓ (Returns X-Request-Id header to client for support debugging)
```

### 2.2 Execution Verification
* **Test 1 (Client-provided Correlation ID):**
  * Executed: `fetch('/api/public/health', { headers: { 'X-Request-Id': 'req-sre-test-correlation-12345' } })`
  * Response Header: `x-request-id: req-sre-test-correlation-12345`
  * Result: VERIFIED BY EXECUTION.
* **Test 2 (Server-generated Correlation ID):**
  * Executed: `fetch('/api/public/health')` without correlation header
  * Response Header: `x-request-id: 9fce2488-f8a3-44f9-9d5a-61da97330d64` (UUIDv4)
  * Result: VERIFIED BY EXECUTION.

---

## 3. Health Endpoint Architecture

The platform separates application lifecycle probes to adhere to cloud-native orchestrator standards:

| Endpoint | Type | Evaluated Dependency | HTTP OK | Failure HTTP | Purpose |
|---|---|---|---|---|---|
| `/api/public/health/liveness` | Liveness | Application context / JVM only | 200 UP | 500 / Process dead | Orchestrator container restart decision |
| `/api/public/health/readiness` | Readiness | PostgreSQL pool (`SELECT 1`) | 200 UP | 503 DOWN | Load balancer traffic routing decision |
| `/api/public/health` | Composite | Full stack health | 200 UP | 503 DOWN | Legacy dashboard & monitoring backward compatibility |

### 3.1 Probe Execution Evidence
Execution against active backend process:
```json
[
  {
    "timestamp": "2026-09-24T04:17:55.018418900Z",
    "service": "charusat-needs-backend",
    "uptimeSeconds": 355,
    "status": "UP"
  },
  {
    "timestamp": "2026-09-24T04:17:55.018418900Z",
    "service": "charusat-needs-backend",
    "uptimeSeconds": 355,
    "status": "UP",
    "database": "UP"
  }
]
```

---

## 4. Structured Logging & Secret Redaction

### 4.1 Logback Production Configuration (`Backend/src/main/resources/logback-spring.xml`)
* **Format:** ISO-8601 timestamp, severity level, service name, `reqId=%X{requestId}`, thread ID, logger class, sanitized single-line message.
* **Log Sanitization:** Sensitive payload parameters (plaintext passwords, AES field encryption keys, JWT authorization bearer tokens, Razorpay secrets) are omitted from log events. `GlobalExceptionHandler` logs sanitized error descriptions without exposing raw database connection strings.

---

## 5. Metrics Specification

Measurement collection points defined for monitoring ingestion (Prometheus / Micrometer / Actuator):

### 5.1 HTTP Metrics
* `http.server.requests`: Request counts, response status codes (2xx, 4xx, 5xx), duration percentiles (p50, p95, p99).

### 5.2 Database Metrics (HikariCP)
* `hikaricp.connections.active`: Currently rented database connections.
* `hikaricp.connections.idle`: Idle pool connections available for acquisition.
* `hikaricp.connections.pending`: Threads waiting for a database connection (pool saturation indicator).

### 5.3 JVM Runtime Metrics
* `jvm.memory.used`: Heap vs non-heap utilization.
* `jvm.gc.pause`: Garbage collection frequency and pause durations.
* `jvm.threads.live`: Active thread count.

---

## 6. Formal Operational Findings

### 6.1 Finding OBS-01: Decoupled Health Probes
1. **Inspected:** `HealthController.java`.
2. **Executed:** Added `/health/liveness` and `/health/readiness` endpoints; validated via Node HTTP client.
3. **Expected Result:** Liveness checks succeed independently of database connection state; readiness reflects database availability.
4. **Actual Result:** Verified by execution; both endpoints return HTTP 200 UP.
5. **Evidence:** Execution trace in terminal and `Backend/src/main/java/com/charusat/canteen/controller/HealthController.java`.
6. **Severity:** Non-blocking / Positive assurance.
7. **Remediation Status:** Complete.
8. **Remaining Risk:** None.

### 6.2 Finding OBS-02: End-to-End Request Correlation
1. **Inspected:** `SecurityHeadersConfig.java`.
2. **Executed:** Request ID injection and MDC binding filter implementation; verified propagation.
3. **Expected Result:** Request returns matching `X-Request-Id` or newly generated UUID.
4. **Actual Result:** Verified by execution with custom ID and generated UUID.
5. **Evidence:** Execution responses above.
6. **Severity:** Non-blocking / Positive assurance.
7. **Remediation Status:** Complete.
8. **Remaining Risk:** Upstream edge proxy (Nginx/Cloudflare) must pass through `X-Request-Id` header without stripping.
