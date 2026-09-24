# Charusat Needs — ImageKit CDN Cloud Setup & Media Architecture

---

## 1. Overview & Free-Tier Specifications

ImageKit serves as the real-time media optimization CDN for Charusat Needs. It handles storage, on-the-fly transformations (resizing, WebP/AVIF compression), and edge caching for all student-facing food images and canteen banners.

### Zero-Cost Constraints:
* **Cost:** $0.00 / month (Free Tier).
* **Credit Card Requirement:** None.
* **Bandwidth Allowance:** 20 GB / month.
* **Media Storage:** 20 GB media storage.
* **Master Images:** Unlimited master images.
* **Transformations:** Unlimited transformations on free plan.

---

## 2. Step-by-Step Provisioning Runbook

1. **Sign Up / Login:**
   - Navigate to `https://imagekit.io/`.
   - Register using email or Google authentication.
2. **Configure ImageKit ID:**
   - Choose a unique ImageKit ID: e.g., `charusatneeds`
   - Your delivery endpoint will be: `https://ik.imagekit.io/charusatneeds/`
3. **Retrieve API Credentials:**
   - In the ImageKit dashboard, navigate to **Developer Options** → **API Keys**.
   - Copy:
     - **Public Key:** `public_...` (Safe for frontend injection)
     - **Private Key:** `private_...` (Restricted to backend environment variables)
     - **URL-endpoint:** `https://ik.imagekit.io/[your_id]/`
4. **Create Media Folders:**
   - Under **Media Library**, create two root directories:
     - `/canteens`: Campus canteen logos and facade banners.
     - `/menu-items`: Food catalogue photos categorized by item ID.

---

## 3. Dynamic Optimization URL Patterns

All images stored in ImageKit are requested using URL-based transformation query parameters to guarantee minimum byte transfer and prevent Cumulative Layout Shift (CLS):

### 3.1 Thumbnail Delivery (Menu Item Cards)
```text
https://ik.imagekit.io/charusatneeds/menu-items/samosa.jpg?tr=w-300,h-200,fo-auto,q-80,f-auto
```
* `w-300,h-200`: Resizes to exactly 300x200 pixels.
* `fo-auto`: Smart cropping centered on food object.
* `q-80`: 80% perceptual quality compression.
* `f-auto`: Automatically delivers WebP or AVIF based on browser `Accept` header.

### 3.2 Hero Banner Delivery (Canteen Header)
```text
https://ik.imagekit.io/charusatneeds/canteens/sweetspot_banner.jpg?tr=w-1200,h-400,c-maintain_ratio,f-auto
```

---

## 4. Frontend Fallback Strategy

To prevent broken image placeholders if an image fails to load or ImageKit bandwidth runs out:
* The frontend component implements an `onError` handler that replaces missing image sources with a lightweight inline SVG placeholder:
  ```tsx
  <img 
    src={item.imageUrl} 
    loading="lazy" 
    onError={(e) => { e.currentTarget.src = "/assets/placeholder-food.svg"; }} 
  />
  ```
* Database stores standard relative paths or full CDN URLs.
