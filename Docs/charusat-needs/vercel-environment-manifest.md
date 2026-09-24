# CHARUSAT NEEDS - Vercel Frontend Environment Variable Manifest

**Audit Date:** 2026-09-24  
**Target Environment:** Vercel Production Deployment  
**Repository Branch:** main  
**Framework:** React 18 + Vite 6 + TypeScript  
**Root Directory on Vercel:** `Frontend`  

---

## 1. Executive Summary

This document provides a forensic audit of all environment variables consumed by the CharusatNeeds frontend application. All client-side environment variables in Vite are prefixed with `VITE_` and are statically embedded into the compiled JavaScript bundle at build time.

### Critical Security Distinction
- **Client-Side Exposure:** Every variable defined in Vercel for this repository is exposed to end users in plaintext within browser network requests or bundle code.
- **Zero Secrets on Vercel:** The frontend requires **zero private keys, API secrets, database passwords, or signing tokens**. All sensitive operations (payment signing, password hashing, JWT generation, ImageKit folder management) are strictly executed by the Spring Boot backend on Render.
- **Never Define Backend Secrets on Vercel:** Under no circumstance should `JWT_SECRET`, `RAZORPAY_KEY_SECRET`, `IMAGEKIT_PRIVATE_KEY`, `BREVO_API_KEY`, or `SPRING_DATASOURCE_PASSWORD` be configured in Vercel.

---

## 2. Vercel Project Configuration Audit

The Vercel deployment must be configured with the following project settings:

| Configuration Property | Value | Source / Verification |
|---|---|---|
| **Root Directory** | `Frontend` | Required: Repository contains `Backend/` and `Frontend/` in monorepo layout |
| **Framework Preset** | `Vite` | Detected from `Frontend/package.json` (`vite: ^6.0.5`) |
| **Build Command** | `npm run build` | Executes `tsc -b && vite build` (verified clean compilation) |
| **Output Directory** | `dist` | Default Vite build directory |
| **Install Command** | `npm install` | Standard npm package resolution |
| **Node.js Version** | `18.x` or `20.x` | Compliant with `package.json` engines constraint `>=18.0.0` |
| **Routing / Rewrites** | Single Page Application (SPA) | Configured in `Frontend/vercel.json` (`/(.*) → /index.html`) |

### Security Headers Configured in `Frontend/vercel.json`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`
- `Cache-Control: public, max-age=31536000, immutable` on `/assets/(.*)`

---

## 3. Comprehensive Variable Audit Table

| Variable Name | Required / Optional | Classification | Consuming File(s) & Lines | Fallback / Default | Production Format |
|---|---|---|---|---|---|
| **VITE_API_URL** | Required | Public (Client) | `Frontend/src/utils/api.ts:5`, `Frontend/src/hooks/useWebSocket.ts:27` | `http://localhost:8000/api` | `https://charusatneeds-backend.onrender.com/api` |
| **VITE_WS_URL** | Optional (Recommended) | Public (Client) | `Frontend/src/hooks/useWebSocket.ts:24-25` | Auto-derived from `VITE_API_URL` (`wss://.../ws/websocket`) | `wss://charusatneeds-backend.onrender.com/ws/websocket` |
| **VITE_GOOGLE_CLIENT_ID** | Required for SSO | Public (Client) | `Frontend/src/utils/googleAuth.ts:8, 16` | None (alerts administrator error) | `<client-id>.apps.googleusercontent.com` |
| **VITE_GOOGLE_REDIRECT_URI** | Optional (Recommended) | Public (Client) | `Frontend/src/utils/googleAuth.ts:9` | Dynamic `${window.location.origin}/auth/callback` | `https://<vercel-subdomain>.vercel.app/auth/callback` |
| **VITE_IMAGEKIT_URL_ENDPOINT** | Optional | Public (CDN) | `Frontend/src/Canteen/utils/imagekit.ts:28` | `https://ik.imagekit.io/cyseckush/` | `https://ik.imagekit.io/cyseckush/` |
| **VITE_API_BASE_URL** | Optional (Deprecated) | Public (Client) | `Frontend/src/utils/api.ts:5`, `Frontend/src/hooks/useWebSocket.ts:27` | None (Secondary alias for `VITE_API_URL`) | Omit in Vercel; use `VITE_API_URL` |

---

## 4. Deep Forensic Analysis Per Variable

### 1. `VITE_API_URL`
- **Consuming Code:**
  - `Frontend/src/utils/api.ts:5`
  ```typescript
  const rawApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  export const BACKEND_URL = rawApiUrl.replace(/\/api\/?$/, '');
  export const API_URL = `${BACKEND_URL}/api`;
  ```
  - `Frontend/src/hooks/useWebSocket.ts:27-30`
- **Required:** Yes, for production.
- **Classification:** Public.
- **Purpose and Runtime Behavior:** Supplies the root URL for all HTTP communication between the React Single Page Application and the Spring Boot REST API. The code automatically handles both trailing `/api` and bare URLs by sanitizing via `.replace(/\/api\/?$/, '')` and re-attaching `/api`.
- **Fallback if Omitted:** Defaults to `'http://localhost:8000/api'`. In production, this causes all browser API requests to target the end user's local machine.
- **Production Value:** `https://<render-service-name>.onrender.com/api` (e.g., `https://charusatneeds-backend.onrender.com/api`).
- **Failure Impact:** Total API outage. Authentication, canteen menus, cart operations, orders, and payment initialization fail immediately.

---

### 2. `VITE_WS_URL`
- **Consuming Code:**
  - `Frontend/src/hooks/useWebSocket.ts:24-30`
  ```typescript
  if (import.meta.env.VITE_WS_URL) {
    brokerURL = import.meta.env.VITE_WS_URL;
  } else {
    const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
    if (apiUrl && apiUrl.startsWith('http')) {
      const wsBase = apiUrl.replace(/^http/, 'ws').replace(/\/api\/?$/, '');
      brokerURL = `${wsBase}/ws/websocket`;
    }
  }
  ```
- **Required:** Optional (Explicit declaration recommended).
- **Classification:** Public.
- **Purpose and Runtime Behavior:** Overrides the STOMP WebSocket broker connection URL. If omitted, the frontend automatically derives the WebSocket endpoint by taking `VITE_API_URL`, transforming `https://` to `wss://`, removing trailing `/api`, and appending `/ws/websocket`.
- **Fallback if Omitted:** Correctly auto-derived as `wss://<render-service-name>.onrender.com/ws/websocket`.
- **Production Value:** `wss://charusatneeds-backend.onrender.com/ws/websocket`.
- **Failure Impact:** If explicitly misconfigured with an incorrect path, real-time live kitchen status updates and order notifications fail to stream; the client logs WebSocket reconnection attempts while REST features continue working.

---

### 3. `VITE_GOOGLE_CLIENT_ID`
- **Consuming Code:**
  - `Frontend/src/utils/googleAuth.ts:8, 16`
  ```typescript
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  export const initiateGoogleLogin = (): void => {
    if (!GOOGLE_CLIENT_ID) {
      console.error('Google Client ID not configured. Please set VITE_GOOGLE_CLIENT_ID in .env');
      alert('Google OAuth is not configured. Please contact administrator.');
      return;
    }
    // ...
  }
  ```
- **Required:** Required if Google Campus SSO is active.
- **Classification:** Public OAuth 2.0 Client Identifier.
- **Purpose and Runtime Behavior:** Public identifier of the Google Cloud OAuth 2.0 Web Application credential. Restricts login to `@charusat.edu.in` accounts via `hd=charusat.edu.in` parameter.
- **Fallback if Omitted:** `undefined`.
- **Production Value:** Standard Google client ID string ending in `.apps.googleusercontent.com`.
- **Failure Impact:** Clicking "Sign in with Google" displays an administrative configuration error alert and aborts the login process. Standard email/password login remains functional.

---

### 4. `VITE_GOOGLE_REDIRECT_URI`
- **Consuming Code:**
  - `Frontend/src/utils/googleAuth.ts:9-10`
  ```typescript
  const REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || 
    (typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'http://localhost:5173/auth/callback');
  ```
- **Required:** Optional (Explicit declaration recommended).
- **Classification:** Public.
- **Purpose and Runtime Behavior:** Destination URL where Google redirects user after identity authorization. The callback route `/auth/callback` exchanges authorization codes with the backend API (`/api/auth/google/callback`).
- **Fallback if Omitted:** Resolves dynamically in browser via `window.location.origin + '/auth/callback'`.
- **Production Value:** `https://<vercel-deployment-name>.vercel.app/auth/callback` or custom university domain `https://needs.charusat.ac.in/auth/callback`.
- **Failure Impact:** If the URI does not strictly match an entry under Google Cloud Console > Authorized Redirect URIs, Google halts flow with error `redirect_uri_mismatch`.

---

### 5. `VITE_IMAGEKIT_URL_ENDPOINT`
- **Consuming Code:**
  - `Frontend/src/Canteen/utils/imagekit.ts:8, 28`
  ```typescript
  const DEFAULT_CDN_ENDPOINT = 'https://ik.imagekit.io/cyseckush/';
  export function getImageKitEndpoint(): string {
    const endpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || DEFAULT_CDN_ENDPOINT;
    return endpoint.endsWith('/') ? endpoint : `${endpoint}/`;
  }
  ```
- **Required:** Optional (Hardcoded default present).
- **Classification:** Public CDN URL.
- **Purpose and Runtime Behavior:** Base CDN endpoint for on-the-fly image transformations (WebP auto-conversion, dynamic resizing, quality compression) for menu items and banners.
- **Fallback if Omitted:** `https://ik.imagekit.io/cyseckush/`.
- **Production Value:** `https://ik.imagekit.io/cyseckush/`.
- **Failure Impact:** If left unset, seamlessly falls back to the production ImageKit CDN endpoint without error.

---

## 5. Non-Consumed Candidate Variables Audit

The following variables appear in older documentation or sample `.env` files but are **NOT** consumed by the current application codebase:

| Candidate Variable | Location Found | Runtime Consumption Status | Verdict |
|---|---|---|---|
| `VITE_IMAGEKIT_PUBLIC_KEY` | `Frontend/.env.example:16` | **Zero references** in `Frontend/src/`. All authenticated operations (e.g. folder creation) occur on Spring Boot backend. | **Do NOT add to Vercel** |
| `VITE_ENV` | `Frontend/.env.example:20` | **Zero references** in `Frontend/src/`. Vite uses built-in `import.meta.env.MODE` and `import.meta.env.PROD`. | **Do NOT add to Vercel** |
| `VITE_API_BASE_URL` | `Frontend/src/utils/api.ts:5` | Redundant fallback alias for `VITE_API_URL`. | **Do NOT add to Vercel** |

---

## 6. Cross-Platform Origin and Route Alignment Matrix

When deploying to Vercel, the frontend URL interacts with three separate cloud services. All endpoints must match identically:

```
[ Vercel Frontend ]
  https://charusatneeds.vercel.app
          │
          ├── 1. REST API & WebSocket Requests ─────────→ [ Render Backend ]
          │      Origin: https://charusatneeds.vercel.app    CORS_ALLOWED_ORIGINS=https://charusatneeds.vercel.app
          │                                                  FRONTEND_URL=https://charusatneeds.vercel.app
          │
          └── 2. Google OAuth 2.0 Flow ──────────────────→ [ Google Cloud Console ]
                 Redirect: https://...vercel.app/auth/callback Authorized Origins: https://charusatneeds.vercel.app
                                                               Authorized Redirect URIs: .../auth/callback
```

### Exact Cross-Platform Synchronization Checklist

1. **Vercel → Render Backend:**
   - In Render Dashboard, set:
     - `FRONTEND_URL = https://<your-vercel-domain>.vercel.app`
     - `CORS_ALLOWED_ORIGINS = https://<your-vercel-domain>.vercel.app`

2. **Vercel → Google Cloud Console:**
   - Under APIs & Services > Credentials > OAuth 2.0 Client IDs:
     - Add to **Authorized JavaScript origins**: `https://<your-vercel-domain>.vercel.app`
     - Add to **Authorized redirect URIs**: `https://<your-vercel-domain>.vercel.app/auth/callback`

3. **Render Backend → Google Cloud Console:**
   - Under OAuth 2.0 Client IDs:
     - Add to **Authorized redirect URIs**: `https://<your-render-domain>.onrender.com/login/oauth2/code/google`
   - In Render Dashboard:
     - `GOOGLE_REDIRECT_URI = https://<your-vercel-domain>.vercel.app/auth/callback`
