# Charusat Needs — Final Pre-Provisioning Human Action Checklist

---

## 1. Governance & Separation Protocol

To strictly enforce zero credential leakage, zero cost, and zero hallucinated deployments, cloud resource creation is split into explicit boundaries:
* **HUMAN ACTION:** Steps performed by the user inside provider web consoles (account authentication, billing safety verification, resource naming, and secret extraction).
* **AGENT ACTION:** Code verification, schema migrations, seed automation, test suites, connectivity probes, and release sign-off.

---

## 2. Action Checkpoints

---

### ACTION ID: HUMAN-001 — Provision Neon Serverless PostgreSQL Database

* **Provider:** Neon
* **URL:** `https://console.neon.tech`
* **Exact Resource to Create:** PostgreSQL Project & Database
* **Exact Region:** `ap-southeast-1` (Singapore) / `AWS`
* **Exact Plan / Tier:** Free Tier ($0.00 / month, 0.5 GB storage, 0.25 vCPU compute, no credit card required)
* **Exact Configuration:**
  - Project Name: `charusatneeds-prod`
  - Postgres Version: **PostgreSQL 16** (Mandatory: See `database-version-reconciliation.md`)
  - Database Name: `charusatneeds`
  - Connection Pooling: **Enabled** (`-pooler` endpoint on port 5432)
* **Values You Must Copy:**
  - `SPRING_DATASOURCE_URL`: Full JDBC pooled URL:
    `jdbc:postgresql://ep-[endpoint-id]-pooler.ap-southeast-1.aws.neon.tech:5432/charusatneeds?sslmode=require`
  - `SPRING_DATASOURCE_USERNAME`: e.g. `neondb_owner` (or generated user)
  - `SPRING_DATASOURCE_PASSWORD`: Generated database password
* **Where Those Values Must Be Placed:**
  - In Render Dashboard → Environment Variables of `charusatneeds-backend`.
  - In local `.env` (strictly for running `scripts/db-migrate.ps1`).
* **What Credentials Must NEVER Be Placed in Frontend / Git:**
  - Never put `SPRING_DATASOURCE_PASSWORD` or the full connection string in `Frontend/`, git commits, or public markdown.
* **Exact Evidence You Should Return After Completion:**
  - The masked pooled hostname: `ep-****-pooler.ap-southeast-1.aws.neon.tech` and database confirmation (`charusatneeds`).
* **Next Agent Action:**
  - Agent executes `.\scripts\db-migrate.ps1` to apply schema `V1`..`V6` and `scratch/seed_real_canteen_inventory.js` to seed 7 canteens and 630 items.

---

### ACTION ID: HUMAN-002 — Provision Upstash Serverless Redis Database

* **Provider:** Upstash
* **URL:** `https://console.upstash.com`
* **Exact Resource to Create:** Redis Database
* **Exact Region:** `ap-southeast-1` (Singapore)
* **Exact Plan / Tier:** Free Tier ($0.00 / month, 10,000 commands/day, 256 MB storage, no credit card required)
* **Exact Configuration:**
  - Database Name: `charusatneeds-cache`
  - Type: `Regional`
  - Primary Region: `ap-southeast-1 (Singapore)` (matching Render backend region)
  - TLS (SSL): **Enabled** (Mandatory)
  - Eviction: **Volatile-LRU** (Auto-clears expired TTL keys)
* **Values You Must Copy:**
  - `REDIS_URL`: `rediss://default:[TOKEN]@[ENDPOINT].upstash.io:6379`
  - Or separated:
    - `REDIS_HOST`: `[ENDPOINT].upstash.io`
    - `REDIS_PORT`: `6379`
    - `REDIS_PASSWORD`: `[TOKEN]`
    - `REDIS_SSL`: `true`
* **Where Those Values Must Be Placed:**
  - In Render Dashboard → Environment Variables of `charusatneeds-backend`.
* **What Credentials Must NEVER Be Placed in Frontend / Git:**
  - Never put `REDIS_PASSWORD` or `REDIS_URL` in frontend bundle, Git commits, or public config.
* **Exact Evidence You Should Return After Completion:**
  - The masked endpoint host: `****.upstash.io` and TLS enabled confirmation.
* **Next Agent Action:**
  - Agent executes `.\scripts\redis-test.ps1` to verify TLS handshake, cache-aside read/write, and invalidation cycles.

---

### ACTION ID: HUMAN-003 — Deploy Frontend to Vercel

* **Provider:** Vercel
* **URL:** `https://vercel.com`
* **Exact Resource to Create:** Vercel Web Project
* **Exact Region:** Global Edge Network
* **Exact Plan / Tier:** Hobby Free Tier ($0.00 / month, 100 GB bandwidth)
* **Exact Configuration:**
  - Link GitHub Repository: `CharusatNeeds_SGP_Latest_10_8_26`
  - Framework Preset: `Vite`
  - Root Directory: `Frontend`
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Install Command: `npm ci`
* **Values You Must Inject in Vercel Environment Variables:**
  - `VITE_API_URL`: `https://[your-render-service].onrender.com/api`
  - `VITE_WS_URL`: `wss://[your-render-service].onrender.com/ws/websocket`
  - `VITE_GOOGLE_CLIENT_ID`: `[your-client-id].apps.googleusercontent.com`
  - `VITE_GOOGLE_REDIRECT_URI`: `https://[your-project].vercel.app/auth/callback`
* **What Credentials Must NEVER Be Placed in Frontend / Git:**
  - Never set `JWT_SECRET`, `GOOGLE_CLIENT_SECRET`, `BREVO_API_KEY`, or `SPRING_DATASOURCE_PASSWORD` in Vercel.
* **Exact Evidence You Should Return After Completion:**
  - The live public Vercel URL: `https://[project].vercel.app`.
* **Next Agent Action:**
  - Agent performs HTTP deep-link checks and CORS origin verification against the backend.

---

### ACTION ID: HUMAN-004 — Deploy Backend to Render Docker Web Service

* **Provider:** Render
* **URL:** `https://dashboard.render.com`
* **Exact Resource to Create:** Web Service (Docker Runtime)
* **Exact Region:** `Singapore` (or nearest matching Neon region)
* **Exact Plan / Tier:** Free Tier ($0.00 / month, 512 MB RAM, 750 free instance hours/month)
* **Exact Configuration:**
  - Service Name: `charusatneeds-backend`
  - Runtime: `Docker`
  - Dockerfile Path: `./Backend/Dockerfile`
  - Docker Context: `./Backend`
  - Health Check Path: `/healthz`
  - Auto-Deploy: `Yes` (on push to `main`)
* **Values You Must Inject in Render Environment Variables:**
  - `SPRING_PROFILES_ACTIVE`: `prod`
  - `SPRING_DATASOURCE_URL`: `jdbc:postgresql://ep-[endpoint]-pooler.ap-southeast-1.aws.neon.tech:5432/charusatneeds?sslmode=require`
  - `SPRING_DATASOURCE_USERNAME`: `[neon-user]`
  - `SPRING_DATASOURCE_PASSWORD`: `[neon-password]`
  - `DB_POOL_MAX`: `10`
  - `REDIS_ENABLED`: `true`
  - `REDIS_URL`: `rediss://default:[token]@[endpoint].upstash.io:6379`
  - `REDIS_SSL`: `true`
  - `JWT_SECRET`: `[base64-256bit-secret]`
  - `FIELD_ENCRYPTION_KEY`: `[32-char-key]`
  - `PAYLOAD_ENCRYPTION_KEY`: `[32-char-key]`
  - `BREVO_API_KEY`: `[brevo-api-key]`
  - `BREVO_SENDER_EMAIL`: `[verified-sender-email]`
  - `GOOGLE_CLIENT_ID`: `[client-id].apps.googleusercontent.com`
  - `GOOGLE_CLIENT_SECRET`: `[client-secret]`
  - `GOOGLE_REDIRECT_URI`: `https://[your-project].vercel.app/auth/callback`
  - `CORS_ALLOWED_ORIGINS`: `https://[your-project].vercel.app`
  - `FRONTEND_URL`: `https://[your-project].vercel.app`
* **What Credentials Must NEVER Be Placed in Frontend / Git:**
  - Do not commit these values to git or `render.yaml`. Use Render's private Environment Variables tab.
* **Exact Evidence You Should Return After Completion:**
  - The live backend URL: `https://[service].onrender.com` and log line: `Started CanteenApplication in X seconds`.
* **Next Agent Action:**
  - Agent executes automated HTTP health checks against `/healthz` and `/api/public/health`.

---

### ACTION ID: HUMAN-005 — Align Google OAuth 2.0 Web Client

* **Provider:** Google Cloud Console
* **URL:** `https://console.cloud.google.com/apis/credentials`
* **Exact Resource to Configure:** OAuth 2.0 Client IDs → Web application
* **Exact Region:** Global
* **Exact Plan / Tier:** Free
* **Exact Configuration:**
  - **Authorized JavaScript Origins:**
    - `https://[your-project].vercel.app`
    - `http://localhost:5173`
    - `http://localhost:80`
  - **Authorized Redirect URIs:**
    - `https://[your-project].vercel.app/auth/callback`
    - `http://localhost:5173/auth/callback`
    - `http://localhost:80/auth/callback`
* **Values You Must Copy:**
  - Client ID (e.g. `****.apps.googleusercontent.com`)
  - Client Secret (e.g. `GOCSPX-****`)
* **Where Those Values Must Be Placed:**
  - Client ID: Vercel (`VITE_GOOGLE_CLIENT_ID`) and Render (`GOOGLE_CLIENT_ID`).
  - Client Secret: Render ONLY (`GOOGLE_CLIENT_SECRET`).
* **What Credentials Must NEVER Be Placed in Frontend / Git:**
  - `GOOGLE_CLIENT_SECRET` must NEVER be exposed in Vercel or frontend code.
* **Exact Evidence You Should Return After Completion:**
  - Confirmation that `https://[your-project].vercel.app/auth/callback` is saved in Authorized Redirect URIs.
* **Next Agent Action:**
  - Agent verifies OAuth flow end-to-end with university email domain verification.

---

### ACTION ID: HUMAN-006 — Verify Brevo Transactional Email Sender

* **Provider:** Brevo
* **URL:** `https://app.brevo.com/senders/list`
* **Exact Resource to Create:** Verified Sender Email & API Key v3
* **Exact Plan / Tier:** Free Tier (300 emails/day, $0.00/month)
* **Exact Configuration:**
  - Add Sender Email: `canteen-alerts@charusat.edu.in` (or your personal administrator email).
  - Verify confirmation email received in inbox.
  - Generate API Key (v3): Name `charusatneeds-render-prod`.
* **Values You Must Copy:**
  - API Key: `xkeysib-...`
  - Verified Sender Email address.
* **Where Those Values Must Be Placed:**
  - In Render Dashboard: `BREVO_API_KEY` and `BREVO_SENDER_EMAIL`.
* **What Credentials Must NEVER Be Placed in Frontend / Git:**
  - `BREVO_API_KEY` must never be added to frontend code or public repos.
* **Exact Evidence You Should Return After Completion:**
  - Confirmation that sender status is `Verified` in Brevo dashboard.
* **Next Agent Action:**
  - Agent tests registration and password reset dispatch via HTTPS REST API.

---

### ACTION ID: HUMAN-007 — Setup ImageKit CDN

* **Provider:** ImageKit
* **URL:** `https://imagekit.io/dashboard`
* **Exact Resource to Create:** Free Media Library
* **Exact Plan / Tier:** Free Tier (20 GB bandwidth/month, 20 GB storage)
* **Exact Configuration:**
  - Set ImageKit ID: `charusatneeds`
* **Values You Must Copy:**
  - Public Key: `public_...`
  - Private Key: `private_...`
  - URL-endpoint: `https://ik.imagekit.io/[your_id]/`
* **Where Those Values Must Be Placed:**
  - Render: `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT`.
  - Vercel: `VITE_IMAGEKIT_URL_ENDPOINT`.
* **What Credentials Must NEVER Be Placed in Frontend / Git:**
  - `IMAGEKIT_PRIVATE_KEY` is server-only.
* **Exact Evidence You Should Return After Completion:**
  - URL-endpoint confirmed.
* **Next Agent Action:**
  - Agent tests on-the-fly WebP image delivery and responsive image parameters.

---

### ACTION ID: HUMAN-008 — Setup Backblaze B2 Object Storage

* **Provider:** Backblaze
* **URL:** `https://secure.backblaze.com/b2_buckets.htm`
* **Exact Resource to Create:** B2 Bucket & Application Key
* **Exact Plan / Tier:** Free Tier (10 GB storage, 1 GB/day egress)
* **Exact Configuration:**
  - Bucket Name: `charusatneeds-media-prod`
  - Files: `Public`
* **Values You Must Copy:**
  - S3 Endpoint (e.g. `s3.us-west-004.backblazeb2.com`)
  - Key ID & Application Key
* **Where Those Values Must Be Placed:**
  - Render Dashboard environment variables.
* **Exact Evidence You Should Return After Completion:**
  - Bucket name and endpoint hostname.
* **Next Agent Action:**
  - Agent verifies S3 API upload/download capability.

---

### ACTION ID: HUMAN-009 — Configure UptimeRobot Availability Monitors

* **Provider:** UptimeRobot
* **URL:** `https://uptimerobot.com/dashboard`
* **Exact Resource to Create:** 3 HTTP(s) Monitors
* **Exact Plan / Tier:** Free Tier (50 monitors, 5-minute interval)
* **Exact Configuration:**
  1. Frontend: `https://[your-project].vercel.app/` (Interval: 5m)
  2. Backend Liveness: `https://[your-service].onrender.com/healthz` (Interval: 5m)
  3. API Readiness: `https://[your-service].onrender.com/api/public/health` (Interval: 5m)
* **Exact Evidence You Should Return After Completion:**
  - Confirmation that all 3 monitors are created and show status `Up` (green).
* **Next Agent Action:**
  - Final operational sign-off.
