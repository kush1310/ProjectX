# Grafana Cloud OpenTelemetry Java Integration Architecture

**Document Version:** 1.0.0  
**Target Environment:** Render Web Service (Docker / Linux AMD64 / Debian Jammy)  
**Telemetry Standard:** OpenTelemetry (OTel) 2.13.0 Java Agent  
**Ingestion Gateway:** Grafana Cloud OTLP HTTP/protobuf  

---

## 1. Brief Introduction

This document specifies the architectural integration of the OpenTelemetry Java instrumentation agent into the CharusatNeeds Spring Boot backend Docker container for telemetry export to Grafana Cloud. The integration uses the standard OpenTelemetry Java Agent (`opentelemetry-javaagent.jar`) attached at runtime, transmitting traces, metrics, and application runtime data directly to Grafana Cloud over authenticated OTLP/HTTP.

---

## 2. Detailed Explanation

### In-Process Agent Architecture vs. External Collector

Rather than provisioning a secondary, resource-consuming Grafana Alloy container on Render, the system embeds the official OpenTelemetry Java agent directly into the backend Docker image. The OpenTelemetry Java Agent instruments the Java Virtual Machine bytecode dynamically at startup using Java Instrumentation APIs.

```
┌────────────────────────────────────────────────────────────────────────┐
│ Render Free Web Service (Docker Container)                            │
│                                                                        │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │ Eclipse Temurin 17 JRE Runtime (Debian Jammy AMD64)          │     │
│   │                                                              │     │
│   │   ┌──────────────────────────────────────────────────────┐   │     │
│   │   │ Spring Boot Application (canteen-aggregator.jar)    │   │     │
│   │   │                                                      │   │     │
│   │   │  • Spring Web MVC        • HikariCP JDBC Pool        │   │     │
│   │   │  • Spring Security       • Lettuce Redis Client      │   │     │
│   │   └──────────────▲───────────────────────────────────────┘   │     │
│   │                  │ Bytecode Instrumentation                  │     │
│   │   ┌──────────────┴───────────────────────────────────────┐   │     │
│   │   │ OpenTelemetry Java Agent (v2.13.0)                   │   │     │
│   │   │  - In-process metrics collection                     │   │     │
│   │   │  - Distributed trace generation                      │   │     │
│   │   │  - Bounded ring buffer queue                         │   │     │
│   │   │  - Async non-blocking HTTP exporter                  │   │     │
│   │   └──────────────────────┬───────────────────────────────┘   │     │
│   └──────────────────────────┼───────────────────────────────────┘     │
└──────────────────────────────┼─────────────────────────────────────────┘
                               │ HTTPS / OTLP (Protobuf)
                               │ Header: Authorization=Basic <Base64>
                               ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Grafana Cloud OTLP Gateway                                             │
│ https://otlp-gateway-<region>.grafana.net/otlp                         │
│                                                                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │ Grafana Tempo    │  │ Grafana Mimir    │  │ Grafana Dashboards   │  │
│  │ (Traces)         │  │ (Metrics)        │  │ (Visualizations)     │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Fault-Tolerant, Fail-Open Execution Model

The integration is architected with complete fault tolerance:
1. **Dynamic Entrypoint Detection:** The Docker entrypoint checks if `OTEL_EXPORTER_OTLP_ENDPOINT` is present. If the variable is unset or empty, the JVM starts without the `-javaagent` argument, incurring zero overhead and zero network connection warnings during local development.
2. **Asynchronous Bounded Queues:** In production, the OpenTelemetry agent buffers spans and metric batches in memory using non-blocking bounded queues. If the Grafana Cloud network path experiences transient interruptions, dropped spans do not block user requests, API threads, or payment workflows.
3. **Explicit Kill-Switch:** Setting `OTEL_JAVAAGENT_ENABLED=false` completely deactivates instrumentation without requiring redeployment or container rebuilding.

### Credential Handling & Token Masking

Grafana Cloud authentication requires HTTP Basic Authentication where the username is the Grafana Cloud Instance ID and the password is an API Token with the `set:alloy-data-write` scope.

- **Storage Rule:** The Grafana Cloud instance credentials must be configured exclusively in the Render Dashboard as an encrypted environment variable.
- **Never Committed:** No token, instance ID, or base64 credential string is permitted in source code, properties files, or Dockerfiles.
- **Header Structure:** The agent consumes the credential via the standard OpenTelemetry header format:
  `OTEL_EXPORTER_OTLP_HEADERS="Authorization=Basic <BASE64_STRING>"`
  where `<BASE64_STRING>` is computed as `base64(INSTANCE_ID:GRAFANA_TOKEN)`.

---

## 3. Configuration Parameters

The following environment variables control OpenTelemetry behavior:

| Variable Name | Required | Default in Dockerfile | Render Dashboard Configuration | Description |
|---|---|---|---|---|
| **OTEL_SERVICE_NAME** | Required | `charusatneeds-backend` | Fixed in `render.yaml` | Service identifier in Grafana Tempo and Mimir |
| **OTEL_RESOURCE_ATTRIBUTES** | Required | `service.name=charusatneeds-backend,service.version=1.0.0,deployment.environment=production` | Fixed in `render.yaml` | Global metadata tags attached to all telemetry spans and metrics |
| **OTEL_EXPORTER_OTLP_PROTOCOL** | Required | `http/protobuf` | Fixed in `render.yaml` | Transport wire format for OTLP communication |
| **OTEL_JAVAAGENT_ENABLED** | Optional | `true` | Set to `true` (or `false` to disable) | Master toggle for OpenTelemetry bytecode agent |
| **OTEL_EXPORTER_OTLP_ENDPOINT** | Required for Export | None | User enters in Render Dashboard | Regional OTLP ingestion URL (e.g. `https://otlp-gateway-prod-us-east-0.grafana.net/otlp`) |
| **OTEL_EXPORTER_OTLP_HEADERS** | Required for Export | None | User enters in Render Dashboard | Authentication header: `Authorization=Basic <BASE64_CREDENTIALS>` |

---

## 4. Architectural Comparison: In-Process Agent vs. External Alloy Sidecar

| In-Process OpenTelemetry Java Agent | External Grafana Alloy Sidecar Service |
|---|---|
| Zero additional infrastructure cost on Render Free plan | Requires running a second dedicated Web Service or background worker |
| Zero inter-process network hops; memory-shared JVM instrumentation | Inter-process socket or HTTP overhead to transmit telemetry to local agent |
| Automatic bytecode instrumentation of Spring Boot, HikariCP, Lettuce, and HTTP clients | Requires custom Alloy flow configuration scripts (`config.alloy`) |
| Packaged directly into single application Docker image | Multi-container coordination required on platforms lacking native sidecars |
| Controlled via standardized OpenTelemetry environment variables | Controlled via proprietary Grafana Alloy HCL-like syntax |
| Automatic fail-open isolation inside JVM daemon threads | Process failure of sidecar leaves traces uncollected or buffered in memory |
| Minimal memory footprint (approximately 30 MB to 50 MB heap overhead) | Allocates 150 MB to 300 MB dedicated system memory for Alloy binary |
| Direct outbound TLS connection to Grafana Cloud OTLP Gateway | Outbound TLS connection handled by Alloy process |
| Fully portable across Render, AWS ECS, GCP Cloud Run, and Kubernetes | Portability tied to Alloy binary availability and architecture matching |
| Standard OpenTelemetry specification compliant with vendor-neutral lock-in | Grafana-specific configuration syntax and feature bindings |
| JVM lifecycle strictly tied to single application container | Lifecycle of sidecar must be synchronized with application container |
| Built-in trace-context propagation across HTTP headers | Relies on application injecting W3C trace context before sidecar handoff |

---

## 5. Examples

### Example A: How to Generate the Authorization Header Value

To generate the required `OTEL_EXPORTER_OTLP_HEADERS` value without exposing credentials in shell history:

In PowerShell:
```powershell
# Replace 1234567 with your Grafana Instance ID and token with your token
$InstanceId = "1234567"
$Token = "glc_eyJ..."
$Bytes = [System.Text.Encoding]::UTF8.GetBytes("${InstanceId}:${Token}")
$Base64 = [Convert]::ToBase64String($Bytes)
Write-Output "OTEL_EXPORTER_OTLP_HEADERS=Authorization=Basic $Base64"
```

In Linux / macOS Bash:
```bash
echo -n "1234567:glc_eyJ..." | base64
# Output: MTIzNDU2NzpnbGNfZXlK...
# Set OTEL_EXPORTER_OTLP_HEADERS in Render to:
# Authorization=Basic MTIzNDU2NzpnbGNfZXlK...
```

### Example B: Render Environment Variable Configuration

In the Render Dashboard for `charusatneeds-backend`:
```env
OTEL_SERVICE_NAME=charusatneeds-backend
OTEL_RESOURCE_ATTRIBUTES=service.name=charusatneeds-backend,service.version=1.0.0,deployment.environment=production
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
OTEL_JAVAAGENT_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp-gateway-prod-us-east-0.grafana.net/otlp
OTEL_EXPORTER_OTLP_HEADERS=Authorization=Basic <BASE64_TOKEN>
```

---

## 6. Advantages

1. **Production Visibility:** Delivers real-time APM telemetry including HTTP request durations, database query latencies via HikariCP, Redis cache hit/miss rates, and JVM memory pools.
2. **Distributed Tracing:** Generates end-to-end W3C Trace Context across inbound HTTP requests from the Vercel frontend through database transactions.
3. **Zero Code Intrusion:** Integrates through runtime bytecode manipulation without modifying Spring Boot source code or adding third-party compile-time SDK dependencies to `pom.xml`.
4. **Cost Optimization:** Transmits telemetry directly to Grafana Cloud without incurring costs for additional compute instances or container instances on Render.
5. **Standardized Telemetry:** Complies strictly with CNCF OpenTelemetry standards, allowing immediate redirection to other backends (Jaeger, Datadog, Honeycomb) by altering only the endpoint URL.

---

## 7. Disadvantages

1. **JVM Startup Latency:** Bytecode transformation during JVM bootstrap adds approximately 2 to 4 seconds to initial application startup time.
2. **Container Image Size:** The inclusion of `opentelemetry-javaagent.jar` increases the final runner Docker image size by approximately 25 MB.
3. **Minor Heap Overhead:** Agent in-memory ring buffers and class metadata consume between 30 MB and 50 MB of RAM, requiring appropriate tuning of `-XX:MaxRAMPercentage=75.0` on Render Free tier (512 MB memory limit).

---

## 8. Use Cases

1. **Database Query Performance Monitoring:** Pinpointing slow SQL queries executed against Neon Cloud PostgreSQL.
2. **Payment Lifecycle Tracing:** Tracing end-to-end execution of Razorpay webhook verification and order status transitions.
3. **Redis Cache Performance:** Observing Lettuce driver latency and Upstash connection pool health.
4. **Error Root-Cause Analysis:** Capturing unhandled exceptions and HTTP 5xx responses with complete stack traces correlated to specific user trace IDs.
5. **JVM Health Metrics:** Tracking Garbage Collection pauses, thread counts, and heap utilization to prevent OutOfMemory errors on constrained cloud tiers.

---

## 9. Limitations

1. **Render Free Tier Sleep Cycle:** When Render spins down the free instance after 15 minutes of inactivity, metric emission ceases until an inbound HTTP request wakes the instance.
2. **Log Volume Ingestion Quotas:** Excessive debug logging can rapidly consume monthly Grafana Cloud free tier data allowances; root log level is therefore maintained at `WARN` with application logs at `INFO`.
3. **No Inbound Agent Polling:** The agent operates strictly via outbound push over HTTPS (port 443); Grafana Cloud cannot initiate inbound scrapes into the Render container.

---

## 10. Local Execution & Fault-Tolerance Verification Evidence

### Verification 1: Local Docker Multi-Stage Image Build
- **Command:** `docker build -t charusatneeds-backend:deployment ./Backend`
- **Result:** Successfully compiled 140 Java source files, downloaded `opentelemetry-javaagent.jar` (v2.13.0), and created runtime image `charusatneeds-backend:deployment` with non-root user `spring:spring`.

### Verification 2: Health Endpoints Response Under Active OpenTelemetry
- **`GET /healthz`:** Responded `HTTP/1.1 200 OK` with JSON payload:
  `{"timestamp":"2026-09-24T17:54:33.901311095Z","service":"charusat-needs-backend","uptimeSeconds":21,"status":"UP"}`
- **`GET /api/public/health`:** Responded `HTTP/1.1 200 OK` with JSON payload:
  `{"timestamp":"2026-09-24T17:54:41.545985509Z","service":"charusat-needs-backend","uptimeSeconds":28,"status":"UP","database":"UP"}`

### Verification 3: Fail-Open Telemetry Fault Tolerance
- **Simulated Condition:** Telemetry gateway authentication challenge (HTTP 401).
- **Observed Behavior:** OpenTelemetry Java agent logged an asynchronous warning (`WARN io.opentelemetry.exporter.internal.http.HttpExporter - Failed to export logs. Server responded with HTTP status code 401`) in an isolated background thread.
- **Application Impact:** Zero disruption. Spring Boot Tomcat web server initialized cleanly on port 8000, connected to database and cache, and served all HTTP requests with zero latency penalty.

