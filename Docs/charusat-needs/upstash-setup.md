# Charusat Needs — Upstash Redis Cloud Setup & Cache Architecture

---

## 1. Overview & Free-Tier Limits

Upstash Redis provides a serverless Redis data store accessible via standard Redis RESP over TLS (`rediss://`) as well as REST APIs. In Charusat Needs, Redis serves strictly as an ephemeral cache and rate-limiting store — never as an authoritative source of truth.

### Zero-Cost Constraints:
* **Cost:** $0.00 / month (Free Tier).
* **Credit Card Requirement:** None.
* **Command Allowance:** 10,000 commands / day.
* **Storage Limit:** 256 MB data storage.
* **Maximum Concurrent Connections:** 1,000 connections.
* **Bandwidth Allowance:** 200 MB / day.
* **Transport Encryption:** TLS enforced (`rediss://` protocol).

---

## 2. Step-by-Step Provisioning Runbook

1. **Sign Up / Login:**
   - Navigate to `https://console.upstash.com/`.
   - Sign in using GitHub or Google authentication.
2. **Create Database:**
   - Click **Create Database**.
   - Database Name: `charusatneeds-cache`
   - Type: `Redis`
   - Region: `ap-southeast-1` (Singapore) or nearest matching region to Render and Neon.
   - Primary Region: Match backend hosting region for sub-10ms cache latency.
   - TLS: Enabled (Mandatory).
   - Eviction: Enabled (Volatile-LRU).
3. **Retrieve Credentials:**
   - Under the **Details** tab, locate **Connect your database**.
   - Select **Java / Spring Boot** or standard **Redis**.
   - Copy the following fields:
     - `Endpoint (Host)`: e.g., `promoted-civet-12345.upstash.io`
     - `Port`: `6379`
     - `Password / Token`: e.g., `AXXXXX...`
     - Full URL: `rediss://default:[password]@[endpoint]:6379`

---

## 3. Cache Namespaces & Invalidation Strategy

| Key Pattern | Cached Content | TTL | Invalidation Trigger |
|---|---|---|---|
| `canteens:all` | JSON list of all active campus canteens | 3600s (1h) | Vendor/Admin updates canteen status |
| `canteen:{id}` | Detailed canteen entity and operational hours | 3600s (1h) | Vendor updates canteen profile |
| `menu:{canteenId}` | Full catalogue of items, prices, availability | 1800s (30m) | Vendor toggles availability or edits item price |
| `offers:{canteenId}` | Active promotional discount coupons | 900s (15m) | Vendor/Admin adds or deactivates coupon |

---

## 4. Fail-Open Degradation Architecture

The application implements a resilient fail-open policy via `RedisCacheService.java`:

```text
                  INBOUND GET REQUEST (e.g. /menu/1)
                                │
                                ▼
                       Check Redis Cache
                                │
                 ┌──────────────┴──────────────┐
                 ▼ (Cache Hit)                 ▼ (Cache Miss / Redis Error)
            Return Cached                   Query PostgreSQL
              JSON Data                            │
                                            ┌──────┴──────┐
                                            ▼             ▼
                                       Return Data   Write to Redis
                                       to Client     (Background Async)
```

### Safety Guarantees:
1. **Network Timeout:** Redis socket timeout is capped at 1000ms. If Upstash takes longer than 1 second to respond, the call fails open to PostgreSQL.
2. **Quota Exceeded:** If the daily 10,000 command limit is reached, Upstash rejects commands with an error. The backend catches the exception, logs a single warning, and bypasses the cache entirely.
3. **Zero Financial Risk:** Redis failure never blocks checkout, payments, or order processing.
