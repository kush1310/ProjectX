# Charusat Needs — Render Docker Backend Deployment Guide

---

## 1. Overview & Free-Tier Specifications

Render hosts the containerized Spring Boot 3.2.2 application. Render Free web services provide automatic HTTPS, container execution, and zero-downtime deployment capabilities.

### Zero-Cost Constraints:
* **Cost:** $0.00 / month (Free Tier).
* **Credit Card Requirement:** None.
* **RAM Budget:** 512 MB memory limit.
* **CPU Budget:** 0.1 CPU core shared.
* **Monthly Active Hours:** 750 free instance hours per month.
* **Spin-down Policy:** Automatically spins down to 0 instances after 15 minutes of inactivity.
* **Cold-start Latency:** 45-60 seconds on first incoming request after spin-down.
* **Network Ports:** Inbound HTTPS port 443 routes to container port 8000. Outbound SMTP ports (25, 465, 587) are blocked.

---

## 2. Infrastructure-as-Code (`render.yaml`)

The repository includes a root `render.yaml` specification for deterministic deployment:

```yaml
services:
  - type: web
    name: charusatneeds-backend
    env: docker
    region: singapore
    plan: free
    dockerfilePath: ./Backend/Dockerfile
    dockerContext: ./Backend
    healthCheckPath: /healthz
    autoDeploy: true
    envVars:
      - key: SPRING_PROFILES_ACTIVE
        value: prod
      - key: PORT
        value: 8000
      - key: DB_POOL_MAX
        value: 10
      - key: REDIS_ENABLED
        value: true
      - key: REDIS_PORT
        value: 6379
      - key: REDIS_SSL
        value: true
```

---

## 3. Step-by-Step Manual Deployment Runbook

1. **Sign in to Render:**
   - Navigate to `https://render.com/` and log in via GitHub.
2. **Create New Web Service:**
   - Click **New +** → **Web Service**.
   - Select the `CharusatNeeds_SGP_Latest_10_8_26` GitHub repository.
3. **Configure Service Details:**
   - **Name:** `charusatneeds-backend`
   - **Region:** `Singapore` (matches Neon and Upstash region).
   - **Branch:** `main` (or active release branch).
   - **Runtime:** `Docker`.
   - **Dockerfile Path:** `./Backend/Dockerfile`.
   - **Docker Build Context:** `./Backend`.
   - **Instance Type:** `Free`.
4. **Health Check Path:**
   - Set **Health Check Path** to `/healthz`.
5. **Inject Secrets & Environment Variables:**
   Under **Environment**, add the following sensitive variables:
   - `SPRING_DATASOURCE_URL`: `jdbc:postgresql://<neon-pooler-host>/charusatneeds?sslmode=require`
   - `SPRING_DATASOURCE_USERNAME`: `<neon-db-user>`
   - `SPRING_DATASOURCE_PASSWORD`: `<neon-db-password>`
   - `REDIS_HOST`: `<upstash-host>.upstash.io`
   - `REDIS_PASSWORD`: `<upstash-token>`
   - `JWT_SECRET`: `<base64-secret>`
   - `BREVO_API_KEY`: `<brevo-key>`
   - `GOOGLE_CLIENT_ID`: `<google-client-id>`
   - `GOOGLE_CLIENT_SECRET`: `<google-client-secret>`
   - `CORS_ALLOWED_ORIGINS`: `https://[your-vercel-project].vercel.app`
6. **Trigger Build & Monitor Logs:**
   - Click **Create Web Service**.
   - Observe the multi-stage Maven build in Render build logs.
   - Wait for `Started CanteenApplication in X.XXX seconds (process running for Y.YYY)`.
   - Confirm Render reports service status: `Live`.

---

## 4. Cold-Start Dynamics & Scheduled Order Recovery

1. **15-Minute Idle Sleep:**
   - When no HTTP or WebSocket traffic occurs for 15 minutes, Render spins the container down to sleep.
2. **Cold Start:**
   - When a user visits the Vercel frontend and requests `/api/public/canteens`, Render wakes the container.
   - The frontend handles the latency gracefully by showing a modern pulsating loading spinner.
3. **Scheduled Order Catch-up:**
   - Any scheduled orders whose `release_at` timestamp elapsed while the container was asleep are released immediately upon container startup via `OrderReleaseScheduler.java`:
   ```java
   @EventListener(ApplicationReadyEvent.class)
   public void onStartup() {
       logger.info("Render container initialized. Releasing overdue scheduled orders...");
       releaseEligibleOrders();
   }
   ```
