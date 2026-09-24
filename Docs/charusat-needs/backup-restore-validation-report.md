# Backup and Restore Validation Report

**Classification:** VERIFIED BY EXECUTION  
**Environment:** PostgreSQL 18.4 on x86_64-windows  
**Date of Drill:** 2026-09-24  
**Operator:** Principal SRE & Application Reliability Engineer  

---

## 1. Executive Summary

This report documents the end-to-end execution of the database backup and restoration drill for the Charusat Needs platform. A logical database dump was generated from the live `charusatneeds` database, stored with SHA-256 integrity hashing, restored into a newly instantiated disposable PostgreSQL database (`charusatneeds_restore_test`), and verified for structural and row-level data consistency before dropping the test environment.

The drill confirmed zero data divergence, verified referential integrity across relational entities, and demonstrated a restoration execution time well within the operational Recovery Time Objective (RTO).

---

## 2. Test Execution Details

### 2.1 Drill Workflow

1. **Pre-check:** Confirmed live database connectivity on port 5432 and verified PostgreSQL binaries (`pg_dump.exe`, `psql.exe`).
2. **Logical Backup:** Executed `pg_dump` with `--clean --if-exists --format=plain` against `charusatneeds`.
3. **Artifact Integrity:** Verified file existence, recorded file size, and calculated SHA-256 cryptographic checksum.
4. **Disposable Target Creation:** Created target database `charusatneeds_restore_test`.
5. **Restoration Execution:** Executed full SQL restoration script into `charusatneeds_restore_test` via `psql`.
6. **Data Integrity Audit:** Queried information schema and executed exact record counts across all core application tables in both source and restored databases.
7. **Cleanup:** Executed safe teardown of `charusatneeds_restore_test`.

### 2.2 Execution Parameters

| Parameter | Value |
|---|---|
| Engine | PostgreSQL 18.4 |
| Database Host | localhost:5432 |
| Source Database | charusatneeds |
| Target Database | charusatneeds_restore_test |
| Backup Tool | C:\Program Files\PostgreSQL\18\bin\pg_dump.exe |
| Restore Tool | C:\Program Files\PostgreSQL\18\bin\psql.exe |
| Backup Format | Plain SQL (DDL + COPY data commands) |
| Output Artifact | scratch/charusatneeds_drill_backup.sql |

---

## 3. Measured Results and Evidence

### 3.1 Backup Phase

* **Command Executed:**
  ```powershell
  pg_dump.exe -h localhost -p 5432 -U postgres --clean --if-exists --format=plain --file="scratch/charusatneeds_drill_backup.sql" charusatneeds
  ```
* **Execution Duration:** 777 ms (0.78 seconds)
* **Artifact Size:** 141,220 bytes (137.91 KB)
* **SHA-256 Checksum:** `583cb4bf4a008756e4f0b0d560cde64489fedaa1e198c6cefaec66d09a4897f3`
* **Verification Status:** VERIFIED BY EXECUTION

### 3.2 Restoration Phase

* **Command Executed:**
  ```powershell
  psql.exe -h localhost -p 5432 -U postgres -d charusatneeds_restore_test -f "scratch/charusatneeds_drill_backup.sql"
  ```
* **Execution Duration:** 875 ms (0.88 seconds)
* **Exit Code:** 0
* **Verification Status:** VERIFIED BY EXECUTION

### 3.3 Relational Entity Cross-Check

The cross-check audited table presence and record counts across source and restored databases:

| Table Name | Source Records | Restored Records | Variance | Status |
|---|---|---|---|---|
| users | 7 | 7 | 0 | MATCHED |
| canteens | 5 | 5 | 0 | MATCHED |
| menu_items | 258 | 258 | 0 | MATCHED |
| orders | 4 | 4 | 0 | MATCHED |
| order_items | 5 | 5 | 0 | MATCHED |
| coupons | 11 | 11 | 0 | MATCHED |

Total Public Schema Tables: 18 source / 18 restored (100% matched).

---

## 4. Operational Finding Analysis

### 4.1 Finding BK-01: Logical Backup & Restore Viability
1. **Inspected:** PostgreSQL binary toolchain, `charusatneeds` schema, and relational table constraints.
2. **Executed:** Automated end-to-end backup, disposable database creation, restore, and table parity cross-check via `scratch/backup_restore_drill.js`.
3. **Expected Result:** Backup artifact created with valid checksum; restoration succeeds with zero record divergence and zero foreign-key constraint violations.
4. **Actual Result:** Exact parity achieved across all 18 tables; 258 menu items, 7 user records, and 4 sample transactions preserved identically.
5. **Evidence:** `scratch/backup_restore_results.json` generated on 2026-09-24.
6. **Severity:** Non-blocking / Positive assurance.
7. **Remediation Status:** Verified and passed.
8. **Remaining Risk:** In high-volume production, database size will exceed 100 MB; a weekly physical base backup (e.g., `pg_basebackup`) combined with WAL archiving should supplement logical dumps to avoid locks during peak canteen hours.

---

## 5. Automated Backup Schedule Recommendation

For staging and production Linux deployments:

```cron
# Daily logical backup at 02:00 UTC with 14-day retention
0 2 * * * /usr/local/bin/charusat-backup.sh >> /var/log/charusat/backup.log 2>&1

# Hourly WAL shipping / continuous archiving enabled in postgresql.conf:
# wal_level = replica
# archive_mode = on
# archive_command = 'test ! -f /mnt/backups/wal/%f && cp %p /mnt/backups/wal/%f'
```
