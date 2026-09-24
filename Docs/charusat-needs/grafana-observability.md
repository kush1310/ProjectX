# Charusat Needs — Observability Architecture (Grafana Cloud)

---

## 1. Overview & Free-Tier Specifications

Grafana Cloud provides centralized observability, tracking application health, HTTP latency, JVM performance, HikariCP connection pool saturation, and structured application logs.

### Zero-Cost Constraints:
* **Cost:** $0.00 / month (Grafana Cloud Free Forever Tier).
* **Credit Card Requirement:** None.
* **Prometheus Metrics:** 10,000 active series / month.
* **Loki Logs:** 50 GB log ingestion / month (14-day retention).
* **Dashboards:** Unlimited dashboards & up to 3 active alert rules.

---

## 2. Telemetry Ingestion Architecture

```text
    ┌────────────────────────────────────────────────────────┐
    │                   RENDER SPRING BOOT                   │
    │  - Micrometer Prometheus Registry (/actuator/prometheus)│
    │  - Logback Structured Console & Vector Appender        │
    │  - Request ID Correlation Header (X-Request-ID)        │
    └───────────────────────────┬────────────────────────────┘
                                │
                                ▼ HTTPS POST
    ┌────────────────────────────────────────────────────────┐
    │                     GRAFANA CLOUD                      │
    │  - Mimir / Prometheus Metrics Engine                   │
    │  - Loki Log Aggregation & Querying (LogQL)             │
    │  - Centralized Health & Business Analytics Dashboards  │
    └────────────────────────────────────────────────────────┘
```

---

## 3. Metrics Specification

The Spring Boot backend exposes Prometheus metrics covering five critical operational domains:

### 3.1 HTTP Latency & Throughput
* `http_server_requests_seconds_count`: Total request volume categorized by status code and URI.
* `http_server_requests_seconds_sum`: Total duration spent servicing requests.
* Latency percentiles: p50, p95, and p99 latency buckets.

### 3.2 JVM Runtime Performance
* `jvm_memory_used_bytes{area="heap"}`: Heap memory consumption (must stay under 384 MB on Render Free).
* `jvm_gc_pause_seconds_count`: Garbage collection pauses and GC pause durations.
* `jvm_threads_live_threads`: Active thread count.

### 3.3 Database Connection Pool (HikariCP)
* `hikaricp_connections_active`: Concurrently active PostgreSQL connections.
* `hikaricp_connections_idle`: Idle pool connections available for immediate acquisition.
* `hikaricp_connections_pending`: Threads blocked waiting for a database connection (must remain 0).

### 3.4 Redis Cache Operations
* `cache_gets_total{cache="menu", result="hit"}`: Redis cache hits.
* `cache_gets_total{cache="menu", result="miss"}`: Redis cache misses triggering PostgreSQL queries.

---

## 4. Structured Logging & Secret Redaction

In `Backend/src/main/resources/logback-spring.xml`, logs are structured as JSON or key-value pairs with contextual metadata:

```text
timestamp="2026-09-24T18:40:00Z" level="INFO" thread="http-nio-8000-exec-1" logger="com.charusat.canteen.service.OrderService" request_id="req-9b81f" msg="Order created successfully" order_id="1042" student_email="student@charusat.edu.in" amount="120.00"
```

### Strict Redaction Standard:
Passwords, JWT signature secrets, Google OAuth secrets, Brevo API keys, full payment card payloads, and AES-256 field encryption keys are strictly omitted from log streams.
