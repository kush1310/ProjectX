# Charusat Needs - Multi-Tier Cloud Environment Variable Matrix

**Document Version:** 2.0.0  
**Audit Date:** 2026-09-24  
**Target Environments:** Local Development → Test / Sandbox Cloud → Authoritative Production  

---

## 1. Architectural Environment Segregation

The Charusat Needs application enforces strict operational boundaries across three independent runtime environments:

1. **Local Development (Docker Compose & Local Node.js):**
   - Offline-capable containerized stack (PostgreSQL, Redis, MinIO/ImageKit simulator).
   - Unencrypted/local keys for rapid developer debugging.
   - Target hosts: `localhost:5173` (Vite) and `localhost:8000` (Spring Boot).

2. **Test & Staging Cloud:**
   - Cloud databases and caches with staging data isolation.
   - Razorpay Sandbox / Test Mode credentials (`rzp_test_...`).
   - Brevo sandbox test sender.
   - Verification of cloud TLS, SSL handshakes, and CORS policies.

3. **Authoritative Production Cloud:**
   - Split hosting topology:
     - **Frontend:** Single Page Application (SPA) deployed to **Vercel**.
     - **Backend:** Hardened non-root Docker container deployed to **Render** (Singapore region).
     - **Authoritative Database:** Neon Serverless PostgreSQL with SSL enforcement (`sslmode=require`).
     - **Distributed Cache:** Upstash Redis with `rediss://` TLS encryption.
     - **Media CDN:** ImageKit Media API + Backblaze B2 S3 storage.
     - **Observability:** In-process OpenTelemetry Java Agent exporting directly to Grafana Cloud OTLP Gateway.

---

## 2. Section I - Local Development Environment (Docker Compose & Local Vite)

| Variable Name | Component | Secret? | Local Default Value | Notes / Behavior |
|---|---|---|---|---|
| **SPRING_PROFILES_ACTIVE** | Backend | No | `docker` | Activates local containerized configurations |
| **PORT** | Backend | No | `8000` | Local port mapped in `docker-compose.yml` |
| **SPRING_DATASOURCE_URL** | Backend | No | `jdbc:postgresql://postgres:5432/charusatneeds` | Local container network database |
| **SPRING_DATASOURCE_USERNAME** | Backend | No | `postgres` | Default local database user |
| **SPRING_DATASOURCE_PASSWORD** | Backend | No | `postgres` | Default local database password |
| **DB_POOL_MAX** | Backend | No | `5` | Lightweight local pool size |
| **REDIS_ENABLED** | Backend | No | `true` | Local Redis container toggle |
| **REDIS_HOST** | Backend | No | `redis` | Local Docker network Redis service name |
| **REDIS_PORT** | Backend | No | `6379` | Standard unencrypted Redis port |
| **REDIS_PASSWORD** | Backend | No | `""` | No password in local Docker network |
| **REDIS_SSL** | Backend | No | `false` | Disabled for local network |
| **JWT_SECRET** | Backend | No | `charusatneedsdevsecretkeyminimum256bitsneededforsecurity` | Fixed development HMAC secret |
| **JWT_EXPIRATION_MS** | Backend | No | `86400000` | 24 hours validity |
| **FIELD_ENCRYPTION_KEY** | Backend | No | `charusatneedsdevfieldkey32bytes` | Local AES-256 field key |
| **PAYLOAD_ENCRYPTION_KEY** | Backend | No | `charusatneedsdevpayloadkey32byt` | Local AES-256-GCM payload key |
| **BREVO_API_KEY** | Backend | No | `""` | Mocked or disabled locally |
| **BREVO_SENDER_EMAIL** | Backend | No | `dev-canteen@charusat.edu.in` | Local sender string |
| **BREVO_SENDER_NAME** | Backend | No | `Charusat Needs Dev` | Local display name |
| **GOOGLE_CLIENT_ID** | Backend & Frontend | No | `""` | Optional in local dev |
| **GOOGLE_CLIENT_SECRET** | Backend | No | `""` | Optional in local dev |
| **GOOGLE_REDIRECT_URI** | Backend | No | `http://localhost:5173/auth/callback` | Local callback URI |
| **RAZORPAY_KEY_ID** | Backend | No | `rzp_test_<TEST_KEY_ID>` | Test merchant ID |
| **RAZORPAY_KEY_SECRET** | Backend | No | `<TEST_SECRET>` | Test merchant secret |
| **RAZORPAY_WEBHOOK_SECRET** | Backend | No | `<TEST_WEBHOOK_SECRET>` | Local test webhook secret |
| **IMAGEKIT_PUBLIC_KEY** | Backend & Frontend | No | `public_+grCFOmI0qDm3NTqiEhsvLFrhgc=` | Shared public key |
| **IMAGEKIT_PRIVATE_KEY** | Backend | No | `<IMAGEKIT_PRIVATE_KEY>` | Dev upload key |
| **IMAGEKIT_URL_ENDPOINT** | Backend & Frontend | No | `https://ik.imagekit.io/cyseckush/` | CDN endpoint |
| **B2_ENDPOINT** | Backend | No | `http://minio:9000` | Local MinIO emulator |
| **B2_BUCKET** | Backend | No | `charusatneeds-media` | Local bucket |
| **B2_KEY_ID** | Backend | No | `minioadmin` | Local S3 access key |
| **B2_APPLICATION_KEY** | Backend | No | `minioadmin` | Local S3 secret key |
| **CORS_ALLOWED_ORIGINS** | Backend | No | `http://localhost:5173,http://localhost:80` | Local development origins |
| **VITE_API_URL** | Frontend | No | `http://localhost:8000/api` | Direct local API target |
| **VITE_WS_URL** | Frontend | No | `ws://localhost:8000/ws/websocket` | Direct local WebSocket target |
| **VITE_GOOGLE_CLIENT_ID** | Frontend | No | `""` | Local SSO identifier |
| **VITE_GOOGLE_REDIRECT_URI** | Frontend | No | `http://localhost:5173/auth/callback` | Local callback route |
| **VITE_IMAGEKIT_URL_ENDPOINT** | Frontend | No | `https://ik.imagekit.io/cyseckush/` | Local CDN fallback |

---

## 3. Section II - Test & Staging Cloud Environment

| Variable Name | Component | Secret? | Staging / Test Value | Notes / Behavior |
|---|---|---|---|---|
| **SPRING_PROFILES_ACTIVE** | Backend | No | `prod` (or `staging`) | Production-like security settings |
| **PORT** | Backend | No | `8000` | Container port |
| **SPRING_DATASOURCE_URL** | Backend | Yes | `jdbc:postgresql://<neon-staging-host>/neondb?sslmode=require` | Staging database branch on Neon |
| **SPRING_DATASOURCE_USERNAME** | Backend | Yes | `<neon-staging-user>` | Isolated test database user |
| **SPRING_DATASOURCE_PASSWORD** | Backend | Yes | `<neon-staging-password>` | Isolated test database password |
| **DB_POOL_MAX** | Backend | No | `10` | Standard connection pool size |
| **REDIS_ENABLED** | Backend | No | `true` | Cache enabled |
| **REDIS_URL** | Backend | Yes | `rediss://default:<token>@<upstash-staging-host>:6379` | Dedicated staging Redis database |
| **JWT_SECRET** | Backend | Yes | `<staging-256bit-secret>` | Staging HMAC token signature key |
| **FIELD_ENCRYPTION_KEY** | Backend | Yes | `<staging-32char-key>` | Staging AES database key |
| **PAYLOAD_ENCRYPTION_KEY** | Backend | Yes | `<staging-32char-key>` | Staging AES payload key |
| **BREVO_API_KEY** | Backend | Yes | `<brevo-test-key>` | Brevo staging key |
| **BREVO_SENDER_EMAIL** | Backend | No | `staging-alerts@charusat.edu.in` | Verified test sender |
| **RAZORPAY_KEY_ID** | Backend | No | `rzp_test_<TEST_KEY_ID>` | Razorpay Test Mode ID |
| **RAZORPAY_KEY_SECRET** | Backend | Yes | `<RAZORPAY_KEY_SECRET>` | Razorpay Test Mode Secret |
| **RAZORPAY_WEBHOOK_SECRET** | Backend | Yes | `<RAZORPAY_WEBHOOK_SECRET>` | Test webhook signature key |
| **IMAGEKIT_PUBLIC_KEY** | Backend | No | `public_+grCFOmI0qDm3NTqiEhsvLFrhgc=` | Public key |
| **IMAGEKIT_PRIVATE_KEY** | Backend | Yes | `<IMAGEKIT_PRIVATE_KEY>` | Private key |
| **IMAGEKIT_URL_ENDPOINT** | Backend | No | `https://ik.imagekit.io/cyseckush/` | CDN endpoint |
| **B2_ENDPOINT** | Backend | No | `s3.us-east-005.backblazeb2.com` | Backblaze B2 test bucket endpoint |
| **B2_BUCKET** | Backend | No | `charusatneeds-media-test` | Staging bucket name |
| **B2_KEY_ID** | Backend | Yes | `<B2_KEY_ID>` | Backblaze access key |
| **B2_APPLICATION_KEY** | Backend | Yes | `<B2_APPLICATION_KEY>` | Backblaze application key |
| **CORS_ALLOWED_ORIGINS** | Backend | No | `https://charusatneeds-staging.vercel.app` | Staging preview origin |
| **FRONTEND_URL** | Backend | No | `https://charusatneeds-staging.vercel.app` | Staging frontend origin |
| **OTEL_SERVICE_NAME** | Backend | No | `charusatneeds-backend-staging` | Staging OTel service identifier |
| **OTEL_RESOURCE_ATTRIBUTES** | Backend | No | `service.name=charusatneeds-backend-staging,deployment.environment=staging` | Staging OTel attributes |
| **VITE_API_URL** | Frontend | No | `https://charusatneeds-backend-staging.onrender.com/api` | Staging backend target |
| **VITE_WS_URL** | Frontend | No | `wss://charusatneeds-backend-staging.onrender.com/ws/websocket` | Staging WebSocket target |
| **VITE_GOOGLE_CLIENT_ID** | Frontend | No | `<client-id>.apps.googleusercontent.com` | Google OAuth staging client |
| **VITE_GOOGLE_REDIRECT_URI** | Frontend | No | `https://charusatneeds-staging.vercel.app/auth/callback` | Staging redirect URI |

---

## 4. Section III - Authoritative Production Cloud Environment

### Part A: FRONTEND -> VERCEL DEPLOYMENT
*All variables are public client tokens statically embedded into the JavaScript bundle at build time.*

| Variable Name | Required | Secret? | Production Value Format | Consuming File & Line | Description / Impact |
|---|---|---|---|---|---|
| **VITE_API_URL** | Required | No | `https://charusatneeds-backend.onrender.com/api` | `Frontend/src/utils/api.ts:5` | Target backend REST API endpoint. Critical for all user actions. |
| **VITE_WS_URL** | Optional (Rec.) | No | `wss://charusatneeds-backend.onrender.com/ws/websocket` | `Frontend/src/hooks/useWebSocket.ts:25` | Explicit STOMP WebSocket URL. Auto-derives if omitted. |
| **VITE_GOOGLE_CLIENT_ID** | Required for SSO | No | `<client-id>.apps.googleusercontent.com` | `Frontend/src/utils/googleAuth.ts:8` | Google OAuth client ID restricted to `@charusat.edu.in`. |
| **VITE_GOOGLE_REDIRECT_URI** | Optional (Rec.) | No | `https://<vercel-domain>.vercel.app/auth/callback` | `Frontend/src/utils/googleAuth.ts:9` | OAuth callback target. Auto-derives origin if omitted. |
| **VITE_IMAGEKIT_URL_ENDPOINT** | Optional | No | `https://ik.imagekit.io/cyseckush/` | `Frontend/src/Canteen/utils/imagekit.ts:28` | ImageKit CDN delivery URL for dynamic menu item rendering. |

---

### Part B: BACKEND -> RENDER DEPLOYMENT
*All server-side runtime variables injected into hardened Docker container (Singapore region).*

| Variable Name | Required | Secret? | Production Value Format | Source File / Injection | Description / Impact |
|---|---|---|---|---|---|
| **SPRING_PROFILES_ACTIVE** | Required | No | `prod` | `render.yaml` | Enforces production profiles and security rules. |
| **PORT** | Required | No | `8000` | `render.yaml` | Container HTTP listener port. |
| **SPRING_DATASOURCE_URL** | Required | Yes | `jdbc:postgresql://<neon-prod-host>/neondb?sslmode=require` | Render Dashboard | Authoritative Neon Cloud PostgreSQL with enforced SSL. |
| **SPRING_DATASOURCE_USERNAME** | Required | Yes | `<neon-db-username>` | Render Dashboard | Neon database user. |
| **SPRING_DATASOURCE_PASSWORD** | Required | Yes | `<neon-db-password>` | Render Dashboard | Neon database password. |
| **DB_POOL_MAX** | Optional | No | `10` | `render.yaml` | HikariCP maximum connection pool size. |
| **DB_POOL_MIN_IDLE** | Optional | No | `2` | `render.yaml` | HikariCP minimum idle connections. |
| **REDIS_ENABLED** | Optional | No | `true` | `render.yaml` | Activates distributed Redis caching. |
| **REDIS_URL** | Required | Yes | `rediss://default:<token>@<upstash-host>:6379` | Render Dashboard | TLS-secured Upstash Redis connection string. |
| **REDIS_TTL_SECONDS** | Optional | No | `300` | `render.yaml` | Default cache TTL (5 minutes). |
| **JWT_SECRET** | Required | Yes | `<256-bit-base64-random-secret>` | Render Dashboard | HMAC-SHA256 signature key for student & staff JWTs. |
| **JWT_EXPIRATION** | Optional | No | `900000` | `render.yaml` | JWT validity duration (15 minutes). |
| **FIELD_ENCRYPTION_KEY** | Required | Yes | `<32-char-random-key>` | Render Dashboard | AES-256 key for sensitive database columns. |
| **PAYLOAD_ENCRYPTION_KEY** | Required | Yes | `<32-char-random-key>` | Render Dashboard | AES-256-GCM key for in-flight client/server payload crypto. |
| **BREVO_API_KEY** | Required | Yes | `xkeysib-...` | Render Dashboard | Brevo v3 API key (bypasses outbound SMTP port block). |
| **BREVO_SENDER_EMAIL** | Required | No | `<verified-sender@domain.edu.in>` | Render Dashboard | Verified sender email address in Brevo account. |
| **BREVO_SENDER_NAME** | Optional | No | `CharusatNeeds Production` | `render.yaml` | Sender display name in student inboxes. |
| **GOOGLE_CLIENT_ID** | Required | No | `<client-id>.apps.googleusercontent.com` | Render Dashboard | Server verification client ID for SSO ID token exchange. |
| **GOOGLE_CLIENT_SECRET** | Required | Yes | `<google-client-secret>` | Render Dashboard | Google OAuth confidential client secret. |
| **GOOGLE_REDIRECT_URI** | Required | No | `https://<vercel-domain>.vercel.app/auth/callback` | Render Dashboard | Matches frontend callback URI in Google Cloud Console. |
| **RAZORPAY_KEY_ID** | Required | No | `rzp_test_<TEST_KEY_ID>` | Render Dashboard | Razorpay Merchant Key ID (Test Mode). |
| **RAZORPAY_KEY_SECRET** | Required | Yes | `<RAZORPAY_KEY_SECRET>` | Render Dashboard | Razorpay Merchant Secret. Rotate before deployment. |
| **RAZORPAY_WEBHOOK_SECRET** | Required | Yes | `<RAZORPAY_WEBHOOK_SECRET>` | Render Dashboard | Webhook HMAC signature key. Rotate before deployment. |
| **IMAGEKIT_PUBLIC_KEY** | Required | No | `public_+grCFOmI0qDm3NTqiEhsvLFrhgc=` | Render Dashboard | ImageKit API public credential. |
| **IMAGEKIT_PRIVATE_KEY** | Required | Yes | `<IMAGEKIT_PRIVATE_KEY>` | Render Dashboard | ImageKit API private credential for folder initialization. |
| **IMAGEKIT_URL_ENDPOINT** | Optional | No | `https://ik.imagekit.io/cyseckush/` | Render Dashboard | ImageKit CDN delivery endpoint. |
| **B2_ENDPOINT** | Optional | No | `s3.us-east-005.backblazeb2.com` | Render Dashboard | Backblaze B2 S3-compatible storage endpoint. |
| **B2_BUCKET** | Optional | No | `charusatneeds-media-prod` | Render Dashboard | Backblaze B2 persistent storage bucket name. |
| **B2_KEY_ID** | Optional | Yes | `<B2_KEY_ID>` | Render Dashboard | Backblaze B2 Application Key ID. |
| **B2_APPLICATION_KEY** | Optional | Yes | `<B2_APPLICATION_KEY>` | Render Dashboard | Backblaze B2 Application Secret Key. |
| **FRONTEND_URL** | Required | No | `https://<vercel-domain>.vercel.app` | Render Dashboard | Canonical frontend base URL for CORS and email links. |
| **CORS_ALLOWED_ORIGINS** | Required | No | `https://<vercel-domain>.vercel.app` | Render Dashboard | Permitted browser origins in Spring Security filter chain. |
| **OTEL_SERVICE_NAME** | Required | No | `charusatneeds-backend` | `render.yaml` | Application service name in Grafana Cloud APM. |
| **OTEL_RESOURCE_ATTRIBUTES** | Required | No | `service.name=charusatneeds-backend,service.version=1.0.0,deployment.environment=production` | `render.yaml` | Metadata tags attached to all traces and metrics. |
| **OTEL_EXPORTER_OTLP_PROTOCOL** | Required | No | `http/protobuf` | `render.yaml` | OTLP transport protocol for Grafana Cloud. |
| **OTEL_JAVAAGENT_ENABLED** | Optional | No | `true` | `render.yaml` | Toggles OpenTelemetry in-process Java agent. |
| **OTEL_EXPORTER_OTLP_ENDPOINT** | Optional (Rec.) | No | `https://otlp-gateway-prod-us-east-0.grafana.net/otlp` | Render Dashboard | Regional Grafana Cloud OTLP ingestion URL. |
| **OTEL_EXPORTER_OTLP_HEADERS** | Optional (Rec.) | Yes | `Authorization=Basic <base64(instance_id:token)>` | Render Dashboard | Authenticated header for Grafana Cloud ingestion. |

---

## 5. Security & Boundary Enforcement Rules

1. **Client Isolation:** Never supply server secrets (`JWT_SECRET`, `SPRING_DATASOURCE_PASSWORD`, `IMAGEKIT_PRIVATE_KEY`, `RAZORPAY_KEY_SECRET`, `BREVO_API_KEY`) to Vercel.
2. **Strict Origin Locking:** Production `CORS_ALLOWED_ORIGINS` must never contain `localhost` or wildcards (`*`).
3. **Transport Security:** All database and cache connections in production must strictly mandate TLS (`sslmode=require` for PostgreSQL, `rediss://` for Redis).
4. **Fault-Tolerant Telemetry:** OpenTelemetry Java agent executes asynchronously in fail-open mode; if Grafana Cloud is unreachable, user requests continue processing uninterrupted.
