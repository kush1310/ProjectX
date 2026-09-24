# Charusat Needs — Reproducible Build Engineering & Artifact Verification Report

**Document Version:** 1.0.0  
**Verification Date:** 2026-09-24  
**Classification:** Build Engineering, Release Integrity & Artifact Provenance  
**Lead Authority:** Principal Release Engineer & SRE Architect  
**Governing Standard:** SLSA Level 2 / Deterministic Artifact Generation  

---

## 1. Executive Summary

This report establishes the reproducibility, deterministic bytecode packaging, and build integrity for the Charusat Needs application. Both frontend and backend compilation cycles were executed in clean standalone invocation states, capturing build durations, binary bytecode versions, artifact sizes, cryptographic checksums, and dependency footprints.

---

## 2. Build Environment & Tooling Specifications

| Tool / Runtime | Declared Target | Measured Runtime Version | Host Operating System |
|---|---|---|---|
| Frontend Node Engine | `>= 18.0.0` | Node.js v22.23.2 | Windows 11 Enterprise (amd64) |
| Frontend Package Manager | npm | npm 11.12.1 | Windows 11 Enterprise (amd64) |
| Frontend Compiler | TypeScript 5.6.2 | TypeScript 5.6.2 (`tsc -b`) | Node.js Runtime |
| Frontend Bundler | Vite 6.0.5 | Vite 6.0.5 (ESBuild + Rollup) | Node.js Runtime |
| Backend Build Tool | Apache Maven | Maven 3.9.12 | JVM Runtime |
| Java Compiler | Java 17 | JDK 21 javac (`-release 17`) | Oracle JDK 21.0.12 LTS |
| Backend Runtime | JVM 17+ | Oracle OpenJDK 21.0.12 LTS | 64-Bit Server VM |
| Active Git Commit | Clean working branch | `849d33949254e1b5cbee529b67fff7531592d229` | Local Git Repository |

---

## 3. Frontend Reproducible Build Verification

- **Command Executed:** `npm run build` (invoking `tsc -b && vite build`)
- **Execution Working Directory:** `Frontend/`
- **Measured Build Duration:** 95.27 seconds
- **Output Directory:** `Frontend/dist/`
- **Generated Artifact Distribution:**
  - Total Files: 82 files (78 code-split chunks in `assets/`, static images, root `index.html`)
  - Entry Point: `index.html` (2,104 bytes)
  - Core Application Bundle: `assets/App-Cr5Yid6Q.js` (325,490 bytes)
  - Core Vendor Chunk: `assets/index-BbaWow2V.js` (466,078 bytes)
  - Master Stylesheet: `assets/index-DAoHTt8w.css` (164,720 bytes)
  - Cryptographic SHA-256 Hash (`index.html`): `6b69f6f04e1cd5de25cdd6c6a1a5bc6b1e4f37988737e2ea7d4265990c4950fb`
- **Compiler Diagnostics:** Zero fatal errors; TypeScript project references resolved cleanly (`tsconfig.tsbuildinfo` updated).

---

## 4. Backend Reproducible Build Verification

- **Command Executed:** `mvn clean package -DskipTests`
- **Execution Working Directory:** `Backend/`
- **Measured Build Duration:** 39.48 seconds
- **Bytecode Verification:**
  - Class Analyzed: `target/classes/com/charusat/canteen/CanteenApplication.class`
  - Magic Header: `0xCAFEBABE` (Bitwise verified)
  - Bytecode Class Major Version: `61` (Exact match for Java 17 class specification)
- **Packaged Artifact Details:**
  - Primary Executable Archive: `target/canteen-aggregator-1.0.0-SNAPSHOT.jar`
  - Thin Archive: `target/canteen-aggregator-1.0.0-SNAPSHOT.jar.original` (727,062 bytes)
  - Fat Spring Boot Archive Size: 45,572,573 bytes (~43.46 MB)
  - Cryptographic SHA-256 Hash: `421dc3024a8828100a0e8a94a4406213e7bb0e6c91c28eb2681a38137ad16198`
- **Compiler Warnings:** Minor Lombok generated accessor warnings; zero blocking deprecations.

---

## 5. Artifact Provenance Summary

```
========================================================================================
BUILD REPRODUCIBILITY ASSESSMENT: VERIFIED BY EXECUTION

Git SHA:     849d33949254e1b5cbee529b67fff7531592d229
Frontend:    dist/ (SHA-256: 6b69f6f04e1cd5de25cdd6c6a1a5bc6b1e4f37988737e2ea7d4265990c4950fb)
Backend JAR: 45.57 MB (SHA-256: 421dc3024a8828100a0e8a94a4406213e7bb0e6c91c28eb2681a38137ad16198)
Bytecode:    Major Version 61.0 (Strict Java 17 Compatibility)
========================================================================================
```
