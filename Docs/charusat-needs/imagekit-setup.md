# Charusat Needs — ImageKit CDN Cloud Setup & Media Architecture

---

## 1. Overview & Free-Tier Specifications

ImageKit serves as the real-time media optimization CDN for Charusat Needs. It handles storage, on-the-fly transformations (resizing, WebP/AVIF compression), and edge caching for all student-facing food images, canteen branding, and promotional banners.

### Zero-Cost Constraints:
* **Cost:** $0.00 / month (Free Tier).
* **Credit Card Requirement:** None.
* **Bandwidth Allowance:** 20 GB / month.
* **Media Storage:** 20 GB media storage.
* **Master Images:** Unlimited master images.
* **Transformations:** Unlimited transformations on free plan.

---

## 2. API Credentials & Environment Variables

| Variable | Target | Confidentiality | Purpose |
|---|---|---|---|
| `IMAGEKIT_PUBLIC_KEY` | Backend & Frontend | Public | Client-side identifier for transformations and direct SDK calls. |
| `IMAGEKIT_PRIVATE_KEY` | Backend Server Only | RESTRICTED | Authorizes server-side operations and signs client upload tokens. NEVER exposed to frontend or Git. |
| `IMAGEKIT_URL_ENDPOINT` | Backend & Frontend | Public | CDN delivery URL: `https://ik.imagekit.io/cyseckush/` |

---

## 3. Automated Folder Hierarchy Provisioning

Manual folder creation inside the ImageKit web dashboard is **not required**. The backend automatically verifies and provisions the required directory structure using the ImageKit Media REST API (`POST https://api.imagekit.io/v1/folder/`).

### 3.1 Provisioning Rules
1. **Zero Frontend Exposure:** All folder creation requests are dispatched from backend services using `IMAGEKIT_PRIVATE_KEY` via server-side HTTP Basic authentication.
2. **Strict Idempotency:** Existing folders are preserved without error; missing folders are created dynamically. In-memory caching prevents duplicate network roundtrips.
3. **Fault-Tolerant Startup:** If ImageKit is temporarily unreachable, application startup completes normally and logs a non-fatal warning.
4. **Credential Privacy:** API keys and raw authorization headers are never logged; only sanitized folder paths and HTTP status codes appear in logs.

### 3.2 Base Directory Hierarchy
```text
charusatneeds/
  ├── canteens/     (Facade photos, branding, logos)
  ├── menu-items/   (Food catalog photos and thumbnails)
  ├── offers/       (Coupon graphics and promotional cards)
  ├── banners/      (Hero carousel banners and announcements)
  └── videos/       (Short promotional reels and food previews)
```

### 3.3 Dynamic Vendor-Specific Paths
When vendors upload menu items or branding, the system provisions dedicated subdirectories on demand:
```text
charusatneeds/menu-items/{canteen-slug}/
charusatneeds/canteens/{canteen-slug}/
charusatneeds/offers/{canteen-slug}/
```
Example paths:
* `charusatneeds/menu-items/campus-bites/`
* `charusatneeds/canteens/campus-bites/`
* `charusatneeds/offers/campus-bites/`

---

## 4. Verification & Management Procedures

### 4.1 Verification Scripts
To verify the entire folder hierarchy and confirm API authentication:

**Python Verification Script:**
```bash
# Uses environment variables
export IMAGEKIT_PRIVATE_KEY="your_private_key"
python scripts/verify-imagekit-folders.py

# Or pass via argument
python scripts/verify-imagekit-folders.py --private-key private_...
```

**PowerShell Verification Script:**
```powershell
$env:IMAGEKIT_PRIVATE_KEY = "your_private_key"
.\scripts\verify-imagekit-folders.ps1
```

### 4.2 REST API Verification & Initialization Endpoints
The backend exposes public management endpoints under `/api/public/media/`:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/public/media/config` | Retrieves public CDN configuration (endpoint, public key, provider). |
| `GET` | `/api/public/media/auth` | Generates HMAC-SHA1 upload signatures for direct browser uploads. |
| `GET` | `/api/public/media/folders/verify` | Queries ImageKit API and returns status of all base directories. |
| `POST` | `/api/public/media/folders/init` | Triggers idempotent creation of all base folders. |
| `POST` | `/api/public/media/folders/vendor` | Dynamically provisions vendor folders (`{ category, canteenSlug }`). |

---

## 5. Dynamic Optimization URL Patterns

All images stored in ImageKit are requested using URL-based transformation query parameters to guarantee minimum byte transfer and prevent Cumulative Layout Shift (CLS):

### 5.1 Thumbnail Delivery (Menu Item Cards)
```text
https://ik.imagekit.io/cyseckush/charusatneeds/menu-items/samosa.jpg?tr=w-300,h-200,fo-auto,q-80,f-auto
```
* `w-300,h-200`: Resizes to exactly 300x200 pixels.
* `fo-auto`: Smart cropping centered on food object.
* `q-80`: 80% perceptual quality compression.
* `f-auto`: Automatically delivers WebP or AVIF based on browser `Accept` header.

### 5.2 Hero Banner Delivery (Canteen Header)
```text
https://ik.imagekit.io/cyseckush/charusatneeds/canteens/sweetspot_banner.jpg?tr=w-1200,h-400,c-maintain_ratio,f-auto
```

---

## 6. Frontend Fallback Strategy

To prevent broken image placeholders if an image fails to load or ImageKit bandwidth runs out:
* The frontend component implements an `onError` handler that replaces missing image sources with a lightweight inline SVG placeholder:
  ```tsx
  <img 
    src={item.imageUrl} 
    loading="lazy" 
    onError={(e) => { e.currentTarget.src = "/assets/placeholder-food.svg"; }} 
  />
  ```
* Frontend utility `Frontend/src/Canteen/utils/imagekit.ts` provides helpers:
  - `buildImageKitUrl(path, options)`
  - `getMenuThumbnailUrl(path, width, height)`
  - `getCanteenBannerUrl(path, width, height)`
