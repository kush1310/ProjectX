# Charusat Needs — Google OAuth 2.0 Production Configuration & Verification

---

## 1. Verified Architecture & Protocol Flow

Based on static analysis of `Frontend/src/App.tsx`, `Frontend/src/utils/googleAuth.ts`, `Frontend/src/pages/AuthCallback.tsx`, `Backend/src/main/java/com/charusat/canteen/controller/AuthController.java`, and `Backend/src/main/java/com/charusat/canteen/service/GoogleAuthService.java`, the Google OAuth 2.0 implementation operates strictly under the standard Authorization Code Flow:

```text
Student Browser                        Google Identity Server                  Backend (Render)
      │                                          │                                     │
      │── 1. GET /o/oauth2/v2/auth ─────────────▶│                                     │
      │   (client_id, redirect_uri,             │                                     │
      │    scope, hd=charusat.edu.in)            │                                     │
      │                                          │                                     │
      │◀─ 2. 302 Redirect to redirect_uri ───────│                                     │
      │   (https://[app].vercel.app/auth/callback?code=AUTH_CODE)                      │
      │                                                                                │
      │── 3. Mount <AuthCallback /> ──────────────────────────────────────────────────▶│
      │   POST /api/auth/google/callback { code: AUTH_CODE }                           │
      │                                          │                                     │
      │                                          │◀── 4. POST /token (backchannel) ────│
      │                                          │    (code, client_id, client_secret, │
      │                                          │     redirect_uri, grant_type)       │
      │                                          │─── Return access_token ────────────▶│
      │                                          │                                     │
      │                                          │◀── 5. GET /oauth2/v2/userinfo ──────│
      │                                          │─── Return user profile JSON ───────▶│
      │                                                                                │
      │                                                                                │ 6. Verify @charusat.edu.in
      │                                                                                │    Find or create user
      │                                                                                │    Generate Application JWT
      │◀─ 7. HTTP 200 { token: JWT, user: USER_OBJ } ──────────────────────────────────│
      │                                                                                │
      │ 8. Store JWT in localStorage & Redirect to /customer/dashboard                 │
```

---

## 2. Exact Production Values for Google Cloud Console

When configuring the OAuth 2.0 Web Client in the Google Cloud Console (`https://console.cloud.google.com/`), enter the following production values:

### 2.1 Authorized JavaScript Origins
Add both the production Vercel domain and local developer origins:
* `https://[your-project].vercel.app` (Exact production Vercel URL, without trailing slash)
* `http://localhost:5173` (Vite local development)
* `http://localhost:80` (Local Docker Compose frontend)

### 2.2 Authorized Redirect URIs
Per RFC 6749 Section 4.1.3, the redirect URI sent during the authorization request must match character-for-character with the URI sent during token exchange:
* `https://[your-project].vercel.app/auth/callback` (Exact production callback endpoint)
* `http://localhost:5173/auth/callback` (Local development callback endpoint)
* `http://localhost:80/auth/callback` (Local Docker Compose callback endpoint)

---

## 3. Frontend vs Backend Responsibilities

| Responsibility Domain | Responsible Component | Implementation Details | Security Invariant |
|---|---|---|---|
| **Initiate Auth Flow** | `Frontend/src/utils/googleAuth.ts` | Redirects browser to `accounts.google.com/o/oauth2/v2/auth` with `client_id`, `redirect_uri`, `scope=email profile openid`, and `hd=charusat.edu.in`. | Zero secrets used; `client_id` is public. |
| **Capture Auth Code** | `Frontend/src/pages/AuthCallback.tsx` | Mounted on route `/auth/callback`. Extracts `code` parameter from URL query string. | Prevents duplicate processing in React StrictMode via ref flag. |
| **Forward Code to Backend** | `Frontend/src/utils/googleAuth.ts` | Sends `POST /api/auth/google/callback` with `{ code }`. | Authorization code is ephemeral and single-use. |
| **Confidential Token Exchange** | `Backend/.../GoogleAuthService.java` | Calls `https://oauth2.googleapis.com/token` over server-to-server TLS sending `code`, `client_id`, and `client_secret`. | `client_secret` NEVER leaves the Render backend environment. |
| **Identity & Domain Verification** | `Backend/.../GoogleAuthService.java` | Fetches Google user profile and validates: `email.endsWith("@charusat.edu.in")`. | Rejects unauthorized emails with HTTP 403. |
| **Application Session Issuance** | `Backend/.../AuthController.java` | Creates or updates user record in PostgreSQL and issues signed HS256 JWT. | Passwordless security model for OAuth users. |

---

## 4. Environment Variable Injection Map

### Frontend (Vercel Dashboard)
```env
VITE_GOOGLE_CLIENT_ID=[your-client-id].apps.googleusercontent.com
VITE_GOOGLE_REDIRECT_URI=https://[your-project].vercel.app/auth/callback
```

### Backend (Render Dashboard)
```env
GOOGLE_CLIENT_ID=[your-client-id].apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=[your-google-client-secret]
GOOGLE_REDIRECT_URI=https://[your-project].vercel.app/auth/callback
```
*(Note: `GOOGLE_REDIRECT_URI` in Render must match `VITE_GOOGLE_REDIRECT_URI` in Vercel character-for-character)*
