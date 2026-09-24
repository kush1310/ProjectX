# Charusat Needs — Production Deployment Architecture Specification

---

## 1. Architectural Overview

The Charusat Needs platform operates on a decoupled client-server cloud topology engineered to achieve high availability, strict zero-cost infrastructure compliance, low latency, and zero data corruption. The architecture guarantees clean separation between presentation, application execution, transactional persistence, caching, media delivery, and notification dispatch.

```text
                           CLIENT LAYER
            (Desktop Browsers / Mobile Devices / PWA)
                                │
                                ▼
    ┌───────────────────────────────────────────────────────┐
    │                      VERCEL EDGE                      │
    │  - Global Anycast CDN with Brotli / Gzip compression  │
    │  - Immutable static asset caching (Cache-Control)     │
    │  - Client-side Single Page Application (React 18)     │
    │  - Strict HTTP Security Headers (CSP, HSTS, X-Frame)  │
    └───────────────┬───────────────────────┬───────────────┘
                    │ HTTPS REST API        │ WSS (STOMP WebSocket)
                    ▼                       ▼
    ┌───────────────────────────────────────────────────────┐
    │                   RENDER WEB SERVICE                  │
    │  - Spring Boot 3.2.2 on Java 17 Temurin JRE           │
    │  - Non-root containerized execution (/app, port 8000) │
    │  - Stateless application logic & JWT verification    │
    │  - In-flight AES-256-GCM payload decryption filter    │
    │  - HikariCP Connection Pool (Max: 10 connections)     │
    │  - Scheduled Order Event Dispatch Engine              │
    └───────┬───────────────┬───────────────┬───────┬───────┘
            │               │               │       │
            ▼ (TLS)         ▼ (TLS)         ▼       ▼
    ┌──────────────┐ ┌─────────────┐ ┌──────────┐ ┌─────────────┐
    │  NEON DB     │ │ UPSTASH     │ │ BREVO    │ │ IMAGEKIT    │
    │  Serverless  │ │ Serverless  │ │ HTTPS    │ │ Global CDN  │
    │  PostgreSQL  │ │ Redis Cache │ │ REST API │ │ Media Edge  │
    │  SSL Encrypt │ │ Fail-Open   │ │ Port 443 │ │ WebP Trans  │
    └──────────────┘ └─────────────┘ └──────────┘ └─────────────┘
```

---

## 2. Component Tier Specifications

### 2.1 Frontend Delivery Tier (Vercel)
* **Hosting Platform:** Vercel Global Edge Network.
* **Technology:** Vite 6, React 18, Tailwind CSS, TypeScript.
* **Routing Strategy:** Single Page Application (SPA) with client-side history API routing. Handled at edge via `vercel.json` rewrite (`/(.*) → /index.html`).
* **Caching Strategy:**
  - `index.html`: `public, max-age=0, must-revalidate` (guarantees instant deployment updates).
  - `/assets/*` (Content-hashed JS, CSS, fonts, SVG): `public, max-age=31536000, immutable`.
* **Security Headers:**
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### 2.2 Application Backend Tier (Render)
* **Hosting Platform:** Render Web Services (Singapore / Oregon Free Tier).
* **Technology:** Spring Boot 3.2.2, Spring Security 6, Eclipse Temurin 17 JRE Jammy.
* **Execution Boundary:** Containerized Linux container running as non-root user `spring:spring` (UID/GID 10001).
* **Memory & Process Budget:** 512 MB RAM instance cap. JVM tuned via `-XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError`.
* **Spin-down & Cold-start Dynamics:**
  - 15-minute idle inactivity spin-down.
  - Approximately 45-60 second spin-up upon inbound HTTP/WSS request.
  - Automatic scheduled order catch-up executed on `ApplicationReadyEvent` lifecycle hook via `OrderReleaseScheduler.java`.

### 2.3 Authoritative Database Tier (Neon PostgreSQL)
* **Hosting Platform:** Neon Serverless PostgreSQL (AWS Region: Singapore / Frankfurt / US-East).
* **Engine:** PostgreSQL 16 compatible serverless database.
* **Connection Security:** Mandatory SSL (`sslmode=require`).
* **Connection Management:** HikariCP connection pool configured with `maximum-pool-size=10`, `minimum-idle=2`, `idle-timeout=30000ms`, `connection-timeout=20000ms` to avoid exhausting serverless pool limits.
* **Data Boundary:** Strictly structured transactional entities: users, canteens, menu items, orders, order items, coupons, payouts, and scheduled order release timestamps. Large binary objects (images, videos, PDF menus) are forbidden.

### 2.4 Caching & Acceleration Tier (Upstash Redis)
* **Hosting Platform:** Upstash Serverless Redis.
* **Protocol:** TLS-encrypted Redis RESP protocol (`rediss://`).
* **Architecture Pattern:** Cache-Aside with Fail-Open degradation.
* **Key Namespaces:**
  - `canteens:all`: Global canteen list (TTL: 1 hour).
  - `canteen:{id}`: Canteen entity and metadata (TTL: 1 hour).
  - `menu:{canteenId}`: Complete menu item list for canteen (TTL: 30 minutes).
  - `offers:{canteenId}`: Active promotional coupons for canteen (TTL: 15 minutes).
* **Invalidation Semantics:** Synchronous write-through invalidation on any canteen or menu item mutation initiated by a vendor or administrator.
* **Resilience Rule:** If Redis is down, times out, or reaches its daily quota, the application logs a warning and transparently queries PostgreSQL.

### 2.5 Media & Storage Tier (ImageKit + Backblaze B2)
* **ImageKit:** Global image CDN responsible for dynamic resizing, WebP/AVIF transcoding, and caching of food photos and canteen branding assets.
* **Backblaze B2:** S3-compatible cloud object storage for raw media archives, vendor business licenses, and static documents.
* **Decoupling Rule:** All media requests bypass Render directly to CDN edges, conserving backend RAM and CPU bandwidth.

### 2.6 Transactional Notification Tier (Brevo)
* **Integration Model:** Direct HTTPS REST API (`https://api.brevo.com/v3/smtp/email`) using JSON payloads.
* **Port Constraint:** Replaces legacy SMTP (ports 25, 465, 587) which are hard-blocked by Render Free.
* **Transaction Isolation:** Email dispatch occurs asynchronously. Notification failures are logged but never trigger database transaction rollbacks.

### 2.7 Identity & Authentication Tier (Google OAuth 2.0)
* **Protocol:** OpenID Connect / OAuth 2.0 Authorization Code flow.
* **Domain Gating:** Strict enforcement of `@charusat.edu.in` email addresses in `GoogleAuthService.java`. Any attempt to authenticate with personal `@gmail.com` accounts is rejected with HTTP 403 Forbidden.
* **Token Issuance:** Upon successful identity verification, backend generates a signed HS256 JWT containing user roles, email, and subject ID.

---

## 3. Network & Security Perimeter

1. **Edge Ingress:** Vercel receives all client HTTPS traffic. Static assets are served directly from edge nodes.
2. **API Proxying & Direct Origin:** Frontend makes cross-origin requests to Render backend over HTTPS.
3. **CORS Enforcement:** The backend rejects all origins except the explicit Vercel production domain and local development origins (`http://localhost:5173`). Wildcard `*` CORS is strictly prohibited.
4. **Data Encryption:**
   - In Transit: TLS 1.3 enforced across all external and internal provider connections.
   - At Rest: AES-256 field encryption for sensitive user data; Neon and Upstash default volume encryption.
   - Application In-Flight: AES-256-GCM request/response payload encryption between client and server.
