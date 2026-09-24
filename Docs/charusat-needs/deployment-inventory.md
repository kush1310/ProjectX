# Charusat Needs — Deployment Inventory & Service Matrix

---

## 1. Executive Summary

This inventory documents all architectural tiers, deployment platforms, operational constraints, and orchestration automation status for the Charusat Needs campus canteen aggregation platform. All cloud targets strictly observe the zero-cost requirement ($0/month, no credit card required).

---

## 2. Component Inventory Matrix

| Tier / Component | Current State | Target Deployment | Automated By Agent | Human Action Required |
|---|---|---|---|---|
| **Frontend** | React 18, Vite 6, Tailwind CSS, TypeScript. Fully verified SPA with dynamic API resolution. | **Vercel** (Edge CDN, HTTPS, automatic Git deployment) | Production build verification, `vercel.json` SPA routing, environment variable abstraction, security headers. | Connect GitHub repository to Vercel project, configure environment variables in Vercel dashboard. |
| **Backend** | Spring Boot 3.2.2, Java 17/21 bytecode, non-root multi-stage Docker container. | **Render** (Free Web Service, Singapore/Oregon region, Docker runtime) | Multi-stage `Dockerfile`, `render.yaml` blueprint, healthcheck endpoints (`/healthz`, `/api/public/health`), memory tuning (`MaxRAMPercentage=75`). | Link repository to Render Web Service, supply environment secrets via Render dashboard. |
| **Relational Database** | PostgreSQL 18.1 local with 7 canteens and 630 items seeded. | **Neon PostgreSQL** (Serverless PostgreSQL with SSL) | Schema definition (`schema.sql`), Flyway/manual SQL migration pipeline, connection pooling optimization (HikariCP max 10). | Create Neon project, create `charusatneeds` database, copy PostgreSQL connection string. |
| **Cache & Idempotency** | PostgreSQL-only fallback verified. RedisCacheService added with error-fallback. | **Upstash Redis** (Serverless Redis RESP & REST via TLS) | `RedisCacheService.java` cache-aside pattern, menu/canteen TTL caching, automatic invalidation on vendor mutation, safe degradation on timeout. | Create free Upstash Redis database, copy `REDIS_URL` connection string. |
| **Image CDN** | Local storage / base64 database fallback. | **ImageKit** (Image optimization, responsive WebP/AVIF transformations) | Abstraction design, CDN URL handling in frontend and database metadata. | Register ImageKit free account, copy Public Key, Private Key, and URL Endpoint. |
| **Large Media / Archives** | Local filesystem / database fallback. | **Backblaze B2** (S3-compatible object storage) | S3 protocol compatibility, MinIO local emulation. | Create free Backblaze B2 bucket, generate Application Key and Key ID. |
| **Transactional Email** | Brevo HTTPS API (`https://api.brevo.com/v3/smtp/email`) verified in `EmailService.java`. | **Brevo HTTPS API** (Bypasses Render outbound SMTP port blocking) | `EmailService.java` transactional dispatcher, non-blocking asynchronous email delivery. | Verify sender email (`canteen-alerts@charusat.edu.in` or personal admin email) in Brevo dashboard. |
| **Identity & SSO** | Google OAuth 2.0 with strict `@charusat.edu.in` domain validation. | **Google Cloud Console** (OAuth 2.0 Client ID) | `GoogleAuthService.java`, token exchange, institutional domain gating, frontend OAuth redirect handling. | Add production Vercel callback URL to Authorized Redirect URIs in Google Cloud Console. |
| **Uptime Monitoring** | Local health check scripts. | **UptimeRobot** (Free tier 50 monitors, 5-minute interval) | Process liveness (`/healthz`) and readiness (`/api/public/health`) endpoints. | Add Vercel and Render HTTPS URLs as HTTP(s) monitors in UptimeRobot dashboard. |
| **Application Observability** | Logback structured console logging. | **Grafana Cloud** (Free tier: Prometheus metrics, Loki logs) | Structured JSON/text logging with Request ID correlation, JVM/Hikari metrics. | Create free Grafana Cloud stack, configure Prometheus/Loki scrape endpoint or OpenTelemetry collector. |
| **Local Orchestration** | Standalone host services. | **Docker Desktop + Docker Compose** | Multi-container `docker-compose.yml` (Postgres, Redis, Backend, Frontend, pgAdmin, MinIO, Mailpit). | Install Docker Desktop on developer machine. |

---

## 3. Deployment Topology Diagram

```text
                                  STUDENTS & VENDORS
                                          │
                                          ▼
                               ┌─────────────────────┐
                               │       VERCEL        │
                               │  Vite React Bundle  │
                               │  Global Edge CDN    │
                               │  HTTPS Auto-SSL     │
                               └──────────┬──────────┘
                                          │
                        ┌─────────────────┴─────────────────┐
                        │ HTTPS (REST)                      │ WSS (STOMP WebSocket)
                        ▼                                   ▼
        ┌───────────────────────────────────────────────────────────┐
        │                          RENDER                           │
        │             Spring Boot 3.2.2 Docker Service              │
        │             Port 8000, 512MB RAM Container                │
        │             Non-Root Temurin JRE 17 Runtime               │
        └───────┬──────────────┬─────────────┬──────────────┬───────┘
                │              │             │              │
                │ PostgreSQL   │ Redis RESP  │ HTTPS API    │ HTTPS API
                ▼ (TLS)        ▼ (TLS)       ▼              ▼
        ┌──────────────┐ ┌───────────┐ ┌───────────┐ ┌──────────────┐
        │     NEON     │ │  UPSTASH  │ │   BREVO   │ │   IMAGEKIT   │
        │  Serverless  │ │Serverless │ │   Email   │ │  Image CDN   │
        │  PostgreSQL  │ │   Redis   │ │  Gateway  │ │   Delivery   │
        └──────────────┘ └───────────┘ └───────────┘ └──────────────┘
```
