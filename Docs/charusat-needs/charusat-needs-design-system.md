# CHARUSAT NEEDS — DESIGN SYSTEM SPECIFICATION (2026)
## Enterprise Multi-Platform Design Tokens, Component Standards & UX Architecture

---

## 1. DESIGN TOKEN ARCHITECTURE

### 1.1 Color Tokens

```css
:root {
  /* Brand Crimson Primary Scale */
  --color-primary-50:   #FFF1F2;
  --color-primary-100:  #FFE4E6;
  --color-primary-200:  #FECDD3;
  --color-primary-300:  #FDA4AF;
  --color-primary-400:  #FB7185;
  --color-primary-500:  #E23744; /* Canonical Primary Brand Color */
  --color-primary-600:  #DC2626;
  --color-primary-700:  #B91C1C;
  --color-primary-800:  #991B1B;
  --color-primary-900:  #7F1D1D;

  /* Campus Emerald Secondary Scale (Veg Mode & Operational States) */
  --color-emerald-500:  #1BA672;
  --color-emerald-600:  #15803D;
  --color-emerald-50:   #ECFDF5;

  /* Surface & Background Hierarchy */
  --color-bg-canvas:    #F8F9FA;
  --color-surface-card: #FFFFFF;
  --color-surface-elev: #FFFFFF;
  --color-surface-sub:  #F4F5F7;

  /* Text & Typographic Hierarchy */
  --color-text-main:    #1C1C1C;
  --color-text-sec:     #4A4A4A;
  --color-text-muted:   #828282;
  --color-text-subtle:  #9C9C9C;

  /* Semantic Feedback & Marketing */
  --color-warning:      #F59E0B;
  --color-error:        #EF4444;
  --color-offer-bg:     #FFF5F5;
  --color-offer-text:   #E23744;
}
```

---

### 1.2 Typography Hierarchy

| Style Token | Font Family | Size | Weight | Line Height | Letter Spacing | Use Case |
|:---|:---|:---|:---|:---|:---|:---|
| **Display** | Outfit | 36px | 900 | 1.15 | -0.03em | Deal of the Day hero title |
| **Heading XL** | Outfit | 26px | 800 | 1.2 | -0.02em | Modal headers ("Who are you?") |
| **Heading LG** | Outfit | 20px | 700 | 1.25 | -0.015em | Section headings ("Popular Canteens") |
| **Heading MD** | Inter | 16px | 700 | 1.3 | -0.01em | Canteen & Food item titles |
| **Body LG** | Inter | 14px | 500 | 1.45 | 0em | Primary descriptions |
| **Body MD** | Inter | 13px | 400 | 1.4 | 0em | Secondary metadata, inputs |
| **Body SM** | Inter | 12px | 500 | 1.35 | 0.01em | Chips, status labels |
| **Caption** | Inter | 11px | 600 | 1.3 | 0.02em | Timestamps, ratings count |
| **Overline** | Inter | 10px | 800 | 1.2 | 0.08em | Step labels ("STEP 1 OF 2") |
| **Price** | Outfit | 18px | 800 | 1.2 | -0.01em | Current item price (Rs. 199) |
| **Discount** | Inter | 13px | 500 | 1.2 | 0em | Strikethrough original price |

---

### 1.3 Border Radius System

```css
--radius-xs:   4px;   /* Tag dots and tiny indicators */
--radius-sm:   8px;   /* Input fields and compact controls */
--radius-md:   12px;  /* Filter chips, small buttons */
--radius-lg:   16px;  /* Segmented cards, building selector tiles */
--radius-xl:   20px;  /* Modal dialogs, map containers */
--radius-2xl:  24px;  /* Hero promotional card */
--radius-pill: 9999px;/* Action buttons, search bar, active pills */
```

---

### 1.4 Elevation & Shadow Hierarchy

```css
/* Level 0: Flat */
--shadow-lvl-0: none;

/* Level 1: Subtle Border Lift */
--shadow-lvl-1: 0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.02);

/* Level 2: Food Card Elevation */
--shadow-lvl-2: 0 4px 12px -2px rgba(0, 0, 0, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.03);

/* Level 3: Floating Navigation & Sticky CTAs */
--shadow-lvl-3: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);

/* Level 4: Modal & Bottom Sheet Overlays */
--shadow-lvl-4: 0 20px 40px -10px rgba(0, 0, 0, 0.16);
```

---

## 2. COMPONENT DESIGN SPECIFICATIONS

### 2.1 Buttons

```text
Primary Action Button (e.g., "Order Now ->", "Continue ->", "Save Location")
- Height: 48px to 52px
- Background: Linear gradient (135deg, #E23744 0%, #D82F3C 100%)
- Border: None
- Border Radius: 9999px (Pill)
- Typography: 15px font-weight 700 letter-spacing -0.01em
- Interaction: Scale down to 0.98 on active tap; subtle glow on hover

Secondary Action Button (e.g., "Map View", "Satellite View")
- Height: 36px to 40px
- Background: #FFFFFF (inactive) / #E23744 (active)
- Border: 1px solid #E8E8E8 (inactive) / transparent (active)
- Typography: 13px font-weight 600

Ghost / Micro Buttons (e.g., Quantity Adjusters [-] 1 [+])
- Dimensions: 30px x 30px
- Background: #FFF1F2
- Border: 1px solid #FECDD3
- Border Radius: 8px
- Foreground: #E23744
```

---

### 2.2 Food-Commerce Cards

```text
Layout Architecture:
+-------------------------------------------------------------+
| Image Container (Aspect Ratio 16:9 / 180px height)           |
|  [ Rating: ★ 4.5 ]                 [ Status: ● Open ]        |
+-------------------------------------------------------------+
| Canteen / Item Title (Heading MD: 16px Bold)                |
| Cuisine Tags: North Indian, Chinese, Beverages (12px Muted) |
| Delivery / Prep Time: 15-20 mins                            |
+-------------------------------------------------------------+
| Offer Banner: % Flat Rs. 100 OFF Above Rs. 299              |
+-------------------------------------------------------------+
```

---

### 2.3 Navigation Specifications

#### Mobile Header
* Dimensions: 56px height, pure white surface with 1px bottom border.
* Left: "CharusatNeeds" brand text.
* Right: Notification Bell (44x44 tap target) + Cart shopping bag with crimson item badge.

#### Mobile Bottom Navigation
* Dimensions: 64px height with safe-area padding at bottom.
* 4 Tabs: Home | Offers | Orders | Profile.
* Active Tab: Crimson icon, bold caption, active red indicator dot below.
* Cart is explicitly excluded to eliminate dual-placement friction.

---

### 2.4 Modal & Bottom Sheet Architecture

* Responsive Behavior:
  - Mobile (< 768px): Bottom sheet drawer sliding up from the bottom with grab bar.
  - Tablet/Desktop (>= 768px): Centered modal dialog with backdrop blur.
* Progress Bar: Segmented 4px bar with crimson fill showing step completion.
* Actions: Sticky bottom container ensuring CTAs remain reachable on all screen sizes.

---

## 3. MOTION & MICRO-INTERACTION TOKENS

```css
--transition-fast:   150ms cubic-bezier(0.16, 1, 0.3, 1);
--transition-medium: 250ms cubic-bezier(0.16, 1, 0.3, 1);
--transition-spring: 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
```

* Reduced Motion: All keyframes fall back to instantaneous transitions when `prefers-reduced-motion: reduce` is detected.
