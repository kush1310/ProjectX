# Charusat Needs — End-to-End Deployment Runbook

---

## 1. Prerequisites and Preflight Protocol

Before initiating deployment to Vercel or Render, execute the unified preflight check script from a PowerShell console on Windows:

```powershell
.\scripts\deployment-check.ps1
```

Verification Gates:
* `[PASS] Node.js Runtime (v18+)`
* `[PASS] npm Package Manager`
* `[PASS] Java Development Kit (JDK 17+)`
* `[PASS] Apache Maven (3.8+)`
* `[PASS] Git Version Control System`
* `[PASS] Frontend Typecheck (TypeScript AST clean)`
* `[PASS] Backend Compilation (Maven clean compile)`
* `[PASS] Docker & Docker Compose Engine`

---

## 2. Phase 1 — Cloud Database Provisioning (Neon)

1. **Create Neon Project:** Follow `Docs/charusat-needs/neon-setup.md` to initialize a serverless PostgreSQL instance.
2. **Extract Connection Parameters:** Obtain the pooled connection string:
   ```text
   postgres://[user]:[password]@[endpoint]-pooler.neon.tech/charusatneeds?sslmode=require
   ```
3. **Run Schema Migration:**
   ```powershell
   $env:SPRING_DATASOURCE_URL="jdbc:postgresql://[endpoint]-pooler.neon.tech/charusatneeds?sslmode=require"
   $env:SPRING_DATASOURCE_USERNAME="[user]"
   $env:SPRING_DATASOURCE_PASSWORD="[password]"
   .\scripts\db-migrate.ps1
   ```
4. **Seed Database Inventory:**
   ```powershell
   node scratch/seed_real_canteen_inventory.js
   ```
5. **Verify Database State:**
   ```powershell
   .\scripts\db-verify.ps1
   ```

---

## 3. Phase 2 — Serverless Cache Provisioning (Upstash)

1. **Create Upstash Database:** Follow `Docs/charusat-needs/upstash-setup.md` to create a regional Redis instance.
2. **Retrieve Redis Host & Password:** Copy the primary endpoint host and TLS token.
3. **Execute Connectivity Test:**
   ```powershell
   $env:REDIS_HOST="[upstash-host].upstash.io"
   $env:REDIS_PORT="6379"
   $env:REDIS_PASSWORD="[token]"
   .\scripts\redis-test.ps1
   ```
   Ensure write, read, and invalidation cycles return HTTP/RESP OK.

---

## 4. Phase 3 — Backend Deployment (Render Web Service)

1. **Connect GitHub Repository:** Sign in to Render, navigate to Web Services, and select `New +` → `Web Service`.
2. **Select Docker Environment:**
   - Name: `charusatneeds-backend`
   - Region: `Singapore` (or lowest latency to Neon DB)
   - Runtime: `Docker`
   - Dockerfile Path: `./Backend/Dockerfile`
   - Docker Context: `./Backend`
3. **Configure Environment Variables:**
   Inject all values documented in `Docs/charusat-needs/cloud-environment-matrix.md`:
   - `SPRING_PROFILES_ACTIVE=prod`
   - `SPRING_DATASOURCE_URL=jdbc:postgresql://[neon-host]/charusatneeds?sslmode=require`
   - `SPRING_DATASOURCE_USERNAME=[neon-user]`
   - `SPRING_DATASOURCE_PASSWORD=[neon-password]`
   - `REDIS_ENABLED=true`
   - `REDIS_HOST=[upstash-host]`
   - `REDIS_PORT=6379`
   - `REDIS_PASSWORD=[upstash-token]`
   - `REDIS_SSL=true`
   - `JWT_SECRET=[base64-secret]`
   - `BREVO_API_KEY=[brevo-key]`
   - `CORS_ALLOWED_ORIGINS=https://[frontend-domain].vercel.app`
4. **Deploy & Capture Logs:** Click `Deploy Web Service`. Monitor container build and initialization.
5. **Verify Backend Health:**
   ```powershell
   curl -i https://[backend-service].onrender.com/healthz
   curl -i https://[backend-service].onrender.com/api/public/health
   ```
   Both endpoints must return HTTP 200 OK.

---

## 5. Phase 4 — Frontend Deployment (Vercel)

1. **Import Git Repository:** Sign in to Vercel, select `Add New...` → `Project`, and link the repository.
2. **Set Root Directory:** Set Root Directory to `Frontend`.
3. **Configure Build Settings:**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm ci`
4. **Set Environment Variables:**
   - `VITE_API_URL=https://[backend-service].onrender.com`
   - `VITE_WS_URL=wss://[backend-service].onrender.com/ws/websocket`
   - `VITE_GOOGLE_CLIENT_ID=[google-client-id]`
5. **Trigger Deployment:** Click `Deploy`.
6. **Verify Deep Links & SPA Routing:**
   Open:
   - `https://[project].vercel.app/`
   - `https://[project].vercel.app/canteens`
   - `https://[project].vercel.app/cart`
   Perform browser refresh on `/canteens` to confirm `vercel.json` SPA catch-all rewrite works cleanly.

---

## 6. Phase 5 — Google OAuth Production Redirect Alignment

1. Navigate to **Google Cloud Console** → **APIs & Services** → **Credentials**.
2. Select the OAuth 2.0 Web Client ID used by Charusat Needs.
3. Under **Authorized JavaScript Origins**, add:
   - `https://[project].vercel.app`
4. Under **Authorized Redirect URIs**, add:
   - `https://[project].vercel.app/auth/callback`
5. Save changes.

---

## 7. Phase 6 — Availability Monitoring (UptimeRobot)

1. Sign in to UptimeRobot dashboard.
2. Add Monitor 1 (Frontend):
   - Type: `HTTP(s)`
   - URL: `https://[project].vercel.app/`
   - Monitoring Interval: `5 minutes`
3. Add Monitor 2 (Backend Liveness):
   - Type: `HTTP(s)`
   - URL: `https://[backend-service].onrender.com/healthz`
   - Monitoring Interval: `5 minutes`
4. Save and verify active monitoring status.
