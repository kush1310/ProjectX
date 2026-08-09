# Design System: CharusatNeeds Campus Food Platform
**Project ID:** 12788428123534336615
**Stitch Project:** projects/12788428123534336615

---

## 1. Visual Theme & Atmosphere

CharusatNeeds is a campus food aggregator with a clean, energetic, food-forward aesthetic inspired by Zomato's design philosophy. The overall mood is:

- **Confident and appetizing** — rich food photography anchors every hero/landing surface
- **Full-bleed, space-maximizing** — no centered narrow cards on white backgrounds; layouts use 100% viewport width with structured grid columns
- **Light mode exclusively** — warm whites, neutral grays, with a single bold red accent to create urgency and appetite
- **Institutional trust** — clean typography and structured layouts appropriate for a campus platform

---

## 2. Color Palette & Roles

| Descriptive Name | Hex | Functional Role |
|---|---|---|
| Zomato Tomato Red | `#E23744` | Primary CTA buttons, active states, brand accent, price highlights, "ADD" buttons |
| Deep Charcoal | `#1A1A1A` | Page headings (H1, H2), primary text |
| Medium Gray | `#757575` | Subtitle text, form labels, secondary descriptions |
| Light Gray | `#F5F5F5` | Input field backgrounds, card surfaces, skeleton loaders |
| Border Gray | `#E0E0E0` | Input borders default state, card borders, dividers |
| Pure White | `#FFFFFF` | Panel backgrounds, navbar, modal surfaces |
| Warm Cream | `#FFF8F0` | Page backgrounds (very subtle warm tint, not cold white) |
| Soft Rose Hover | `#FFEAEC` | Hover state on red-bordered inputs and buttons |
| Emerald Success | `#2E7D32` | Coupon applied, payment success, order confirmed states |
| Amber Warning | `#F59E0B` | Bestseller badge, promotional highlights |
| Dark Overlay | `rgba(26,26,26,0.55)` | Food photography hero overlays on left panels |

---

## 3. Typography Rules

- **Font Family:** Inter (Google Fonts) — used exclusively throughout
- **H1 / Page Title:** `Inter 700 (Bold)`, 28–32px, color `#1A1A1A`
- **H2 / Section Title:** `Inter 700`, 20–22px, color `#1A1A1A`
- **H3 / Card Title:** `Inter 600 (SemiBold)`, 15–16px, color `#1A1A1A`
- **Body / Description:** `Inter 400 (Regular)`, 13–14px, color `#757575`
- **Labels:** `Inter 500 (Medium)`, 12–13px, color `#757575`, uppercase tracking for section headers
- **Price / Badge:** `Inter 700`, 14–16px, color `#E23744`
- **Button Text:** `Inter 700`, 14–16px, white on red backgrounds
- **Letter spacing:** Normal for body; `tracking-wider` (0.06em) for badge labels and all-caps section headers

---

## 4. Component Stylings

### Buttons
- **Primary CTA (Sign In, Add to Cart, Proceed to Pay):** Solid `#E23744` background, white text, `border-radius: 10px`, full-width in forms, `48px height`, hover: `#C62828`
- **Secondary / Outline:** White background, `2px border #E23744`, red text, same radius — used for "ADD" state before item is in cart
- **Quantity Stepper:** Inline pill with Minus and Plus icons, `border: 2px solid #E23744`, white background, `border-radius: 8px`
- **Google Sign-In:** White background, `1px border #E0E0E0`, `border-radius: 10px`, Google icon + "Continue with Google" text, hover subtle gray

### Cards / Containers
- **Menu Item Card:** White surface `#FFFFFF`, `border-radius: 16px`, `1px border #E0E0E0`, whisper-soft shadow `0 2px 8px rgba(0,0,0,0.06)`, food image top half + content bottom half
- **Canteen Card (Dashboard):** White surface, `border-radius: 20px`, slightly deeper shadow on hover `0 8px 24px rgba(0,0,0,0.10)`, full image hero with overlay text at bottom
- **Navbar:** Pure white `#FFFFFF`, `1px border-bottom #F0F0F0`, sticky, full-width, `height: 60px`, no shadow — separation by border only
- **Sidebar (Vendor/Admin):** Left sidebar `280px` wide, white background, `1px border-right #F0F0F0`, active nav item: left `4px border #E23744` + `bg #FFF0F1`
- **Modal / Bottom Sheet:** White surface, `border-radius: 24px 24px 0 0` (bottom sheet) or `border-radius: 20px` (dialog), `backdrop: rgba(0,0,0,0.4) blur(8px)`

### Inputs / Forms
- **Default:** `background: #F5F5F5`, `border: 2px solid transparent`, `border-radius: 10px`, `padding: 14px 16px`
- **Focus:** `background: #FFFFFF`, `border: 2px solid #E23744`, slight white glow
- **Error:** `background: #FFF5F5`, `border: 2px solid #E23744`, red error text below `12px`
- **Textarea:** Same as inputs, `min-height: 96px`, `resize: none`

### Badges
- **Bestseller:** `background: #F59E0B`, white text, `border-radius: 6px`, absolute-positioned top-left of image
- **Discount:** `background: #E23744`, white text, `border-radius: 4px`, absolute-positioned bottom-left of image
- **Veg / Non-Veg dot:** Standard green/red bordered square dot (industry standard)

---

## 5. Layout Principles

### Full-Width Philosophy (Critical — No Narrow Centered Cards)
- **Auth pages (Login, Signup, Forgot Password):** 55% / 45% split layout — left hero panel (food photography + overlay + branding), right form panel (white, full-height, padded)
- **Dashboard / Home:** Full-width header + content area using `max-width: none` but with internal `px-8 lg:px-16` padding. Canteen cards in 3–4 column grid on desktop
- **Menu Page:** Left sidebar (category list, 240px, sticky) + main content area (flexible, remaining width). On mobile: top filter bar instead
- **Cart Page:** Two-column on desktop — left 60% (cart items) + right 40% (order summary, sticky)
- **Admin / Vendor Dashboard:** Left sidebar (280px, fixed) + main content area (full remaining width)

### Spacing System
- **Page horizontal padding:** `px-6 sm:px-10 lg:px-16` — generous but never wasted
- **Section gaps:** `gap-6` for cards, `gap-4` for form fields, `gap-3` for list items
- **Component internal padding:** `p-5` for cards, `p-4` for compact elements, `p-3` for tight UI

### Grid
- **Canteen cards:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- **Menu items:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- **Dashboard stats:** `grid-cols-2 md:grid-cols-4`

---

## 6. Interaction & Animation

- **Hover on cards:** `translateY(-2px)` + deepen shadow — 200ms ease
- **Button press:** `scale(0.97)` — 100ms
- **Page transitions:** `opacity 0 → 1` + `translateY(12px → 0)` — 250ms ease-out
- **Bottom sheet / modal entry:** Spring animation `stiffness: 350, damping: 35`
- **Skeleton loading:** Pulse animation on `#F5F5F5` shapes
- **ADD → Stepper transition:** AnimatePresence fade — no jarring snap
