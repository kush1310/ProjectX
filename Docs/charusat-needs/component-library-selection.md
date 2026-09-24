# CHARUSAT NEEDS — COMPONENT LIBRARY & ARCHITECTURE SELECTION
## Selective Architectural Pattern Adoption & Zero-Bloat Engineering

---

## 1. EVALUATION DIRECTIVE & PRINCIPLES

Per Section 35 and Section 36 of the specification, CharusatNeeds avoids adding bulky third-party dependencies or multi-megabyte component packages. Instead, we inspect top design patterns from the 50+ ecosystem and selectively reconstruct them using **Tailwind CSS primitives**, **Lucide Icons**, and **Framer Motion**.

---

## 2. EVALUATED PATTERN SOURCES & ARCHITECTURAL MAPPING

| Component Need | Reference Source Inspiration | Selected Architectural Pattern | Rationale & Bundle Impact |
|:---|:---|:---|:---|
| **Mobile Navigation & Header** | Zomato Mobile UX + Base CN | Custom Tailwind fixed bottom bar + sticky header | Zero dependencies. Pure semantic HTML with native CSS safe-area support. |
| **Card Geometry & Elevation** | Aceternity UI + shadcn/ui | Tailwind `rounded-3xl` + multi-stop gradient overlay | High-performance CSS GPU layers; zero JS runtime overhead. |
| **Mechanical Veg Mode Switch** | Origin UI / Kibo UI | Custom spring toggle with Lucide `Leaf` icon | Immediate tactile feedback; avoids bloated headless switch libraries. |
| **Pill Search & Filter Chips** | ReUI / Syntax UI | Horizontally scrollable flex container with active state pill | Fluid touch momentum with native scroll snap; minimal CSS footprint. |
| **Interactive Campus Map** | Leaflet + Mapbox aesthetics | Leaflet Map instance with custom SVG markers & view toggles | Reuses already bundled Leaflet 1.9; zero additional map bundle weight. |
| **Onboarding Modal & Sheet** | Radix UI dialog + MagicUI | Responsive bottom-sheet / centered dialog primitive | CSS media queries toggle between mobile drawer and desktop modal. |
| **Scheduled Order Selector** | Preline UI / Flowbite | Segmented pill selector (ASAP vs Schedule) with time slot bottom sheet | Native HTML5 time/date abstractions with custom styled radio tiles. |
| **Bill Summary & Steppers** | Tremor / Zomato Checkout | Dense pricing table with `[-] qty [+]` stepper controls | Clear financial breakdown; zero third-party form dependencies. |

---

## 3. ZERO-BLOAT COMPONENT AUDIT

* **Tailwind CSS:** 100% utility-first styles compiled at build time.
* **Icons:** Standardized strictly on `lucide-react` (zero duplicate icon packages).
* **Animations:** Lightweight `framer-motion` for spring transitions with `prefers-reduced-motion` compliance.
* **Modals & Drawers:** Custom Tailwind + Framer Motion primitives (no bulky Dialog packages needed).
