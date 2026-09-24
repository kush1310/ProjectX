# Charusat Needs — UI/UX Modernization Specification and Design System Contract

**Document Version:** 1.0.0  
**Target Design Paradigm:** Minimal + Modern + Material-Inspired + Tailwind Native  
**Scope:** Campus User/Student Flow, Vendor Operational Flow, Universal Design Tokens  

---

## 1. Core Design Principles

1. **Restraint and Intentionality:** Avoid extraneous decorative gradients, extreme glassmorphism, or high-contrast neon borders. Color must communicate semantic status (success, warning, error, info, active state) rather than serve as ambient decoration.
2. **Information Scannability:** Campus users operate in time-sensitive intervals between lectures. Key metrics (price, canteen location, prep time, order ID, pickup status) must be identifiable in under two seconds.
3. **Operational Clarity for Vendors:** The vendor interface is an operational terminal, not an advertising display. Incoming orders must be clearly presented with prominent, high-affordance action buttons (Accept -> Prepare -> Ready).
4. **Predictable Interaction and Focus Discipline:** All clickable interactive controls must feature explicit hover, focus-visible, active, and disabled states adhering to WCAG 2.2 AA contrast standards.

---

## 2. Design Token System

### 2.1 Color Tokens
```css
/* Surface and Background */
--bg-app: #FAFAFA;
--surface-canvas: #FFFFFF;
--surface-subtle: #F4F4F5;
--surface-muted: #E4E4E7;
--surface-dark: #18181B;

/* Brand & Semantic Accents */
--brand-primary: #DC2626;          /* Red 600 - Charusat Red */
--brand-primary-hover: #B91C1C;    /* Red 700 */
--brand-primary-subtle: #FEF2F2;   /* Red 50 */

--accent-green: #059669;           /* Pure Veg / Success status */
--accent-green-subtle: #ECFDF5;
--accent-amber: #D97706;           /* In-prep / Pending status */
--accent-amber-subtle: #FFFBEB;
--accent-blue: #2563EB;            /* Pick-up ready / Info */
--accent-blue-subtle: #EFF6FF;

/* Neutral Typography & Borders */
--text-primary: #09090B;           /* Zinc 950 */
--text-secondary: #52525B;         /* Zinc 600 */
--text-muted: #71717A;             /* Zinc 500 */
--text-disabled: #A1A1AA;          /* Zinc 400 */
--border-subtle: #E4E4E7;          /* Zinc 200 */
--border-focus: #18181B;           /* Zinc 900 */
```

### 2.2 Typography Hierarchy
* **Display / Hero Titles:** `Outfit`, sans-serif, 28px - 36px, Bold (font-weight: 700), line-height: 1.2
* **Section Headers (H1 / H2):** `Inter`, sans-serif, 20px - 24px, SemiBold (font-weight: 600)
* **Sub-headers & Card Titles (H3):** `Inter`, 15px - 16px, SemiBold (font-weight: 600)
* **Body Text:** `Inter`, 14px, Regular (font-weight: 400), line-height: 1.5
* **Metadata & Captions:** `Inter`, 12px, Medium (font-weight: 500), line-height: 1.4
* **Badges & Microcopy:** `Inter`, 11px, SemiBold (font-weight: 600), uppercase tracking

### 2.3 Spacing Scale
* `space-xs`: 4px (`0.25rem`)
* `space-sm`: 8px (`0.5rem`)
* `space-md`: 16px (`1rem`)
* `space-lg`: 24px (`1.5rem`)
* `space-xl`: 32px (`2rem`)
* `space-2xl`: 48px (`3rem`)

### 2.4 Elevation and Radius
* **Border Radii:**
  * Controls & Inputs: `rounded-lg` (8px)
  * Cards & Containers: `rounded-xl` (12px)
  * Modals & Drawers: `rounded-2xl` (16px)
  * Badges & Chips: `rounded-full` (9999px)
* **Elevation Shadows:**
  * Level 0 (Flat): `shadow-none border border-zinc-200`
  * Level 1 (Card): `shadow-sm hover:shadow-md transition-shadow`
  * Level 2 (Dropdown / Popover): `shadow-lg border border-zinc-200`
  * Level 3 (Modal / Dialog): `shadow-2xl`

---

## 3. Component Design Rules

### 3.1 Buttons
* **Primary Button:** Solid `bg-brand-primary text-white hover:bg-brand-primary-hover active:scale-[0.98]`.
* **Secondary Button:** Outlined `border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50`.
* **Tertiary / Ghost Button:** `text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900`.
* **Accessibility Rule:** Minimum touch target size of 44 x 44px on mobile viewports.

### 3.2 Forms and Inputs
* **Labels:** Always present above inputs. Never rely on placeholders as labels.
* **Helper / Error Text:** Rendered directly below the input field in 12px with explicit warning icons.
* **Focus Ring:** `focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent`.

### 3.3 Status Progression Badges
* `PENDING` -> Amber badge (`bg-amber-50 text-amber-700 border-amber-200`)
* `CONFIRMED` -> Blue badge (`bg-blue-50 text-blue-700 border-blue-200`)
* `PREPARING` -> Violet badge (`bg-purple-50 text-purple-700 border-purple-200`)
* `READY` -> Emerald badge (`bg-emerald-50 text-emerald-700 border-emerald-200`)
* `COMPLETED` -> Zinc subtle badge (`bg-zinc-100 text-zinc-700 border-zinc-200`)
* `CANCELLED` -> Red badge (`bg-red-50 text-red-700 border-red-200`)

---

## 4. Responsive Viewport Strategy

1. **Mobile (< 640px):**
   * Single-column layout.
   * Sticky top bar with logo, cart icon, and hamburger menu trigger.
   * Floating bottom action bar for checkout / cart summary.
   * Bottom sheet modals for filters and item options.
2. **Tablet (640px - 1024px):**
   * Two-column grid for food cards.
   * Condensed sidebar navigation.
3. **Desktop (> 1024px):**
   * Full sidebar for vendor terminal.
   * Three-column grid for canteen food catalogue.
   * Centered maximum-width container (`max-w-6xl` or `max-w-7xl`).
