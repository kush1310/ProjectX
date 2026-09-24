# Charusat Needs — Rollback Procedures & Version Reversal

---

## 1. Rollback Strategy Overview

The deployment architecture ensures that frontend, backend, and database versions can be rolled back independently without causing cascading downtime or irreversible data loss.

---

## 2. Frontend Rollback (Vercel Instant Reversal)

Because Vercel maintains immutable, content-hashed deployment snapshots for every Git commit:

1. **Access Vercel Console:**
   - Navigate to the project dashboard on `https://vercel.com/`.
2. **Locate Deployments Tab:**
   - Click on the **Deployments** tab.
3. **Select Target Stable Version:**
   - Identify the previous healthy production deployment (identified by its Git SHA and build timestamp).
4. **Execute Instant Rollback:**
   - Click the three-dot menu `(...)` next to the stable deployment.
   - Click **Instant Rollback** (or **Promote to Production**).
5. **Validation:**
   - Edge DNS routing redirects 100% of public traffic to the previous bundle within 2-5 seconds.
   - Refresh `https://charusatneeds.vercel.app/` to verify rollback.

---

## 3. Backend Rollback (Render Web Service)

Render builds immutable Docker images for every deployed commit:

1. **Access Render Dashboard:**
   - Navigate to `https://dashboard.render.com/` and select `charusatneeds-backend`.
2. **Access Activity & Deploys:**
   - Click on **Events** or **Deploys**.
3. **Select Prior Build:**
   - Locate the last successful deployment that passed all health checks.
4. **Trigger Rollback:**
   - Click the options menu on that specific deploy and select **Rollback to this deploy**.
5. **Container Re-creation:**
   - Render starts the previous container image, runs the `/healthz` probe, and switches inbound traffic only when healthy.

---

## 4. Database Schema Reversal

1. **Backward Compatibility Rule:**
   - All database schema migrations (e.g. adding `release_at` or `scheduled_for`) must be non-breaking and additive.
   - Columns are never dropped in the same release that deprecates them.
2. **Restoring Previous Schema State:**
   - If a migration fails or must be reverted, apply the reverse SQL script or restore the pre-migration SQL backup:
     ```powershell
     psql "postgres://[user]:[password]@[neon-host]/charusatneeds?sslmode=require" < backups/neon_backup_pre_migration.sql
     ```
3. **Verify Integrity:**
   ```powershell
   .\scripts\db-verify.ps1
   ```
