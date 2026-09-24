# Charusat Needs — Disaster Recovery Runbook & Failure Mitigation

---

## 1. Disaster Recovery Matrix

| Outage Scenario | Severity | Impact on User Experience | Automatic Mitigation | Manual Recovery Procedure |
|---|---|---|---|---|
| **Backend Failure / Render Down** | Critical | API calls return 502/503. Students cannot place orders. | Render auto-restarts failed container up to 3 times. | Check Render deployment logs. If JVM OOM, verify `JAVA_OPTS` RAM limit. Rollback to prior immutable Git SHA. |
| **Neon DB Outage / Credential Failure** | Critical | Database queries fail; `/api/public/health` reports DOWN. | HikariCP reconnects with exponential backoff. | Check Neon status page. Verify `SPRING_DATASOURCE_URL` in Render. Restore latest SQL dump to a fresh Neon project branch. |
| **Upstash Redis Outage** | Low | None. Order creation, checkout, and menus remain 100% functional. | `RedisCacheService` fails open immediately to PostgreSQL. | Verify Upstash console. Check daily command quota. No manual action needed to keep application operational. |
| **Brevo Email Outage** | Low | Students and vendors do not receive transactional emails. | `EmailService.java` catches API errors and logs failure. DB transaction completes safely. | Review Brevo dashboard for quota exhaustion. Transactions are preserved in DB; email receipts can be resent post-recovery. |
| **ImageKit Outage** | Minor | Food images fail to render. | Frontend `onError` renders local SVG fallback graphics. | Check ImageKit bandwidth quota. If exhausted, switch `IMAGEKIT_URL_ENDPOINT` to direct Backblaze B2 public CDN. |
| **WebSocket / STOMP Disconnect** | Minor | Real-time live order status notifications pause. | STOMP client in `useWebSocket.ts` attempts automatic reconnection every 5 seconds. | Vendor dashboard supports manual refresh button to fetch fresh orders directly via REST API. |
| **Frontend Deployment Failure** | High | Broken assets or client runtime exceptions. | Previous production deployment remains active on Vercel until new build passes. | In Vercel dashboard, click **Deployments** → Select previous working deployment → Click **Instant Rollback**. |

---

## 2. Failure Simulation & Drill Procedures

### 2.1 Redis Outage Drill
1. Temporarily change `REDIS_PASSWORD` in backend environment to an invalid string or set `REDIS_HOST=invalid.host`.
2. Issue HTTP GET to `/api/public/canteens` and `/api/public/canteens/1/menu`.
3. Verify response status is HTTP 200 OK.
4. Verify backend logs show a non-fatal warning: `WARN ... Redis cache error. Failing open to PostgreSQL.`

### 2.2 Cold Start Resilience Drill
1. Allow Render container to spin down after 15 minutes of inactivity.
2. Place a scheduled order with release time in the near future.
3. Simulate container wake-up by navigating to `https://[frontend].vercel.app/`.
4. Confirm `OrderReleaseScheduler.java` triggers on `ApplicationReadyEvent` and releases the overdue scheduled order to the vendor dashboard.

---

## 3. Communication Protocol

In the event of an unscheduled campus-wide outage:
1. UptimeRobot notifies the administrator via email within 5 minutes.
2. If outage exceeds 15 minutes, update the public status page banner to: `Charusat Needs is undergoing emergency maintenance. Orders will resume shortly.`
