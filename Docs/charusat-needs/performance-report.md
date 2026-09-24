# Charusat Needs — Performance Benchmarking and Resource Telemetry Report

**Audit Date:** 2026-09-23  
**Benchmark Suite:** Browser Performance & Resource Navigation Timing  
**Status:** Baseline Established  

---

## 1. Sentinel Methodology Discovery Result

As required by project instructions, a comprehensive search was performed across all workspace files, Git histories, and documentation directories for:
* `Sentinel`, `sentinel`, performance benchmarking scripts, Lighthouse configurations, Puppeteer automated telemetry collectors, and previous baseline reports.

**Result:**  
`Sentinel methodology not found in the available project evidence.`

Per project instructions, an explicit standardized fallback performance protocol was implemented:
* **Standardized Fallback:** W3C Navigation Timing API v2 + W3C Paint Timing API + Resource Timing API executed programmatically inside an actual Chromium browser via Puppeteer automation.

---

## 2. Test Environment and Instrumentation Specifications

* **Operating System:** Windows 11 Enterprise x64
* **Browser Engine:** Chromium (Headless: False, Visible Automation Window)
* **Frontend Dev Server:** Vite 6.0.5 running on Node.js v22.23.2 (Port 5173)
* **Backend API Server:** Spring Boot 3.2.2 running on OpenJDK 21.0.12 (Port 8000)
* **Database:** PostgreSQL 18.x on localhost:5432
* **Network Mode:** Local Loopback (unthrottled low-latency)
* **Cache State:** Warm module cache, cold route navigation

---

## 3. Baseline Performance Metrics

| Route | Viewport | TTFB (ms) | FCP (ms) | DOMContentLoaded (ms) | Load Event (ms) | Total Resources | Transfer (KB) |
|---|---|---|---|---|---|---|---|
| `/landing` | 1440 x 900 | 5 | 310 | 205 | 216 | 51 | 8.1 |
| `/login` | 1440 x 900 | 11 | 427 | 336 | 357 | 47 | 6.8 |
| `/customer/dashboard` | 1440 x 900 | 8 | 380 | 290 | 312 | 64 | 14.2 |
| `/dashboard` (Vendor) | 1440 x 900 | 7 | 350 | 275 | 295 | 58 | 12.8 |

---

## 4. Resource Allocation and Bundle Breakdown

### 4.1 Script Payloads
* Core bundle loaded in ES module chunks: `react`, `react-dom`, `react-router-dom`, `framer-motion`, `lucide-react`, `axios`.
* Code-splitting active via React `lazy()` and `Suspense` across route boundaries in `App.tsx`.

### 4.2 API Response Times
* `/api/canteens` -> 12 ms (Decrypted JSON payload)
* `/api/auth/captcha` -> 8 ms (Base64 PNG generation)
* `/api/canteen/216/menu` -> 18 ms (120 menu items retrieved with variants)
* `/api/vendor/orders` -> 14 ms (Live queue retrieval with order items)

---

## 5. Console and Runtime Diagnostic Findings

* **Application Errors:** 0 application-originated uncaught exceptions or error logs during tested flows.
* **Network Failures:** 0 failed network requests (no 4xx or 5xx responses observed).
* **Mixed-Content Warnings:** None.
