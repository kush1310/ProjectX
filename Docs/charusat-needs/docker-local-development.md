# Charusat Needs — Local Docker Development Environment

---

## 1. Environment Architecture

The local development environment uses Docker Compose to orchestrate seven interconnected containers, providing 100% offline parity with production cloud services without requiring external cloud accounts or internet connectivity.

```text
                             LOCAL DEVELOPER
                                    │
                     ┌──────────────┴──────────────┐
                     ▼                             ▼
              Frontend (Nginx)              Backend (Spring Boot)
              http://localhost:80           http://localhost:8000
                     │                             │
                     └──────────────┬──────────────┘
                                    │
    ┌───────────────────────────────┼───────────────────────────────┐
    │                               │                               │
    ▼                               ▼                               ▼
PostgreSQL 16                     Redis 7                        Mailpit
Port: 5432                       Port: 6379                   SMTP: 1025
GUI: pgAdmin (Port 5050)                                      Web UI: 8025
                                    │
                                    ▼
                             MinIO S3 Sandbox
                           API Port: 9000
                           Console: 9001
```

---

## 2. Service Inventory and Port Map

| Container Name | Service | Internal Port | Host Port | Credentials / Notes |
|---|---|---|---|---|
| **charusat-postgres** | PostgreSQL 16 Alpine | 5432 | 5432 | User: `postgres`, Password: `postgres`, DB: `charusatneeds` |
| **charusat-redis** | Redis 7 Alpine | 6379 | 6379 | Default: No password (protected mode inside network) |
| **charusat-backend** | Spring Boot 3.2.2 | 8000 | 8000 | Profile: `docker`, JVM RAM: Max 75% |
| **charusat-frontend** | React 18 SPA (Nginx) | 80 | 80 | Production-optimized static build |
| **charusat-pgadmin** | pgAdmin 4 Database GUI | 80 | 5050 | Email: `admin@charusatneeds.local`, Pass: `Admin123` |
| **charusat-minio** | MinIO Object Storage | 9000, 9001 | 9000, 9001 | User: `charusat_admin`, Pass: `CharusatMinioPass2026!` |
| **charusat-mailpit** | Mailpit Email Sandbox | 1025, 8025 | 1025, 8025 | SMTP: `localhost:1025`, Web UI: `http://localhost:8025` |

---

## 3. Operational PowerShell Scripts

All local operations are managed via verified PowerShell automation in the `scripts/` directory:

### 3.1 Start Local Environment
```powershell
.\scripts\dev-up.ps1
```
Builds containers if needed, spins up all 7 services in detached mode (`-d`), and verifies health probe readiness.

### 3.2 Stop Local Environment
```powershell
.\scripts\dev-down.ps1
```
Gracefully stops and terminates running containers without deleting database volumes.

### 3.3 Reset & Re-seed Environment
```powershell
.\scripts\dev-reset.ps1
```
Tears down containers, purges persistent volumes (`pgdata`, `redisdata`, `miniodata`), restarts clean services, and automatically triggers database seeding.

### 3.4 Verify Docker Services Health
```powershell
.\scripts\docker-test.ps1
```
Tests TCP socket connectivity and HTTP probe status across all seven local containers.

---

## 4. Local Tooling & Sandboxes

### 4.1 pgAdmin 4 (Database Management)
1. Open browser to `http://localhost:5050`.
2. Login with `admin@charusatneeds.local` / `Admin123`.
3. Add New Server:
   - Name: `Charusat Local DB`
   - Host name/address: `postgres` (or `charusat-postgres`)
   - Port: `5432`
   - Maintenance database: `charusatneeds`
   - Username: `postgres`
   - Password: `postgres`

### 4.2 Mailpit (Email Sandbox)
1. Open browser to `http://localhost:8025`.
2. When the backend triggers user registration, password resets, or order notifications under the `docker` profile, emails are captured locally by Mailpit.
3. No real outbound emails are transmitted over the public internet.

### 4.3 MinIO (S3 Storage Sandbox)
1. Open browser to `http://localhost:9001`.
2. Login with `charusat_admin` / `CharusatMinioPass2026!`.
3. Create buckets such as `charusatneeds-media` for testing S3 upload and download workflows.
