# Charusat Needs — Neon PostgreSQL Cloud Setup & Management

---

## 1. Overview & Free-Tier Specifications

Neon is the authoritative relational database engine for the Charusat Needs cloud deployment. Neon provides a serverless PostgreSQL architecture with storage/compute separation, automatic scale-to-zero, and point-in-time recovery.

### Zero-Cost Constraints:
* **Cost:** $0.00 / month (Free Tier).
* **Credit Card Requirement:** None.
* **Storage Limit:** 0.5 GB (500 MB) logical data storage.
* **Compute Limit:** 0.25 vCPU compute allowance (~100 active compute hours per month).
* **Endpoints:** 1 primary compute endpoint with automatic connection pooling (`PgBouncer`).
* **Connection Security:** Enforced TLS 1.3 / SSL (`sslmode=require`).

---

## 2. Step-by-Step Provisioning Runbook

1. **Sign Up / Login:**
   - Navigate to `https://console.neon.tech/`.
   - Sign in using GitHub OAuth or Google account.
2. **Create New Project:**
   - Project Name: `charusatneeds-prod`
   - Postgres Version: `16`
   - Cloud Provider & Region: `AWS` / `ap-southeast-1` (Singapore) or region closest to Render backend.
3. **Database Creation:**
   - Under the newly created project, navigate to **Databases**.
   - Ensure the database name is `charusatneeds`.
4. **Extract Connection Strings:**
   - Locate the **Connection Details** panel on the Neon Project Dashboard.
   - Toggle **Connection Pooling** ON (enables port 5432 with `-pooler` hostname).
   - Copy the JDBC connection string:
     ```text
     jdbc:postgresql://ep-silent-pool-[id]-pooler.ap-southeast-1.aws.neon.tech/charusatneeds?sslmode=require
     ```
   - Note the username, password, host, and database name.

---

## 3. Storage Discipline & Rules

1. **Zero Media in Database:**
   - Storing image bytes, videos, or heavy base64 strings in PostgreSQL columns (`BYTEA`, `TEXT`) is strictly prohibited.
   - All food photos, menus, and branding graphics must be stored in ImageKit or Backblaze B2.
   - PostgreSQL must only store text URL references (e.g., `https://ik.imagekit.io/charusatneeds/item_123.webp`).
2. **Connection Pool Discipline:**
   - Because serverless endpoints limit concurrent connections, the Spring Boot HikariCP pool is capped at `DB_POOL_MAX=10`.
   - All connections must route through the Neon Connection Pooler endpoint (`-pooler` suffix).

---

## 4. Database Migration Execution

Once connection credentials are ready, execute schema migration from your local workstation:

```powershell
$env:SPRING_DATASOURCE_URL="jdbc:postgresql://<neon-pooler-host>/charusatneeds?sslmode=require"
$env:SPRING_DATASOURCE_USERNAME="<neon-user>"
$env:SPRING_DATASOURCE_PASSWORD="<neon-password>"

# 1. Execute schema creation and table initialization
.\scripts\db-migrate.ps1

# 2. Seed initial 7 canteens and menu catalogue
node scratch/seed_real_canteen_inventory.js

# 3. Verify seeded records and vendor accounts
.\scripts\db-verify.ps1
```

---

## 5. Rollback & Export Strategy

To perform a logical export of the Neon database for disaster recovery:

```powershell
pg_dump "postgres://<neon-user>:<neon-password>@<neon-pooler-host>/charusatneeds?sslmode=require" > backups/neon_backup_manual.sql
```
