# Charusat Needs — Operational Baseline & Repository Forensics

**Document Version:** 1.0.0  
**Inspection Date:** 2026-09-24  
**Classification:** Operational Architecture & Release Engineering  
**Lead Authority:** Principal DevOps Engineer, SRE Architect & Release Lead  
**Governing Standard:** IEEE 828-2012 (Configuration Management in Systems & Software Engineering)  

---

## 1. Executive Summary

This operational baseline establishes the definitive configuration inventory, runtime characteristics, and architectural landscape of the Charusat Needs repository. It records verified technical components across frontend, backend, database, reverse proxy, and infrastructure layers prior to operationalization.

Evidence classification standard applied:
- `VERIFIED BY EXECUTION`: Directly confirmed via running processes, test scripts, or command output.
- `VERIFIED BY STATIC INSPECTION`: Confirmed by analyzing source code, package manifests, or configuration files.
- `DOCUMENTED BUT NOT EXECUTED`: Stated in project documentation without direct execution logs.
- `INFERRED`: Derived logically from adjacent architectural evidence.
- `BLOCKED BY EXTERNAL DEPENDENCY`: Dependent on external enterprise, banking, or campus infrastructure.
- `NOT IMPLEMENTED`: Absent from the repository.

---

## 2. Frontend Subsystem Inventory

| Dimension | Specification / Value | Evidence Status | Source Reference |
|---|---|---|---|
| Node.js Runtime | Node.js v22.23.2 | VERIFIED BY EXECUTION | `node -v` output |
| Package Manager | npm 11.12.1 | VERIFIED BY EXECUTION | `npm -v` output |
| Core Framework | React 18.3.1 + React DOM 18.3.1 | VERIFIED BY STATIC INSPECTION | `Frontend/package.json` |
| Build Tooling | Vite 6.0.5 | VERIFIED BY STATIC INSPECTION | `Frontend/package.json`, `vite.config.ts` |
| Language & Compiler | TypeScript 5.6.2 (Target ES2020) | VERIFIED BY STATIC INSPECTION | `Frontend/tsconfig.json` |
| Styling Architecture | Tailwind CSS 3.4.1 + PostCSS + Autoprefixer | VERIFIED BY STATIC INSPECTION | `Frontend/tailwind.config.js`, `style.css` |
| Component Primitives | Radix UI (`@radix-ui/react-label`), Lucide Icons | VERIFIED BY STATIC INSPECTION | `Frontend/package.json` |
| Animation / Motion | Framer Motion 11.0.8, Lenis 1.0.42 | VERIFIED BY STATIC INSPECTION | `Frontend/package.json` |
| Client-Side Routing | React Router DOM 6.22.0 | VERIFIED BY STATIC INSPECTION | `Frontend/src/main.tsx` |
| Real-Time Transport | `@stomp/stompjs` 7.3.0 over SockJS (`/ws-canteen`) | VERIFIED BY STATIC INSPECTION | `Frontend/src/hooks/useWebSocket.ts` |
| API Communication | Axios 1.13.2 + native Fetch API | VERIFIED BY STATIC INSPECTION | `Frontend/src/utils/api.ts` |
| Client Encryption | Web Crypto API (SubtleCrypto AES-256-GCM) | VERIFIED BY STATIC INSPECTION | `Frontend/src/utils/payloadCrypto.ts` |
| Schema Validation | Zod 4.3.5 | VERIFIED BY STATIC INSPECTION | `Frontend/package.json` |
| Static Linter | ESLint 9.17.0 (`@eslint/js`, `typescript-eslint`) | VERIFIED BY STATIC INSPECTION | `Frontend/package.json` |
| Automated Tests | None configured in `package.json` (`test` script absent) | VERIFIED BY STATIC INSPECTION | `Frontend/package.json` |

---

## 3. Backend Subsystem Inventory

| Dimension | Specification / Value | Evidence Status | Source Reference |
|---|---|---|---|
| Build Automation | Apache Maven 3.9.12 | VERIFIED BY EXECUTION | `mvn -version` output |
| Maven Wrapper | Absent (`mvnw` / `mvnw.cmd` not committed) | VERIFIED BY STATIC INSPECTION | `Backend/` directory listing |
| Java Compiler Target | Java 17 (`-release 17`, bytecode major version 61) | VERIFIED BY STATIC INSPECTION | `Backend/pom.xml` (`<java.version>17</java.version>`) |
| Local JVM Runtime | Oracle OpenJDK 21.0.12 LTS (Build 21.0.12+7-LTS-205) | VERIFIED BY EXECUTION | `java -version` output |
| Application Framework | Spring Boot 3.2.2 | VERIFIED BY STATIC INSPECTION | `Backend/pom.xml` parent artifact |
| Persistence Technology | Spring Data JDBC / `JdbcTemplate` (RowMapper queries) | VERIFIED BY STATIC INSPECTION | `Backend/pom.xml`, repository classes |
| Primary Database | PostgreSQL (Local development port 5432, db `charusatneeds`) | VERIFIED BY EXECUTION | Active listening on TCP port 5432 |
| In-Memory Fallback | H2 Database (`com.h2database:h2`, scope runtime) | VERIFIED BY STATIC INSPECTION | `Backend/pom.xml` |
| Security Framework | Spring Security 6.2.1 + `@EnableMethodSecurity` | VERIFIED BY STATIC INSPECTION | `Backend/src/main/java/.../SecurityConfig.java` |
| Token Architecture | JJWT (io.jsonwebtoken 0.12.3) HMAC-SHA256 | VERIFIED BY STATIC INSPECTION | `Backend/src/main/java/.../JwtUtils.java` |
| Wire Encryption | Application-layer AES-256-GCM via `PayloadEncryptionFilter` | VERIFIED BY STATIC INSPECTION | `Backend/.../PayloadCryptoService.java` |
| Email Service | Spring Boot Starter Mail + Brevo HTTP API | VERIFIED BY STATIC INSPECTION | `Backend/src/main/resources/application.properties` |
| WebSocket Broker | Spring STOMP SimpleBroker (`/topic`) on `/ws-canteen` | VERIFIED BY STATIC INSPECTION | `Backend/src/main/java/.../WebSocketConfig.java` |
| API Documentation | SpringDoc OpenAPI / Swagger UI 2.3.0 | VERIFIED BY STATIC INSPECTION | `Backend/pom.xml` |
| Payment Gateway SDK | Razorpay Java SDK 1.4.5 (Test Mode active) | VERIFIED BY STATIC INSPECTION | `Backend/.../RazorpayConfig.java` |
| Schema Management | `schema.sql` via `spring.sql.init.mode=always` | VERIFIED BY STATIC INSPECTION | `Backend/src/main/resources/application.properties` |
| Migration Scripts | 5 unmanaged Flyway scripts in `db/migration/` | VERIFIED BY STATIC INSPECTION | `Backend/src/main/resources/db/migration/` |
| Health Monitoring | Custom `HealthController` (`/api/public/health`) executing `SELECT 1` | VERIFIED BY EXECUTION | Observed HTTP 200 response |

---

## 4. Infrastructure & Deployment Asset Forensics

| Infrastructure Element | Current State | Evidence Status | Finding / Action Required |
|---|---|---|---|
| Reverse Proxy Specification | Hardened Nginx configuration exists at `Docs/charusat-needs/nginx-production.conf` | VERIFIED BY STATIC INSPECTION | Validated specification; not yet provisioned as an active service on the local Windows development machine. |
| Docker Containerization | Dockerfiles absent in both `Frontend/` and `Backend/` | VERIFIED BY STATIC INSPECTION | Must create multi-stage Dockerfiles for frontend static hosting and backend JVM execution. |
| Container Orchestration | `docker-compose.yml` absent | VERIFIED BY STATIC INSPECTION | Must author reproducible `docker-compose.prod.yml` coordinating Nginx, Spring Boot, and PostgreSQL. |
| CI/CD Automation | GitHub Actions / GitLab CI workflows absent (`.github/` not present) | VERIFIED BY STATIC INSPECTION | Must implement end-to-end GitHub Actions workflow `.github/workflows/ci.yml`. |
| Automated Backup Infrastructure | Manual SQL scripts only; no automated backup cron or WAL archiving | VERIFIED BY STATIC INSPECTION | Classified as `PRODUCTION DEPENDENCY — NOT VERIFIED IN LOCAL DEV`. Need automated scripts. |
| Metric Aggregation | Spring Boot Actuator absent; custom health probe active | VERIFIED BY STATIC INSPECTION | Liveness and readiness probes must be formalized for container orchestrators. |

---

## 5. Summary of Baseline Operational Risks

1. **Build Tool Portability:** The backend repository relies on a system-wide Maven binary (`mvn`). A committed Maven Wrapper (`mvnw` / `mvnw.cmd`) is absent, introducing build inconsistency across developer workstations.
2. **Database Schema Evolution:** Database initialization relies on `spring.sql.init.mode=always` executing a monolithic `schema.sql`. The versioned migration files in `db/migration/` (V1 through V5) are not tracked by an automated migration tool (Flyway or Liquibase).
3. **Containerization Gap:** Neither frontend nor backend possesses a Dockerfile, preventing standardized deployment across target server environments.
4. **CI/CD Pipeline Absence:** Code verification, static analysis, dependency vulnerability scans, and regression testing currently require manual execution.
