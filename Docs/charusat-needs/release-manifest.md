# Charusat Needs — Production Release Manifest

---

## 1. Release Overview & Immutable Identifiers

* **Application Name:** Charusat Needs — Campus Canteen Aggregator & Ordering Platform
* **Release Target:** Public University Testing Deployment (Zero-Cost Cloud Architecture)
* **Release Type:** Release Candidate (RC-1)
* **Build Timestamp:** 2026-09-24T23:42:00Z
* **Source Git Commit SHA:** `f24efcee11c2c1cc83492fb5c52d531cda58ec4c`
* **Release Branch:** `main`

---

## 2. Artifact Verification & Checksums

### 2.1 Backend Executable JAR
* **Package Name:** `canteen-aggregator-1.0.0-SNAPSHOT.jar`
* **Target Bytecode:** Java 17 (Class Major Version 61.0)
* **Spring Boot Version:** 3.2.2
* **Artifact Path:** `Backend/target/canteen-aggregator-1.0.0-SNAPSHOT.jar`
* **SHA-256 Checksum:** `551A9EFFB65847CED862EC814B03FE56BB84F3666727031D26B41342577AC28A`
* **JVM Profile:** `prod`
* **Packaging Status:** Clean Multi-Stage Build

### 2.2 Frontend SPA Static Distribution
* **Bundle Type:** Vite 6 + React 18 + Tailwind CSS (SPA)
* **Output Path:** `Frontend/dist/`
* **Primary Entrypoint:** `index.html`
* **Chunk Assets Directory:** `Frontend/dist/assets/`
* **SPA Routing Catch-all:** Enforced via `Frontend/vercel.json` rewrite (`/(.*) → /index.html`)
* **Security Headers Config:** CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff

### 2.3 Container & Docker Specifications
* **Backend Image Tag:** `charusatneeds-backend:f24efcee11c2c1cc83492fb5c52d531cda58ec4c`
* **Base Runtime Image:** `eclipse-temurin:17-jre-jammy`
* **Execution Privileges:** Non-root (`USER spring:spring`, UID/GID 10001)
* **Listening Port:** 8000 (routes from HTTPS 443 on Render)
* **Frontend Local Image Tag:** `charusatneeds-frontend:f24efcee11c2c1cc83492fb5c52d531cda58ec4c`
* **Base Web Server Image:** `nginx:1.27-alpine`

---

## 3. Database & Migration Versioning

* **Authoritative Engine:** PostgreSQL 16
* **Target Database:** Neon Serverless PostgreSQL (`charusatneeds`)
* **Migration Schema Version:** `V6__scheduled_orders.sql`
* **Database Catalog State:**
  - Active Campus Canteens: 7 (`Sweet Spot`, `Bikes & Bites`, `Royal Canteen`, `Green Court`, `Food Safari`, `Campus Corner`, `Nescafe`)
  - Menu Items Seeded: 630 items
  - Initial Vendor Accounts: 7 verified accounts (`@charusat.edu.in`)
  - Scheduled Orders Schema: `release_at` timestamp with index `idx_orders_scheduled_release`

---

## 4. Configuration & Cryptography Baseline

* **Token Signature Algorithm:** HMAC-SHA256 (HS256)
* **Database Field Encryption:** AES-256-CBC with PKCS5 padding
* **In-Flight Payload Encryption:** AES-256-GCM with 96-bit IV
* **Institutional Domain Restriction:** `@charusat.edu.in` strict suffix matching
* **Transport Layer Security:** TLS 1.3 enforced across all external and internal provider connections
