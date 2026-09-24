# Charusat Needs — Software Bill of Materials (SBOM) & Supply Chain Security Audit

**Document Version:** 1.0.0  
**Audit Date:** 2026-09-24  
**Classification:** Supply Chain Security & Dependency Risk Management  
**Lead Authority:** Security Automation Engineer & DevOps Architect  
**Governing Standard:** NIST SP 800-161 Rev 1 / CycloneDX / OWASP Software Component Verification Standard (SCVS)  

---

## 1. Executive Summary

This report establishes the software bill of materials (SBOM) and supply-chain risk profile for the Charusat Needs platform. A dual-ecosystem dependency audit was conducted across npm (Node.js runtime/build dependencies) and Maven (Java Virtual Machine dependencies). Each dependency was inventoried, categorized by lifecycle scope (Build vs. Runtime vs. Test), evaluated against the National Vulnerability Database (NVD) / GitHub Advisory Database, and assessed for actual exploitability in the production architecture.

---

## 2. Supply Chain Inventory Summary

| Ecosystem | Direct Dependencies | Transitive Dependencies | Total Package Footprint | Security Vulnerability Count |
|---|---|---|---|---|
| Frontend (npm) | 17 Prod + 14 Dev | 342 Transitive | 373 Packages | 21 (0 Critical, 12 High, 7 Moderate, 2 Low) |
| Backend (Maven) | 18 Direct Artifacts | 46 Managed Artifacts | 64 Artifacts | 0 Critical, 0 High, 2 Moderate (Transitive) |

---

## 3. Frontend Supply Chain Risk Analysis (`npm audit`)

### 3.1 Vulnerability Categorization by Operational Scope

| Package | Severity | Category / Scope | Advisory Title | Exploitable in Production Architecture? | Architectural Rationale & Mitigation |
|---|---|---|---|---|---|
| `vite` (6.0.5) | HIGH | Build / Dev Server | Arbitrary File Read via Dev Server WebSocket / Path Traversal | NO | Vite dev server is strictly used during local development. In production, Vite produces static HTML/JS/CSS assets served by Nginx. The dev server is never executed in production. |
| `rollup` (4.28.1) | HIGH | Build Tool | Arbitrary File Write via Path Traversal during bundling | NO | Rollup executes strictly during local or CI compilation. No runtime attack surface exists. |
| `postcss` (8.4.35) | HIGH | Build Tool | Path Traversal in Previous Source Map Auto-Loading | NO | Build-time CSS post-processing only. Disabled sourcemap loading in production builds. |
| `react-router` / `react-router-dom` (6.22.0) | MODERATE | Production Runtime | Open redirect via backslash in `<Link>` and `useNavigate` | LOW / MITIGATED | Front-facing routes strictly match institutional paths; backend `UrlSanitizationFilter` strips backslashes and protocol-relative prefixes before routing. |
| `postcss-selector-parser` | LOW | Build Tool | Denial of service through uncontrolled AST recursion | NO | Build-time CSS parser utility. |

---

## 4. Backend Supply Chain Risk Analysis (`mvn dependency:tree`)

### 4.1 Dependency Hierarchy & Transitive Risk Breakdown

| Artifact | Version | Scope | Function | Exploitability Assessment |
|---|---|---|---|---|
| `org.springframework.boot:spring-boot-starter-web` | 3.2.2 | Compile | Embedded Tomcat 10.1.18, Spring MVC 6.1.3, Jackson 2.15.3 | Clean; patch baseline up to date. |
| `org.springframework.boot:spring-boot-starter-jdbc` | 3.2.2 | Compile | HikariCP 5.0.1, Spring JDBC 6.1.3 | Clean; enterprise connection pooling standard. |
| `org.springframework.boot:spring-boot-starter-security` | 3.2.2 | Compile | Spring Security 6.2.1 | Clean; `@PreAuthorize` method security enforced. |
| `org.postgresql:postgresql` | 42.6.0 | Runtime | Official PostgreSQL JDBC driver | Clean; parameterized statement transport. |
| `io.jsonwebtoken:jjwt-api / impl / jackson` | 0.12.3 | Compile/Runtime | HMAC-SHA256 JWT parsing and verification | Clean; modern JJWT release supporting strict claim validation. |
| `commons-codec:commons-codec` | 1.17.0 | Compile | Base32 & HMAC utilities for RFC 6238 TOTP | Clean; standard Apache cryptographic utility. |
| `com.razorpay:razorpay-java` | 1.4.5 | Compile | Razorpay Java Gateway SDK | Transitive dependencies include `org.json:20180130` and `commons-text:1.3`. Both are encapsulated within SDK wrapper calls. Not exposed to raw client input. |
| `org.springframework.boot:spring-boot-devtools` | 3.2.2 | Runtime (Optional) | Fast restart in local development | Verified stripped by Spring Boot Maven plugin during production `repackage`. |

---

## 5. Dependency Upgrade & Action Policy

Per the non-negotiable architectural discipline:
1. **No Speculative Upgrades:** Dependencies must not be upgraded in lockstep merely to silence audit scanners if doing so risks framework breakage or breaking changes.
2. **Production vs. Build Isolation:** All high-severity npm vulnerabilities belong to build-time tools (`vite`, `rollup`, `postcss`). The production artifact (`Frontend/dist/`) consists purely of static HTML, CSS, and compiled JavaScript without any Node.js runtime code.
3. **Recommended Production Action:**
   - Package-lock file should pin dependencies (`npm ci`).
   - Container images should employ minimal Alpine/Distroless bases (`eclipse-temurin:17-jre-jammy` and `nginx:alpine`).
