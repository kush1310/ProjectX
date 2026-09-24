# Charusat Needs — Modern Food-Commerce Design System Update

**Document Version:** 2.0.0  
**Effective Date:** 2026-09-24  
**Classification:** Frontend Design System Architecture  
**Visual Benchmark:** Primary 4-Screen Reference + Zomato Information Architecture  

---

## 1. Core Visual Tokens

The design system establishes a consistent token hierarchy matching the primary 4-screen visual reference while preserving Charusat Needs brand equity.

### 1.1 Color Palette Tokens

| Token Name | Hex Code | Tailwind Class | Semantic Purpose |
|---|---|---|---|
| `brand-primary` | `#E23744` | `bg-red-600` / `text-red-600` | Primary buttons, active indicators, brand accent. |
| `brand-hover` | `#C82333` | `hover:bg-red-700` | Hover / active press states. |
| `surface-base` | `#FFFFFF` | `bg-white` | Primary content cards, modals, sheets. |
| `surface-muted` | `#F8FAFC` | `bg-slate-50` / `bg-gray-50` | App background, inactive toggles. |
| `text-primary` | `#111827` | `text-gray-900` | Primary headlines, item titles, prices. |
| `text-secondary` | `#4B5563` | `text-gray-600` | Descriptions, metadata, secondary labels. |
| `text-muted` | `#9CA3AF` | `text-gray-400` | Inactive tabs, placeholder text, timestamps. |
| `border-subtle` | `#E5E7EB` | `border-gray-200` | Card borders, dividers, subtle separators. |
| `status-success` | `#059669` | `text-emerald-600` / `bg-emerald-50` | Open canteen tags, veg badge, savings banner. |
| `status-warning` | `#D97706` | `text-amber-600` / `bg-amber-50` | Scheduled badge, counter payment notice. |
| `status-error` | `#DC2626` | `text-rose-600` / `bg-rose-50` | Form validation errors, non-veg indicator. |

---

## 2. Typography & Numeric Hierarchy

* **Font Family:** Modern variable sans-serif (`font-sans` with system font fallbacks: Inter, SF Pro, Segoe UI, Roboto).
* **Price Typography Rule:** Numeric prices always utilize bold weights with currency prefix (`font-bold text-gray-950`). Strikethrough original prices use lighter weights and muted tones (`line-through text-gray-400 text-sm`).
* **Visual Hierarchy Scale:**
  * **H1 (Screen Title):** `text-xl md:text-2xl font-black text-gray-950 tracking-tight`
  * **H2 (Section Header):** `text-base md:text-lg font-extrabold text-gray-900`
  * **Card Title:** `text-sm md:text-base font-bold text-gray-900`
  * **Body Copy:** `text-xs md:text-sm text-gray-600 leading-relaxed`
  * **Caption / Meta:** `text-[11px] text-gray-400 font-medium`

---

## 3. Reference Visual Alignment (4-Screen Architecture)

### Screen 1 — Home & Food Discovery
* **Search Field:** Rounded-full pill (`rounded-full bg-white border border-gray-200 shadow-sm pl-10 pr-10 py-2.5 text-sm`) with search icon on the left and microphone on the right.
* **Filter Chips Strip:** Horizontal scroll container featuring:
  * `All` (Dark charcoal active pill: `bg-gray-900 text-white`).
  * `Canteens` (Neutral pill with storefront icon).
  * `Open Now` (Pill with active emerald status indicator dot).
  * `Offers` (Pill with orange discount tag icon).
  * `Rating 4.0+` (Pill with star icon).
* **Deal of the Day Promo Card:** Elevated warm gradient card featuring Honest Restaurant, Gujarati Thali, Flat ₹100 Off coupon tag, and rounded red pill "Order Now" CTA.

### Screens 2, 3, 4 — Campus Delivery Address Flow
* **Screen 2 ("Who are you?"):** High-contrast selectable role cards for "Student" and "Faculty & Staff" with custom university campus imagery and red pill "Continue ->" CTA.
* **Screen 3 ("Your Hostel"):** Student hostel selector featuring campus map integration, Boys/Girls hostel segmented toggle, 3x3 hostel chip grid, and room number input.
* **Screen 4 ("Your Building"):** Faculty building selector featuring campus building grid (CSPIT, DEPSTAR, RPCP, CMPICA, MTIN, etc.), department chips, and staff room input.

---

## 4. Glassmorphism & Neumorphism Guardrails

* **Glassmorphism:** Strictly restricted to floating filter bars, sticky top navigation headers, and modal overlays using `backdrop-blur-md bg-white/90`. Glassmorphism is prohibited on data-dense tables or text cards.
* **Neumorphism:** Subtle dual-shadow depth is reserved exclusively for interactive toggles (ASAP vs Schedule segmented control, Boys vs Girls hostel selector, and quantity steppers). Deep embossed skeuomorphic styling is prohibited.
