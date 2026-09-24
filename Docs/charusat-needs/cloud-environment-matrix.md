# Charusat Needs — Cloud Environment Variable Matrix

---

## 1. Environment Variable Architecture

The Charusat Needs configuration hierarchy enforces strict separation between environments:
* **Local (Docker Desktop):** Self-contained, offline-compatible development services.
* **Test / Staging:** Cloud infrastructure connected to test merchant keys and sandbox accounts.
* **Production:** Authoritative cloud deployment on Vercel, Render, Neon, and Upstash.

---

## 2. Comprehensive Configuration Matrix

| Variable Name | Required By | Secret? | Local Value | Production Value | Purpose / Description |
|---|---|---|---|---|---|
| **SPRING_PROFILES_ACTIVE** | Backend | No | `docker` | `prod` | Activates Spring configuration profile. |
| **PORT** | Backend | No | `8000` | `${PORT}` (Managed by Render) | Container HTTP listening port. |
| **SPRING_DATASOURCE_URL** | Backend | Yes | `jdbc:postgresql://postgres:5432/charusatneeds` | `jdbc:postgresql://<neon-host>/charusatneeds?sslmode=require` | PostgreSQL JDBC connection URL. |
| **SPRING_DATASOURCE_USERNAME** | Backend | Yes | `postgres` | `<neon-db-user>` | PostgreSQL database authentication username. |
| **SPRING_DATASOURCE_PASSWORD** | Backend | Yes | `postgres` | `<neon-db-password>` | PostgreSQL database authentication password. |
| **DB_POOL_MAX** | Backend | No | `5` | `10` | Maximum HikariCP connection pool size. |
| **REDIS_ENABLED** | Backend | No | `true` | `true` | Toggles Redis caching subsystem. |
| **REDIS_HOST** | Backend | No | `redis` | `<upstash-endpoint-host>` | Redis host FQDN. |
| **REDIS_PORT** | Backend | No | `6379` | `6379` (or custom TLS port) | Redis server port. |
| **REDIS_PASSWORD** | Backend | Yes | `""` | `<upstash-token-password>` | Redis authentication token/password. |
| **REDIS_SSL** | Backend | No | `false` | `true` | Enables rediss:// TLS transport. |
| **JWT_SECRET** | Backend | Yes | `<dev-fallback-in-application.properties>` | `<256-bit-base64-secret>` | HMAC-SHA256 signature key for JWT tokens. |
| **JWT_EXPIRATION_MS** | Backend | No | `86400000` | `86400000` (24 Hours) | JWT session token validity duration. |
| **FIELD_ENCRYPTION_KEY** | Backend | Yes | `<dev-fallback-in-application.properties>` | `<32-char-random-key>` | AES-256 key for database sensitive fields. |
| **PAYLOAD_ENCRYPTION_KEY** | Backend | Yes | `<dev-fallback-in-application.properties>` | `<32-char-random-key>` | AES-256-GCM key for in-flight request decryption. |
| **BREVO_API_KEY** | Backend | Yes | `""` | `xkeysib-...` | Brevo REST API v3 key for HTTPS email delivery. |
| **BREVO_SENDER_EMAIL** | Backend | No | `canteen-alerts@charusat.edu.in` | `verified-sender@domain.edu.in` | Verified Brevo sender email address. |
| **BREVO_SENDER_NAME** | Backend | No | `Charusat Needs Support` | `Charusat Needs` | Sender display name in email clients. |
| **GOOGLE_CLIENT_ID** | Backend & Frontend | No | `""` | `<client-id>.apps.googleusercontent.com` | Google Cloud OAuth 2.0 Web Client ID. |
| **GOOGLE_CLIENT_SECRET** | Backend | Yes | `""` | `<google-client-secret>` | Google Cloud OAuth 2.0 Client Secret (Server only). |
| **GOOGLE_REDIRECT_URI** | Backend | No | `http://localhost:5173/auth/callback` | `https://<vercel-app>.vercel.app/auth/callback` | Authorized OAuth 2.0 redirect callback endpoint. |
| **RAZORPAY_KEY_ID** | Backend | No | `rzp_test_<TEST_KEY_ID>` | `rzp_test_<TEST_KEY_ID>` | Razorpay Merchant Key ID (Test Mode). |
| **RAZORPAY_KEY_SECRET** | Backend | Yes | `<REDACTED - ROTATE IMMEDIATELY>` | `<RAZORPAY_KEY_SECRET>` | Razorpay Merchant Secret (Test Mode). ROTATE via Razorpay Test Dashboard. |
| **RAZORPAY_WEBHOOK_SECRET** | Backend | Yes | `<REDACTED - ROTATE IMMEDIATELY>` | `<RAZORPAY_WEBHOOK_SECRET>` | Signature verification key for payment webhooks. ROTATE via Razorpay Test Dashboard. |
| **IMAGEKIT_PUBLIC_KEY** | Backend & Frontend | No | `""` | `public_...` | ImageKit public API client key. |
| **IMAGEKIT_PRIVATE_KEY** | Backend | Yes | `""` | `private_...` | ImageKit server upload authentication key. |
| **IMAGEKIT_URL_ENDPOINT** | Backend & Frontend | No | `""` | `https://ik.imagekit.io/<id>/` | ImageKit CDN transformation endpoint URL. |
| **B2_ENDPOINT** | Backend | No | `http://minio:9000` | `s3.<region>.backblazeb2.com` | S3-compatible object storage endpoint. |
| **B2_BUCKET** | Backend | No | `charusatneeds-media` | `charusatneeds-media-prod` | Bucket name for persistent object storage. |
| **B2_KEY_ID** | Backend | Yes | `<redacted>` | `<backblaze-key-id>` | S3 Access Key ID / Backblaze Key ID. |
| **B2_APPLICATION_KEY** | Backend | Yes | `<redacted>` | `<backblaze-app-key>` | S3 Secret Key / Backblaze Application Key. |
| **CORS_ALLOWED_ORIGINS** | Backend | No | `http://localhost:5173,http://localhost:80` | `https://<vercel-app>.vercel.app` | Comma-separated list of authorized HTTP origins. |
| **VITE_API_URL** | Frontend | No | `http://localhost:8000` | `https://<render-service>.onrender.com` | Backend REST API endpoint for frontend fetch client. |
| **VITE_WS_URL** | Frontend | No | `ws://localhost:8000/ws/websocket` | `wss://<render-service>.onrender.com/ws/websocket` | STOMP WebSocket connection URL. |
| **VITE_GOOGLE_CLIENT_ID** | Frontend | No | `""` | `<client-id>.apps.googleusercontent.com` | Public Google OAuth client identifier for frontend SDK. |

---

## 3. Strict Boundary Rules

1. **No Backend Secrets in Frontend:** Variables starting with `VITE_` are bundled into the public client JavaScript artifact. Never prefix `JWT_SECRET`, `GOOGLE_CLIENT_SECRET`, `BREVO_API_KEY`, `RAZORPAY_KEY_SECRET`, or `SPRING_DATASOURCE_PASSWORD` with `VITE_`.
2. **No Localhost in Cloud:** The production backend configuration must reject any CORS origin containing `localhost`.
3. **SSL Mode Enforcement:** All cloud database URLs must append `?sslmode=require` to prevent unencrypted transit over public networks.
