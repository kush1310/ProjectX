# Charusat Needs — Brevo Email Delivery Setup & Configuration

---

## 1. Overview & Free-Tier Specifications

Brevo (formerly Sendinblue) delivers transactional notifications for Charusat Needs, including user registration confirmation, password reset tokens, order receipts, scheduled-order release alerts, and vendor order cancellations.

### Zero-Cost Constraints:
* **Cost:** $0.00 / month (Free Tier).
* **Credit Card Requirement:** None.
* **Daily Sending Volume:** 300 emails / day.
* **API Delivery:** HTTPS REST API (`POST https://api.brevo.com/v3/smtp/email`).

---

## 2. Critical Architecture Requirement: HTTPS REST API vs SMTP

### Render Outbound SMTP Blocking:
* Render Free web services strictly block all outbound traffic on standard SMTP ports: `25`, `465`, and `587`.
* Any application relying on JavaMail / Spring Mail via SMTP will encounter `SocketTimeoutException` or `ConnectionRefusedException` when deployed on Render.
* **Mitigation:** Charusat Needs' `EmailService.java` is implemented to communicate directly over HTTPS port 443 with Brevo's REST API endpoint:
  ```text
  POST https://api.brevo.com/v3/smtp/email
  Headers:
    api-key: [BREVO_API_KEY]
    Content-Type: application/json
  ```
* HTTPS port 443 is completely open on Render, guaranteeing 100% reliable email delivery without port restriction issues.

---

## 3. Step-by-Step Provisioning Runbook

1. **Sign Up / Login:**
   - Navigate to `https://www.brevo.com/`.
   - Sign in to your account.
2. **Sender Email Verification:**
   - Navigate to **Senders & IP** → **Senders**.
   - Click **Add a Sender**.
   - Sender Name: `Charusat Needs Support`
   - Sender Email: `canteen-alerts@charusat.edu.in` (or your verified administrator email).
   - Check your inbox and click the verification link sent by Brevo.
3. **Generate API Key:**
   - Click on your account profile dropdown → **SMTP & API**.
   - Navigate to the **API Keys** tab.
   - Click **Generate a new API key**.
   - Name: `CharusatNeeds-Render-Prod`
   - Copy the API key string: `xkeysib-...`
4. **Configure Backend Environment Variables:**
   ```env
   BREVO_API_KEY=xkeysib-...
   BREVO_SENDER_EMAIL=[verified-sender@domain.com]
   BREVO_SENDER_NAME=Charusat Needs
   ```

---

## 4. Failure Isolation & Non-Blocking Design

* All email operations in `EmailService.java` are asynchronous and isolated within try-catch blocks.
* If Brevo's daily 300-email quota is reached or network connectivity experiences a momentary glitch:
  1. An error is logged in the backend structured logs.
  2. The primary database transaction (e.g., student checkout, payment verification, order status change) completes successfully.
  3. The customer's order is never canceled or corrupted due to an email notification delivery failure.
