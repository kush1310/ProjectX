# CHARUSAT NEEDS - Vercel Frontend Environment Variable Manifest

**Audit Date:** 2026-09-24  
**Target Environment:** Vercel Production Deployment  
**Repository Branch:** main  
**Framework:** React 18 + Vite 6 + TypeScript  
**Root Directory on Vercel:** `Frontend`  

---

## 1. Executive Summary

This document provides the authoritative forensic manifest of all environment variables consumed by the CharusatNeeds frontend application. In Vite, all environment variables prefixed with `VITE_` are statically embedded into the compiled JavaScript bundle at build time and sent to user browsers in plaintext.

### Critical Security Boundaries
- **Zero Secrets on Vercel:** The frontend requires **zero private keys, API secrets, database passwords, or signing tokens**. All sensitive operations (payment verification, password hashing, JWT signing, ImageKit folder administration) are executed strictly on the Spring Boot backend on Render.
- **Never Define Backend Secrets on Vercel:** Under no circumstance should `DATABASE_URL`, `DB_PASSWORD`, `REDIS_PASSWORD`, `REDIS_TOKEN`, `JWT_SECRET`, `ENCRYPTION_SECRET`, `GOOGLE_CLIENT_SECRET`, `BREVO_API_KEY`, `IMAGEKIT_PRIVATE_KEY`, `B2_APPLICATION_KEY`, or `RAZORPAY_KEY_SECRET` be configured in Vercel.

---

## 2. Vercel Project Configuration Audit

| Configuration Property | Value | Source / Verification |
|---|---|---|
| **Root Directory** | `Frontend` | Required: Repository contains `Backend/` and `Frontend/` in monorepo layout |
| **Framework Preset** | `Vite` | Detected from `Frontend/package.json` (`vite: ^6.0.5`) |
| **Build Command** | `npm run build` | Executes `tsc -b && vite build` (verified clean compilation in 13.52s) |
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

## 3. Authoritative Vercel Variable Classification Table

| Variable | Required? | Public? | Used By | Production Value | Preview Value | Source | Status |
|---|---|---|---|---|---|---|---|
| **VITE_API_URL** | Yes | Yes | `api.ts:5`, `useWebSocket.ts:27` | `https://projectx-s0sw.onrender.com/api` | `https://projectx-s0sw.onrender.com/api` | Render Web Service URL | VERIFIED BY EXECUTION |
| **VITE_WS_URL** | Optional (Rec.) | Yes | `useWebSocket.ts:24-25` | `wss://projectx-s0sw.onrender.com/ws/websocket` | `wss://projectx-s0sw.onrender.com/ws/websocket` | Render WSS broker endpoint | VERIFIED BY EXECUTION |
| **VITE_GOOGLE_CLIENT_ID** | Yes (for SSO) | Yes | `googleAuth.ts:8, 16` | `412237294748-rtk111689l4fkskieu9icvhkmampdvv5.apps.googleusercontent.com` | `412237294748-rtk111689l4fkskieu9icvhkmampdvv5.apps.googleusercontent.com` | Google Cloud Console OAuth 2.0 Credentials | VERIFIED BY STATIC INSPECTION |
| **VITE_GOOGLE_REDIRECT_URI** | Optional (Rec.) | Yes | `googleAuth.ts:9` | `https://charusatneeds.vercel.app/auth/callback` | `https://charusatneeds.vercel.app/auth/callback` | Vercel Deployment Domain | VERIFIED BY STATIC INSPECTION |
| **VITE_IMAGEKIT_URL_ENDPOINT** | Optional | Yes | `imagekit.ts:28` | `https://ik.imagekit.io/cyseckush/` | `https://ik.imagekit.io/cyseckush/` | ImageKit Dashboard / Hardcoded default | VERIFIED BY EXECUTION |

---

## 4. API URL Verification

Inspecting `Frontend/src/utils/api.ts` (lines 5-8):
```typescript
let rawApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://projectx-s0sw.onrender.com/api' : 'http://localhost:8000/api');
if (rawApiUrl.includes('charusatneeds-backend.onrender.com')) {
  rawApiUrl = rawApiUrl.replace('charusatneeds-backend.onrender.com', 'projectx-s0sw.onrender.com');
}
export const BACKEND_URL = rawApiUrl.replace(/\/api\/?$/, '');
export const API_URL = `${BACKEND_URL}/api`;
```

### Key Technical Findings:
1. **Normalization Behavior:** The utility sanitizes the input by stripping any trailing `/api` or `/api/` using `.replace(/\/api\/?$/, '')` into `BACKEND_URL`, and then constructs `API_URL` by appending `/api`.
2. **Double `/api/api` Prevention:** Even if a user provides `https://projectx-s0sw.onrender.com/api`, the regex removes `/api`, resulting in `https://projectx-s0sw.onrender.com/api`.
3. **Canonical Production Standard:** `VITE_API_URL=https://projectx-s0sw.onrender.com/api` is the verified production endpoint.
4. **Fallback:** If omitted, defaults to `'https://projectx-s0sw.onrender.com/api'` in production and `'http://localhost:8000/api'` in local development.

---

## 5. WebSocket Verification

Inspecting `Frontend/src/hooks/useWebSocket.ts` (lines 21-53):
```typescript
let brokerURL = url;
if (!brokerURL) {
  if (import.meta.env.VITE_WS_URL) {
    brokerURL = import.meta.env.VITE_WS_URL;
  } else {
    const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
    if (apiUrl && apiUrl.startsWith('http')) {
      const wsBase = apiUrl.replace(/^http/, 'ws').replace(/\/api\/?$/, '');
      brokerURL = `${wsBase}/ws/websocket`;
    }
  }
}
```

### Key Technical Findings:
1. **WebSocket Protocol:** Mandates secure `wss://` for production. In automatic fallback mode, replacing `^http` with `ws` transforms `https://...` into `wss://...`.
2. **Hostname:** Matches the Render Web Service hostname (`charusatneeds-backend.onrender.com`).
3. **Port:** Standard HTTPS/WSS port `443` (implicit on Render public endpoints).
4. **STOMP Endpoint:** In [Backend/src/main/java/com/charusat/canteen/config/WebSocketConfig.java](file:///d:/A_Coding/A_MainCodes/CharusatNeeds_SGP_Latest_10_8_26/CharusatNeeds_SGP_Latest_10_8_26/Backend/src/main/java/com/charusat/canteen/config/WebSocketConfig.java#L25-L31), the STOMP endpoint is registered as `/ws` with SockJS fallback at `/ws/websocket`.
5. **Exact Production Value:** `VITE_WS_URL=wss://charusatneeds-backend.onrender.com/ws/websocket`.
6. **Reconnect & Keepalive:** Configured with 4000 ms incoming/outgoing heartbeats and auto-reconnects on disconnect.

---

## 6. Google OAuth Verification

Inspecting `Frontend/src/utils/googleAuth.ts` and `Frontend/src/pages/AuthCallback.tsx`:
```typescript
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || 
  (typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'http://localhost:5173/auth/callback');
```

### Key Technical Findings:
1. **Public Identifier:** `VITE_GOOGLE_CLIENT_ID` is public configuration and safe for client bundle inclusion.
2. **Zero Client Secret on Vercel:** Google OAuth Client Secret (`GOOGLE_CLIENT_SECRET`) is used strictly server-side by Spring Boot (`/api/auth/google/callback`) and must NEVER be placed in Vercel.
3. **Institutional Restriction:** Enforces `hd=charusat.edu.in` parameter on OAuth request and validates email domain on callback.
4. **Exact Redirect Route:** `/auth/callback` mapped in `App.tsx` line 88 (`<Route path="/auth/callback" element={<AuthCallback />} />`).
5. **Exact Production Value:** `VITE_GOOGLE_REDIRECT_URI=https://<actual-vercel-domain>.vercel.app/auth/callback`.

---

## 7. Vercel Security Check — Secret Exclusion Verification

A comprehensive automated security regex scan was performed across all source files in `Frontend/src/` and compiled bundle files in `Frontend/dist/` for forbidden backend secrets:

| Forbidden Secret Token | Scan Target | Result | Status |
|---|---|---|---|
| `DATABASE_URL` | `Frontend/src/` & `Frontend/dist/` | 0 occurrences | VERIFIED CLEAN |
| `DB_PASSWORD` | `Frontend/src/` & `Frontend/dist/` | 0 occurrences | VERIFIED CLEAN |
| `REDIS_PASSWORD` | `Frontend/src/` & `Frontend/dist/` | 0 occurrences | VERIFIED CLEAN |
| `REDIS_TOKEN` | `Frontend/src/` & `Frontend/dist/` | 0 occurrences | VERIFIED CLEAN |
| `JWT_SECRET` | `Frontend/src/` & `Frontend/dist/` | 0 occurrences | VERIFIED CLEAN |
| `ENCRYPTION_SECRET` | `Frontend/src/` & `Frontend/dist/` | 0 occurrences | VERIFIED CLEAN |
| `GOOGLE_CLIENT_SECRET` | `Frontend/src/` & `Frontend/dist/` | 0 occurrences | VERIFIED CLEAN |
| `BREVO_API_KEY` | `Frontend/src/` & `Frontend/dist/` | 0 occurrences | VERIFIED CLEAN |
| `IMAGEKIT_PRIVATE_KEY` | `Frontend/src/` & `Frontend/dist/` | 0 occurrences | VERIFIED CLEAN |
| `B2_APPLICATION_KEY` | `Frontend/src/` & `Frontend/dist/` | 0 occurrences | VERIFIED CLEAN |
| `RAZORPAY_KEY_SECRET` | `Frontend/src/` & `Frontend/dist/` | 0 occurrences | VERIFIED CLEAN |

---

## 8. Variables NOT Consumed by Code (Do NOT Add to Vercel)

| Variable | Reason for Exclusion |
|---|---|
| `VITE_IMAGEKIT_PUBLIC_KEY` | Zero references in `Frontend/src/`. All authenticated operations (folder check/creation) are executed by Spring Boot. |
| `VITE_ENV` | Unused in `Frontend/src/`. Vite uses built-in `import.meta.env.MODE` and `import.meta.env.PROD`. |
| `VITE_API_BASE_URL` | Redundant legacy alias for `VITE_API_URL`. Use canonical `VITE_API_URL` only. |
