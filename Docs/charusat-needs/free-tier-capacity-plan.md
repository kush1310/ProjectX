# Charusat Needs — Free-Tier Capacity Plan & Zero-Cost Guardrails

---

## 1. Zero-Cost Policy Enforcement

The Charusat Needs deployment is designed to operate continuously under a strict $0.00/month infrastructure cost boundary without requiring credit cards or triggering automated pay-as-you-go billing.

---

## 2. Comprehensive Capacity Matrix

| Provider / Tier | Metric | Free Tier Quota | Campus Sizing / Expected Daily Consumption | Headroom / Safety Margin | Guardrail & Degradation Behavior |
|---|---|---|---|---|---|
| **Neon PostgreSQL** | Storage | 500 MB | ~15 MB for 7 canteens, 630 items, and 10,000 orders | 97% Free Headroom | Media bytes prohibited in database. Automated pruning of logs after 90 days. |
| **Neon PostgreSQL** | Compute | ~100 active CPU hours/mo | ~30 active hours (scale-to-zero when backend idle) | 70% Free Headroom | Auto-suspends compute when connection pool idle for 5 minutes. |
| **Upstash Redis** | Commands | 10,000 commands / day | ~2,500 commands / day (TTL 15m-1h reduces writes) | 75% Free Headroom | Fail-open: If 10k reached, queries bypass cache directly to PostgreSQL. Zero crash risk. |
| **Upstash Redis** | Storage | 256 MB | ~4 MB (compact JSON menu arrays) | 98% Free Headroom | Volatile-LRU eviction automatically drops least-recently-used cache keys. |
| **Render Web Service**| Instance Hours | 750 free hours / mo | ~720 hours / mo (1 service running) | Sufficient for 1 full month | 15-minute idle spin-down saves hours during campus night hours (10 PM - 7 AM). |
| **Render Web Service**| Memory | 512 MB RAM | ~380 MB active JVM heap & non-heap | 25% Headroom | JVM tuned: `-XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError`. |
| **Vercel** | Bandwidth | 100 GB / month | ~3-5 GB / month for compressed SPA bundles | 95% Free Headroom | Brotli compression + 1-year immutable edge caching on `/assets/*`. |
| **Brevo Email API** | Emails Sent | 300 emails / day | ~50-80 transactional emails / day | 73% Free Headroom | Non-blocking try-catch: Email failure never rolls back order transactions. |
| **ImageKit** | Bandwidth | 20 GB / month | ~4-6 GB / month | 70% Free Headroom | WebP/AVIF dynamic optimization reduces image transfer by 70%. |
| **ImageKit** | Storage | 20 GB media | ~200 MB (630 optimized item photos) | 99% Free Headroom | High-resolution master assets compressed on ingestion. |
| **Backblaze B2** | Storage | 10 GB free | ~500 MB (database logical exports & archives) | 95% Free Headroom | Older SQL backups rotated weekly. |
| **UptimeRobot** | Monitors | 50 monitors | 3 monitors configured | 94% Free Headroom | 5-minute check interval avoids flooding Render cold starts. |
| **Grafana Cloud** | Metrics Series | 10,000 active series | ~800 active series from Spring Boot Actuator | 92% Free Headroom | Micrometer filtered to drop high-cardinality ephemeral tags. |
| **Grafana Cloud** | Log Ingestion | 50 GB / month | ~1.5 GB / month structured logs | 97% Free Headroom | Log level set to `INFO`; debug logging suppressed in production. |

---

## 3. Emergency Cost Guardrails

If any provider interface prompts to enter a credit card, upgrade to a paid tier, or activate paid overages:

```text
==================================================
STOP
DO NOT ENTER PAYMENT CREDENTIALS
DO NOT ACTIVATE PAID UPGRADE
MARK AS BLOCKED IN HUMAN-ACTION-REQUIRED.MD
ACTIVATE GRACEFUL DEGRADATION
==================================================
```

### Graceful Degradation Pathways:
1. **If Upstash Redis expires:** Spring Boot operates purely on PostgreSQL without degradation in business logic.
2. **If Brevo email limit reached:** Orders continue seamlessly; transaction receipts are visible in the student order history dashboard.
3. **If ImageKit bandwidth exhausted:** Frontend falls back to lightweight inline SVG food illustrations.
