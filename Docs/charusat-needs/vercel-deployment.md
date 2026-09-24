# Charusat Needs — Vercel Frontend Deployment Guide

---

## 1. Overview & Free-Tier Specifications

Vercel serves the compiled React 18 Single Page Application across its global edge network. Vercel automatically manages SSL certificates, gzip/brotli asset compression, HTTP/2 multiplexing, and Git-based preview deployments.

### Zero-Cost Constraints:
* **Cost:** $0.00 / month (Hobby Tier).
* **Credit Card Requirement:** None.
* **Bandwidth Allowance:** 100 GB / month.
* **Serverless Execution:** Standard edge static hosting.
* **Custom Domains:** Included at zero cost.

---

## 2. Step-by-Step Deployment Runbook

1. **Sign in to Vercel:**
   - Navigate to `https://vercel.com/` and log in via GitHub.
2. **Import Repository:**
   - Click **Add New...** → **Project**.
   - Select the `CharusatNeeds_SGP_Latest_10_8_26` GitHub repository.
3. **Configure Project Settings:**
   - **Project Name:** `charusatneeds`
   - **Framework Preset:** `Vite`
   - **Root Directory:** Edit and set to `Frontend`.
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm ci`
4. **Configure Environment Variables:**
   Add the following public environment variables in the Vercel dashboard:
   - `VITE_API_URL`: `https://[your-backend-service].onrender.com`
   - `VITE_WS_URL`: `wss://[your-backend-service].onrender.com/ws/websocket`
   - `VITE_GOOGLE_CLIENT_ID`: `[your-client-id].apps.googleusercontent.com`
5. **Deploy:**
   - Click **Deploy**.
   - Vercel executes `npm ci` and `npm run build`, packaging static bundles into edge storage.
6. **Verify Public URL:**
   - Deployment output generates an HTTPS domain: `https://charusatneeds.vercel.app`.

---

## 3. SPA Routing & Security Header Configuration (`vercel.json`)

The repository includes `Frontend/vercel.json` to handle client-side routing and security headers at edge nodes:

```json
{
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

---

## 4. Verification Checkpoints

1. **Root Page:** Open `https://charusatneeds.vercel.app/`. Ensure landing page renders with zero console errors.
2. **Deep Links:** Navigate directly to `https://charusatneeds.vercel.app/canteens` and press Ctrl+F5 (hard refresh). The page must render correctly without returning a 404 Not Found error.
3. **API Connectivity:** Open browser Developer Tools Network tab. Verify requests to `https://[render-backend].onrender.com/api/public/canteens` return HTTP 200 with CORS headers allowed.
