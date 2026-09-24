# Charusat Needs — Database Backup & Restoration Runbook

---

## 1. Data Ownership & Storage Hierarchy

| Storage Layer | Data Classification | Durability Model | Backup Strategy |
|---|---|---|---|
| **Neon PostgreSQL** | Authoritative Source of Truth (Orders, Users, Canteens, Payments) | ACID Relational Storage | Point-in-time recovery + automated/manual `pg_dump` logical exports |
| **Upstash Redis** | Ephemeral Cache & Transient Rate Limits | Volatile LRU Memory | Disposable (no backup required; repopulated from DB) |
| **ImageKit / B2** | Media Assets & Food Images | Persistent Object Store | Source files preserved in media storage buckets |
| **Render Container** | Ephemeral Compute Process | Ephemeral Filesystem | Stateless (no local persistent state stored) |
| **Docker Local** | Development & Offline Verification | Local Docker Volumes | Development seed scripts (`scratch/seed_real_canteen_inventory.js`) |

---

## 2. Recovery Objectives

* **Recovery Point Objective (RPO):** < 1 hour for manual daily export; Neon maintains a 24-hour Point-in-Time Recovery (PITR) window on the free tier.
* **Recovery Time Objective (RTO):** < 15 minutes to provision a new database branch and restore schema/seed records.

---

## 3. Logical Export Procedures

### 3.1 Local Docker Database Export
Execute the PowerShell backup script:
```powershell
.\scripts\db-export.ps1
```
This automatically invokes `pg_dump` inside the `charusat-postgres` container and saves a timestamped SQL dump in `backups/charusatneeds_backup_[timestamp].sql`.

### 3.2 Cloud Neon Database Export
Execute `pg_dump` targeting the remote Neon pooled endpoint:
```powershell
pg_dump "postgres://[neon-user]:[neon-password]@[neon-pooler-host]/charusatneeds?sslmode=require" --clean --if-exists > backups/neon_backup_production.sql
```

---

## 4. Restoration Runbook

### 4.1 Local Restoration from SQL Dump
To restore a local Docker or development database from a backup file:
```powershell
# 1. Ensure Postgres container is running
docker exec -i charusat-postgres psql -U postgres -d charusatneeds < backups/charusatneeds_backup_[timestamp].sql

# 2. Verify restored entity counts
.\scripts\db-verify.ps1
```

### 4.2 Cloud Neon Restoration
In the event of accidental data corruption or schema migration rollback in cloud:
1. Open PowerShell terminal.
2. Run `psql` to pipe the SQL backup into the Neon instance:
   ```powershell
   psql "postgres://[neon-user]:[neon-password]@[neon-pooler-host]/charusatneeds?sslmode=require" < backups/neon_backup_production.sql
   ```
3. Restart the Render Web Service container to invalidate in-memory connection pools and re-initialize application caches.
4. Verify root health probe:
   ```powershell
   curl -i https://[backend-service].onrender.com/api/public/health
   ```
