# CHARUSAT NEEDS - Render Environment Variable Manifest

**Audit Date:** 2026-09-24
**Branch:** main
**Profile:** prod (Spring Boot)
**Deployment Target:** Render Free - Docker Runtime - Singapore Region

---

## FORENSIC AUDIT BASIS

Configuration files analysed in full:
- Backend/src/main/resources/application.properties
- Backend/src/main/resources/application-prod.properties
- Backend/src/main/resources/application-docker.properties
- render.yaml
- Backend/Dockerfile
- Backend/pom.xml
- All @Value annotations in Backend/src/main/java/**
- SecurityConfig.java, SecurityHeadersConfig.java, WebSocketConfig.java
- RazorpayConfig.java, ImageKitConfig.java
- JwtService.java, GoogleAuthService.java, EmailService.java
- RedisCacheService.java, FieldEncryptor.java, PayloadCryptoService.java
- .env.example (root), Frontend/.env.example

---

## SECTION 1 - COMPLETE RENDER VARIABLE INVENTORY

| Variable | Required? | Secret? | Consumed By | Property Binding | Example / Format | Status |
|---|---|---|---|---|---|---|
| SPRING_PROFILES_ACTIVE | Required | No | Spring Boot startup | Profile selection | prod | Set in render.yaml |
| PORT | Required | No | Spring Boot server | server.port | 8000 | Render injects automatically; 8000 set in render.yaml |
| SPRING_DATASOURCE_URL | Required | No | HikariCP / JDBC | spring.datasource.url | jdbc:postgresql://ep-dawn-frog-b35covl9-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require | Human must enter Neon pooled JDBC URL |
| SPRING_DATASOURCE_USERNAME | Required | No | HikariCP / JDBC | spring.datasource.username | neondb_owner | Human must enter from Neon dashboard |
| SPRING_DATASOURCE_PASSWORD | Required | SECRET | HikariCP / JDBC | spring.datasource.password | <SECRET_FROM_NEON> | Human must enter from Neon dashboard |
| DB_POOL_MAX | Optional | No | HikariCP | spring.datasource.hikari.maximum-pool-size | 10 | Default 10; set in render.yaml |
| DB_POOL_MIN_IDLE | Optional | No | HikariCP | spring.datasource.hikari.minimum-idle | 2 | Default 2; set in render.yaml |
| REDIS_ENABLED | Required | No | RedisCacheService.java | redis.enabled | true | Set in render.yaml |
| REDIS_URL | Required | SECRET-containing | spring-data-redis (Lettuce) | spring.data.redis.url | rediss://default:<UPSTASH_TOKEN>@true-insect-295406.upstash.io:6379 | Human must enter full Upstash RESP3 URL |
| REDIS_TTL_SECONDS | Optional | No | RedisCacheService.java | redis.default-ttl-seconds | 300 | Default 300; set in render.yaml |
| JWT_SECRET | Required | SECRET | JwtService.java, AuthService.java | jwt.secret | <BASE64_256BIT_JWT_SECRET> | Human must generate and supply |
| JWT_EXPIRATION | Optional | No | JwtService.java, AuthService.java | jwt.expiration | 900000 | Default 900000 ms (15 min); set in render.yaml |
| FIELD_ENCRYPTION_KEY | Required | SECRET | FieldEncryptor.java | security.encryption.key | <32_CHAR_AES_KEY> | Human must generate 32-character key |
| PAYLOAD_ENCRYPTION_KEY | Required | SECRET | PayloadCryptoService.java | security.payload.encryption.key | <32_CHAR_AES_KEY> | Human must generate 32-character key |
| CORS_ALLOWED_ORIGINS | Required | No | application-prod.properties | spring.web.cors.allowed-origins | https://charusatneeds.vercel.app | Human enters after Vercel deploy; see BLOCKER in Section 10 |
| FRONTEND_URL | Required | No | EmailService.java | app.frontend.url | https://charusatneeds.vercel.app | Human must enter after Vercel deploy |
| BREVO_API_KEY | Required | SECRET | EmailService.java | spring.mail.password | <BREVO_API_KEY> | Human must obtain from Brevo v3 dashboard |
| BREVO_SENDER_EMAIL | Required | No | EmailService.java | spring.mail.username, spring.mail.from | canteen-alerts@charusat.edu.in | Human must use verified Brevo sender |
| BREVO_SENDER_NAME | Optional | No | application-prod.properties | spring.mail.from-name | Charusat Needs | Default "Charusat Needs"; set in render.yaml |
| GOOGLE_CLIENT_ID | Required | No | GoogleAuthService.java | google.client.id | 412237294748-rtk111689l4fkskieu9icvhkmampdvv5.apps.googleusercontent.com | Human copies from Google Cloud Console |
| GOOGLE_CLIENT_SECRET | Required | SECRET | GoogleAuthService.java | google.client.secret | <GOOGLE_CLIENT_SECRET> | Human copies from Google Cloud Console |
| GOOGLE_REDIRECT_URI | Required | No | GoogleAuthService.java | google.redirect.uri | https://charusatneeds.vercel.app/auth/callback | Must match authorized redirect URI in Google Console |
| RAZORPAY_KEY_ID | Required | No | RazorpayConfig.java | razorpay.key.id | rzp_test_<TEST_KEY_ID> | Test-mode key ID; non-secret |
| RAZORPAY_KEY_SECRET | Required | SECRET | RazorpayConfig.java | razorpay.key.secret | <RAZORPAY_KEY_SECRET> | Human copies from Razorpay Test dashboard |
| RAZORPAY_WEBHOOK_SECRET | Required | SECRET | RazorpayConfig.java | razorpay.webhook.secret | <RAZORPAY_WEBHOOK_SECRET> | Human copies from Razorpay webhook settings |
| IMAGEKIT_PUBLIC_KEY | Optional | No | ImageKitConfig.java | imagekit.public-key | public_+grCFOmI0qDm3NTqiEhsvLFrhgc= | Safe default in application.properties |
| IMAGEKIT_PRIVATE_KEY | Required | SECRET | ImageKitConfig.java, ImageKitFolderService.java | imagekit.private-key | <IMAGEKIT_PRIVATE_KEY> | Human copies from ImageKit dashboard |
| IMAGEKIT_URL_ENDPOINT | Optional | No | ImageKitConfig.java | imagekit.url-endpoint | https://ik.imagekit.io/cyseckush/ | Safe default in application.properties |
| MEDIA_STORAGE_PROVIDER | Optional | No | ImageKitConfig.java | media.storage.provider | imagekit | Default imagekit |
| B2_ENDPOINT | Optional | No | application-prod.properties | b2.endpoint | https://s3.us-west-004.backblazeb2.com | Empty default; no active runtime code consumes this |
| B2_BUCKET | Optional | No | application-prod.properties | b2.bucket | charusatneeds-media-prod | Empty default |
| B2_KEY_ID | Optional | No | application-prod.properties | b2.key-id | <B2_KEY_ID> | Empty default |
| B2_APPLICATION_KEY | Optional | SECRET | application-prod.properties | b2.application-key | <B2_APPLICATION_KEY> | Empty default; only required if B2 activated |

**TOTALS:**
- Total Render variables: 33
- Required (mandatory at startup): 22
- Optional (safe defaults exist): 11
- Secrets (must not be in Git or Vercel): 12
- Non-secret: 21

---

## SECTION 2 - OBSOLETE / DO NOT ADD TO RENDER

| Variable | Reason for Exclusion |
|---|---|
| DATABASE_URL | Not consumed by Spring. application-prod.properties uses SPRING_DATASOURCE_URL. |
| REDIS_HOST | Docker-profile only. REDIS_URL takes precedence in prod via Lettuce. |
| REDIS_PORT | Docker-profile only. Embedded in REDIS_URL. |
| REDIS_PASSWORD | Docker-profile only. Embedded as token in REDIS_URL for Upstash. |
| REDIS_SSL | Docker-profile only. SSL is implicit in rediss:// scheme. |
| redis.host | Legacy lowercase docker property. Dead in prod. |
| redis.port | Legacy lowercase docker property. Dead in prod. |
| redis.password | Legacy lowercase docker property. Dead in prod. |
| redis.ssl | Legacy lowercase docker property. Dead in prod. |
| SMTP_USERNAME | Legacy alias in root .env.example. Prod uses BREVO_SENDER_EMAIL. |
| SMTP_PASSWORD | Legacy alias in root .env.example. Prod uses BREVO_API_KEY. |
| BACKEND_URL | Not consumed by any @Value or property binding. Documentation note only. |
| VITE_API_URL | Frontend (Vercel) only. Never passes to the JVM. |
| VITE_WS_URL | Frontend (Vercel) only. Never passes to the JVM. |
| VITE_GOOGLE_CLIENT_ID | Frontend (Vercel) only. |
| VITE_GOOGLE_REDIRECT_URI | Frontend (Vercel) only. |
| VITE_IMAGEKIT_URL_ENDPOINT | Frontend (Vercel) only. |
| VITE_IMAGEKIT_PUBLIC_KEY | Frontend (Vercel) only. |
| VITE_ENV | Frontend (Vercel) only. |
| SPRING_SQL_INIT_MODE | Hardcoded to never in application-prod.properties. Do not override. |

---

## SECTION 3 - DATABASE (NEON POSTGRESQL) ANALYSIS

Variable names confirmed by application-prod.properties lines 8-10:
- SPRING_DATASOURCE_URL
- SPRING_DATASOURCE_USERNAME
- SPRING_DATASOURCE_PASSWORD

DATABASE_URL is NOT used. Spring does not support that naming convention without custom binding.

SSL: sslmode=require is embedded in the JDBC URL. No separate SSL variable required.

Connection pooling: HikariCP defaults to maximum-pool-size=10, minimum-idle=2.
Neon free tier supports up to 10 connections per pooler endpoint. Compatible.

PostgreSQL version: Neon instance is PostgreSQL 18.6.
Spring Boot 3.2.2 with spring-boot-starter-jdbc and postgresql JDBC 42.x is compatible.

---

## SECTION 4 - REDIS (UPSTASH) ANALYSIS

Redis client: spring-boot-starter-data-redis (Lettuce driver).
Primary connection string: spring.data.redis.url bound to ${REDIS_URL:} (application-prod.properties line 63).

Upstash connection format required:
  REDIS_URL = rediss://default:<UPSTASH_TOKEN>@true-insect-295406.upstash.io:6379

The rediss:// scheme (double-s) enforces TLS. Token is the Upstash REST token used as password.

Variables consumed in prod:
- REDIS_URL      — Required, SECRET-containing
- REDIS_ENABLED  — Required, value: true
- REDIS_TTL_SECONDS — Optional, default 300

Variables NOT consumed in prod (OBSOLETE):
- REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_SSL — docker-profile only.

---

## SECTION 5 - GOOGLE OAUTH ANALYSIS

Consumed by GoogleAuthService.java:
- @Value("${google.client.id:}")         -> GOOGLE_CLIENT_ID
- @Value("${google.client.secret:}")     -> GOOGLE_CLIENT_SECRET
- @Value("${google.redirect.uri:...}")   -> GOOGLE_REDIRECT_URI

Callback architecture: frontend initiates OAuth implicit flow, receives code, posts
code + redirectUri to /api/auth/google. Backend exchanges code using GOOGLE_CLIENT_SECRET.
GOOGLE_REDIRECT_URI must exactly match the URI registered in Google Cloud Console.

---

## SECTION 6 - BREVO EMAIL ANALYSIS

Method: HTTPS REST API (https://api.brevo.com/v3/smtp/email) - NOT SMTP.
Render outbound SMTP port block is bypassed entirely.

Variables consumed (EmailService.java):
- BREVO_SENDER_EMAIL -> spring.mail.username (and spring.mail.from)
- BREVO_API_KEY      -> spring.mail.password (used as Bearer token in HTTPS POST)
- BREVO_SENDER_NAME  -> spring.mail.from-name (default "Charusat Needs")
- FRONTEND_URL       -> app.frontend.url (password reset link base)

---

## SECTION 7 - IMAGEKIT ANALYSIS

Consumed by ImageKitConfig.java:
- imagekit.public-key    -> IMAGEKIT_PUBLIC_KEY  (safe default exists)
- imagekit.private-key   -> IMAGEKIT_PRIVATE_KEY (no default; upload fails if absent)
- imagekit.url-endpoint  -> IMAGEKIT_URL_ENDPOINT (safe default exists)
- media.storage.provider -> MEDIA_STORAGE_PROVIDER (default imagekit)

Also consumed by ImageKitFolderService.java and ImageKitFolderInitializer.java
for idempotent folder creation on startup using Basic Auth with private key.

---

## SECTION 8 - BACKBLAZE B2 ANALYSIS

All four B2 variables (B2_ENDPOINT, B2_BUCKET, B2_KEY_ID, B2_APPLICATION_KEY) have
empty string defaults. No active Java class reads them via @Value.
B2 is a future extension point. Current media pipeline uses ImageKit exclusively.
VERDICT: B2 variables are OPTIONAL. Do not block deployment on their absence.

---

## SECTION 9 - RAZORPAY ANALYSIS

Consumed by RazorpayConfig.java (no defaults in prod - failure on missing):
- @Value("${razorpay.key.id}")        -> RAZORPAY_KEY_ID
- @Value("${razorpay.key.secret}")    -> RAZORPAY_KEY_SECRET
- @Value("${razorpay.webhook.secret}")-> RAZORPAY_WEBHOOK_SECRET

Test vs Live: key prefix rzp_test_ = Test Mode (current). rzp_live_ = Live Mode (do NOT use).
No RAZORPAY_MODE or RAZORPAY_ENVIRONMENT variable exists in the codebase.
Mode is determined solely by the key ID prefix.

---

## SECTION 10 - CORS ANALYSIS AND CRITICAL BLOCKER

CRITICAL BLOCKER: SecurityConfig.java lines 97-101 has hardcoded localhost CORS allowedOrigins.
This configuration is used by the Spring Security CORS filter which applies to ALL secured endpoints.

The SecurityHeadersConfig.java WebMvcConfigurer.corsConfigurer() reads spring.web.cors.allowed-origins
(which maps CORS_ALLOWED_ORIGINS) but applies only to /api/** via WebMvcConfigurer -
a lower-priority mechanism that does not override the Security filter.

CONSEQUENCE: All cross-origin requests from Vercel will be rejected in production with 403/CORS error
even if CORS_ALLOWED_ORIGINS is correctly set in the Render Dashboard.

REQUIRED FIX before deployment: Update SecurityConfig.java to inject CORS origins from the
spring.web.cors.allowed-origins property or directly from CORS_ALLOWED_ORIGINS via @Value.

---

## SECTION 11 - FRONTEND vs BACKEND VARIABLE SEPARATION

| Variable | Vercel | Render | Secret? | Reason |
|---|---|---|---|---|
| VITE_API_URL | Yes | No | No | Frontend fetch client base URL |
| VITE_WS_URL | Yes | No | No | Frontend WebSocket URL |
| VITE_GOOGLE_CLIENT_ID | Yes | No | No | Client-side OAuth flow initiation |
| VITE_GOOGLE_REDIRECT_URI | Yes | No | No | Must match Google Console |
| VITE_IMAGEKIT_URL_ENDPOINT | Yes | No | No | CDN URL for media delivery |
| VITE_IMAGEKIT_PUBLIC_KEY | Yes | No | No | Frontend upload widget if used |
| VITE_ENV | Yes | No | No | Frontend environment flag |
| SPRING_PROFILES_ACTIVE | No | Yes | No | JVM profile selection |
| PORT | No | Yes | No | Container HTTP port |
| SPRING_DATASOURCE_URL | No | Yes | No | Database JDBC URL |
| SPRING_DATASOURCE_USERNAME | No | Yes | No | Database user |
| SPRING_DATASOURCE_PASSWORD | No | Yes | SECRET | Must never be in Vercel |
| REDIS_URL | No | Yes | SECRET | Redis password embedded in URL |
| REDIS_ENABLED | No | Yes | No | Cache toggle |
| JWT_SECRET | No | Yes | SECRET | Token signing |
| FIELD_ENCRYPTION_KEY | No | Yes | SECRET | AES-256-GCM DB column encryption |
| PAYLOAD_ENCRYPTION_KEY | No | Yes | SECRET | AES-256-GCM payload encryption |
| GOOGLE_CLIENT_ID | Yes (VITE_ prefix) | Yes (bare) | No | Both sides need it differently |
| GOOGLE_CLIENT_SECRET | No | Yes | SECRET | Must NEVER appear in frontend or Vercel |
| GOOGLE_REDIRECT_URI | No | Yes | No | Backend validates redirect URI |
| BREVO_API_KEY | No | Yes | SECRET | Must NEVER be frontend-visible |
| BREVO_SENDER_EMAIL | No | Yes | No | Backend only |
| BREVO_SENDER_NAME | No | Yes | No | Backend only |
| FRONTEND_URL | No | Yes | No | Used in email templates |
| CORS_ALLOWED_ORIGINS | No | Yes | No | Security filter configuration |
| IMAGEKIT_PRIVATE_KEY | No | Yes | SECRET | Must NEVER be exposed to frontend |
| IMAGEKIT_PUBLIC_KEY | Yes (VITE_ prefix) | Yes (bare) | No | Both sides need it |
| IMAGEKIT_URL_ENDPOINT | Yes (VITE_ prefix) | Yes (bare) | No | Both sides need it |
| RAZORPAY_KEY_ID | No | Yes | No | Backend only |
| RAZORPAY_KEY_SECRET | No | Yes | SECRET | Must NEVER be in frontend |
| RAZORPAY_WEBHOOK_SECRET | No | Yes | SECRET | Backend HMAC verification only |
| B2_ENDPOINT | No | Yes | No | Backend optional |
| B2_BUCKET | No | Yes | No | Backend optional |
| B2_KEY_ID | No | Yes | No | Backend optional |
| B2_APPLICATION_KEY | No | Yes | SECRET | Must never be in frontend |

---

## SECTION 12 - SECRET SAFETY SCAN RESULTS

Files scanned: application.properties, application-docker.properties, application-prod.properties,
render.yaml, Backend/Dockerfile, .env.example, all files under Docs/

FINDING 1 - application.properties (development profile)
Lines: 26, 89, 105, 111-113
- jwt.secret line 26: dev fallback value present; production requires ${JWT_SECRET} with no fallback in prod profile
- security.encryption.key line 89: dev fallback; prod profile requires ${FIELD_ENCRYPTION_KEY}
- security.payload.encryption.key line 105: dev fallback; prod profile requires ${PAYLOAD_ENCRYPTION_KEY}
- razorpay.key.id line 111: test-mode key ID; low risk
- razorpay.key.secret line 112: [SECRET DETECTED - test-mode secret in source; rotation recommended]
- razorpay.webhook.secret line 113: [SECRET DETECTED - test-mode secret in source; rotation recommended]

FINDING 2 - application-docker.properties (docker profile)
Lines: 19, 26-27, 30-32: same category as Finding 1; only activated with SPRING_PROFILES_ACTIVE=docker.

FINDING 3 - Docs/charusat-needs/cloud-environment-matrix.md
Lines: 40-41
- Razorpay test key secret: [SECRET DETECTED - ROTATE REQUIRED]
- Razorpay webhook secret: [SECRET DETECTED - ROTATE REQUIRED]
Action: Redact this file and rotate both Razorpay test credentials.

FINDING 4 - SecurityConfig.java (not a secret; deployment blocker)
Hardcoded localhost CORS origins - see Section 10.

SCAN VERDICTS:
- render.yaml:                  PASS (all sync:false; no plaintext secrets)
- Backend/Dockerfile:           PASS (no secrets in ENV instructions; non-root user; multi-stage)
- root .env.example:            PASS (placeholder values only)
- Frontend/.env.example:        PASS (placeholder values only)
- application-prod.properties:  PASS (all values via ${VAR} with no insecure defaults)
- Docs/ (except noted file):    PASS
- cloud-environment-matrix.md:  FAIL (plaintext Razorpay secrets - ROTATE REQUIRED)
- application.properties:       WARNING (dev fallback secrets in source - not production-exposed)
- application-docker.properties: WARNING (dev fallback secrets - only active in docker profile)

---

## SECTION 13 - VALIDATION CHECKLIST

| Check | Result | Notes |
|---|---|---|
| Every variable traced to consuming class/property | PASS | All 33 variables traced |
| No duplicate variable names | PASS | All names unique |
| SPRING_DATASOURCE_URL vs DATABASE_URL naming | PASS | Confirmed: SPRING_DATASOURCE_URL is correct |
| REDIS_URL vs REDIS_HOST/PORT/PASSWORD naming | PASS | REDIS_URL is prod binding; others are OBSOLETE |
| render.yaml vs manifest consistency | PASS | render.yaml variables covered; B2 optionals noted |
| root .env.example vs manifest consistency | WARNING | Contains legacy SMTP_USERNAME, REDIS_HOST etc - correctly classified OBSOLETE |
| Docker multi-stage build | PASS | Stage 1: Maven build. Stage 2: JRE runtime. Non-root user. |
| No secrets embedded in Docker image | PASS | No ENV secret instructions in Dockerfile |
| Production config points to localhost | FAIL | SecurityConfig.java CORS hardcodes localhost - code fix required |
| No VITE_ variables in Render manifest | PASS | All VITE_ assigned to Vercel only |
| Secrets scan | FAIL | Razorpay secrets in cloud-environment-matrix.md (rotate required) |

---

## SECTION 14 - BLOCKING ISSUES BEFORE RENDER DEPLOYMENT

| Priority | Issue | Required Action |
|---|---|---|
| BLOCKER | SecurityConfig.java CORS filter hardcodes localhost origins | Update SecurityConfig.java to read from spring.web.cors.allowed-origins property. Without this Vercel frontend gets CORS errors on all secured API calls. |
| BLOCKER | Razorpay test secrets in cloud-environment-matrix.md | Redact lines 40-41, rotate Razorpay test key secret and webhook secret via Razorpay Test Dashboard. |
| ACTION | Vercel domain not yet known | CORS_ALLOWED_ORIGINS, FRONTEND_URL, GOOGLE_REDIRECT_URI cannot be finalized until Vercel deployment URL is confirmed. |
| ACTION | JWT_SECRET not yet generated | Generate fresh 256-bit Base64 key: python3 -c "import base64,os; print(base64.b64encode(os.urandom(32)).decode())" |
| ACTION | FIELD_ENCRYPTION_KEY not yet confirmed | Must confirm or generate 32-character key. |
| ACTION | PAYLOAD_ENCRYPTION_KEY not yet confirmed | Must confirm or generate 32-character key. |
