# Charusat Needs — Availability Monitoring Setup (UptimeRobot)

---

## 1. Overview & Free-Tier Specifications

UptimeRobot monitors the public availability of the Charusat Needs platform, tracking uptime, HTTP response codes, SSL certificate validity, and outage alerts.

### Zero-Cost Constraints:
* **Cost:** $0.00 / month (Free Plan).
* **Credit Card Requirement:** None.
* **Monitor Allowance:** Up to 50 HTTP(s) monitors.
* **Check Frequency:** 5-minute intervals.
* **Alert Channels:** Email alerts (SMS/voice excluded on free tier).

---

## 2. Step-by-Step Monitor Configuration

1. **Sign Up / Login:**
   - Navigate to `https://uptimerobot.com/`.
   - Register or log in to the dashboard.
2. **Monitor 1: Frontend Homepage Availability**
   - Click **Add New Monitor**.
   - Monitor Type: `HTTP(s)`
   - Friendly Name: `Charusat Needs — Frontend Edge`
   - URL (or IP): `https://[your-project].vercel.app/`
   - Monitoring Interval: `5 minutes`
   - Monitor Timeout: `30 seconds`
   - Alert Contacts To Notify: Check administrator email.
3. **Monitor 2: Backend Liveness (`/healthz`)**
   - Click **Add New Monitor**.
   - Monitor Type: `HTTP(s)`
   - Friendly Name: `Charusat Needs — Backend Liveness`
   - URL: `https://[your-backend-service].onrender.com/healthz`
   - Monitoring Interval: `5 minutes`
   - Monitor Timeout: `45 seconds` (accommodates cold starts)
   - Alert Contacts To Notify: Check administrator email.
4. **Monitor 3: Public API Readiness (`/api/public/health`)**
   - Click **Add New Monitor**.
   - Monitor Type: `HTTP(s)`
   - Friendly Name: `Charusat Needs — API & DB Readiness`
   - URL: `https://[your-backend-service].onrender.com/api/public/health`
   - Monitoring Interval: `5 minutes`
   - Alert Contacts To Notify: Check administrator email.

---

## 3. Public Status Page Configuration (Optional)

1. In the UptimeRobot sidebar, navigate to **Status Pages**.
2. Click **Add Status Page**.
3. Name: `Charusat Needs System Status`
4. Select all 3 monitors configured above.
5. UptimeRobot generates a public status link (e.g., `https://stats.uptimerobot.com/[id]`) suitable for sharing with university stakeholders.
