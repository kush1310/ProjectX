# Charusat Needs — Google OAuth 2.0 Cloud Setup & Domain Gating

---

## 1. Overview & Security Architecture

Google OAuth 2.0 provides Single Sign-On (SSO) for students and faculty of CHARUSAT. The authentication engine enforces strict domain restrictions: only institutional accounts ending with `@charusat.edu.in` are permitted to enter the platform.

```text
       Student                 Google Identity Service               Backend AuthService
          │                               │                                   │
          │─── 1. Click "Google Sign In" ─▶                                   │
          │                               │                                   │
          │◀── 2. Authenticate & Grant ───│                                   │
          │    (Return auth_code / id_token)                                  │
          │                                                                   │
          │─── 3. Send id_token to Backend (/api/auth/google) ───────────────▶│
          │                                                                   │
          │                               │◀── 4. Verify Token with Google ───│
          │                               │    (Check signature & aud)        │
          │                               │─── Return Payload ───────────────▶│
          │                                                                   │
          │                                                                   │ 5. Validate Domain:
          │                                                                   │    email.endsWith("@charusat.edu.in")
          │                                                                   │    IF valid: Issue App JWT
          │                                                                   │    IF invalid: Return 403 Forbidden
          │◀── 6. Return Signed Application JWT ──────────────────────────────│
```

---

## 2. Step-by-Step Google Cloud Console Setup

1. **Access Google Cloud Console:**
   - Navigate to `https://console.cloud.google.com/`.
   - Sign in with an authorized CHARUSAT administrator or developer Google account.
2. **Select or Create Project:**
   - Project Name: `Charusat-Needs-Campus`
3. **Configure OAuth Consent Screen:**
   - User Type: `External` (or `Internal` if scoped solely to CHARUSAT Google Workspace).
   - App Name: `Charusat Needs`
   - User Support Email: `canteen-alerts@charusat.edu.in`
   - Authorized Domains: `charusat.edu.in`, `vercel.app`
4. **Create OAuth 2.0 Web Client Credentials:**
   - Navigate to **Credentials** → **Create Credentials** → **OAuth client ID**.
   - Application Type: `Web application`.
   - Name: `Charusat Needs Web Client`.
   - **Authorized JavaScript Origins:**
     - `http://localhost:5173` (Local development)
     - `http://localhost:80` (Local Docker)
     - `https://[your-vercel-app].vercel.app` (Production Vercel)
   - **Authorized Redirect URIs:**
     - `http://localhost:5173/auth/callback`
     - `https://[your-vercel-app].vercel.app/auth/callback`
5. **Extract Client Credentials:**
   - Copy **Client ID**: e.g., `1234567890-abcdefg.apps.googleusercontent.com`
   - Copy **Client Secret**: e.g., `GOCSPX-...`

---

## 3. Production Environment Injection

* **Frontend (Vercel):**
  ```env
  VITE_GOOGLE_CLIENT_ID=[your-client-id].apps.googleusercontent.com
  ```
  *(Note: The client secret must NEVER be injected into the frontend environment)*

* **Backend (Render):**
  ```env
  GOOGLE_CLIENT_ID=[your-client-id].apps.googleusercontent.com
  GOOGLE_CLIENT_SECRET=[your-client-secret]
  GOOGLE_REDIRECT_URI=https://[your-vercel-app].vercel.app/auth/callback
  ```

---

## 4. Institutional Security Controls

In `GoogleAuthService.java`:
```java
String email = payload.getEmail();
if (email == null || !email.toLowerCase().endsWith("@charusat.edu.in")) {
    throw new SecurityException("Unauthorized domain: Only @charusat.edu.in accounts are permitted.");
}
```
Any external personal Gmail (`@gmail.com`) or unauthorized domains receive an explicit HTTP 403 rejection.
