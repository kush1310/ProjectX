# CHARUSAT NEEDS — REFERENCE DESIGN ANALYSIS
## Forensic Visual System & UX Architecture Decomposition

---

## 1. EXECUTIVE SUMMARY & DESIGN NORTH STAR

This document establishes the architectural and visual translation of the primary reference image into the production CharusatNeeds design system. The reference image presents four critical mobile surfaces:
1. Home Screen (Redesigned) — High-density food-commerce discovery surface.
2. Role Selection (Step 1 of 2) — Modern onboarding card modal with campus illustration.
3. Hostel Selection with Map (Step 2 of 2) — Integrated interactive campus map with hostel chip grid.
4. Building & Department (Step 2 of 2) — Segmented campus building cards and department selector.

The target visual language is:
> **Minimal + Modern + Gen-Z + Premium Food-Commerce + Zomato-Inspired + Material-Inspired + Tailwind-Native + Subtle Glassmorphism + Restrained Neumorphism**

---

## 2. ATOMIC DECOMPOSITION OF REFERENCE SCREENS

### 2.1 Screen 1: Home Screen (Redesigned)

#### A. Mobile Header Architecture
* **Brand Wordmark:** Left-aligned text "CharusatNeeds" with heavy typographic contrast ("Charusat" in dark slate `#1C1C1C` and "Needs" in vibrant crimson `#E23744`).
* **Utility Actions:** Right-aligned icon cluster containing:
  - Notification bell with unread indicator dot.
  - Cart shopping bag icon with a high-contrast circular crimson badge showing current item count.
* **Bottom Navigation Contrast:** Cart is deliberately excluded from the bottom navigation and positioned exclusively in the top-right header, optimizing discovery ergonomics and thumb-flow.

#### B. Location & Dietary Filter Row
* **Location Selector:** Left-aligned red map pin marker paired with "CHARUSAT Campus" text and subtle chevron dropdown affordance.
* **Veg Mode Segment:** Right-aligned green toggle badge featuring a leaf icon, "VEG MODE" uppercase text, and a miniature mechanical pill switch with smooth green accent.

#### C. Search Bar Geometry
* **Form Geometry:** Pill-shaped (`rounded-full` / `rounded-2xl`) container with 1px soft border (`#E8E8E8`), subtle inner fill (`#F8F8F8`), and crisp focus glow.
* **Affordances:** Left search magnifying glass, centered placeholder text ("Search canteens or dishes..."), and right microphone icon for voice search.

#### D. Filter Chip Taxonomy
* **Scrolling Container:** Zero-scrollbar horizontal overflow strip.
* **Active State:** Solid dark fill (`#1C1C1C`), white text, bold font weight.
* **Inactive State:** White background, 1px neutral border (`#E8E8E8`), dark text, subtle hover response.
* **Chip Taxonomy:**
  - "All" (Active default)
  - "Canteens" (Store icon)
  - "Open Now" (Pulsing green status dot)
  - "Offers" (Orange promotional tag icon)
  - "Rating" (Yellow star icon)

#### E. Hero Promotional Card ("Deal of the Day")
* **Geometry:** Generous radius (`rounded-3xl` / 24px), gradient canvas transition from rich crimson (`#E23744`) to warm sunset amber (`#EA580C`) into dark charcoal.
* **Badging:** "DEAL OF THE DAY" badge with sparkle glyph in a translucent pill.
* **Brand & Content:** Upper label "HONEST RESTAURANT", prominent display typography "Thali Lover", value proposition "Flat Rs. 100 off on any Thali".
* **Call to Action:** Vibrant red rounded pill button ("Order Now ->") with directional affordance.
* **Asset Integration:** High-definition Indian Thali meal composition positioned at the right boundary, masked with organic depth.

#### F. Popular Canteens Card System
* **Section Header:** Bold title "Popular Canteens" accompanied by a red right-aligned anchor "See All ->".
* **Card Geometry:** Multi-attribute food-commerce cards featuring:
  - 16:9 rounded image viewport.
  - Floating dual badges: Star rating (e.g. 4.5) in warm amber, operational badge ("Open") in fresh emerald.
  - Primary title (e.g. "Honest Canteen"), cuisine taxonomy ("North Indian, Chinese"), and active discount tag ("Rs. 100 OFF Above Rs. 299").

#### G. Mobile Bottom Navigation
* **Tab Count:** Exactly 4 items (Cart is relocated to header):
  1. Home (Active state with crimson tint and micro dot below)
  2. Offers (Tag icon)
  3. Orders (Receipt / order list icon)
  4. Profile (User outline icon)
* **Surface Properties:** Fixed bottom anchor, pure white surface, 1px top border (`#E8E8E8`), safe-area inset support.

---

### 2.2 Screen 2: Role Selection (Step 1 of 2)

#### A. Progress & Modal Header
* **Progress Bar:** Red segmented progress bar indicating 50% completion (Step 1 of 2).
* **Navigation:** Left back chevron, centered "STEP 1 OF 2" tracking label, right circular close button (`X`).

#### B. Typographic Hierarchy
* **Title:** "Who are you?" in 26px bold grotesque typography.
* **Subtitle:** "Select your role at CHARUSAT" in medium muted slate.

#### C. Role Cards
* **Student Card:**
  - Left circular icon container with soft crimson tint (`#FFF1F2`) and red graduation cap.
  - Title "Student" with supporting description "I live in a hostel on campus".
  - Right circular chevron pill affordance (`>`).
  - Active selection state: 2px crimson outline (`#E23744`) and subtle ambient red glow.
* **Faculty Card:**
  - Left circular icon container with neutral tint (`#F1F5F9`) and briefcase icon.
  - Title "Faculty" with supporting description "I work in a department building".
  - Right circular chevron pill affordance (`>`).

#### D. Campus Gate Illustration
* **Artistic Composition:** Visual anchor at the base showing the CHARUSAT university campus entrance gate, lush trees, and architectural monument with "CHARUSAT" etched lettering.

#### E. Primary CTA
* **Button Specification:** Full-width 52px height pill button (`rounded-full`), solid crimson fill (`#E23744`), bold white typography, directional indicator ("Continue ->").

---

### 2.3 Screen 3: Hostel Selection with Map (Step 2 of 2)

#### A. Interactive Map Container
* **Framing:** 20px rounded card with 1px border and soft elevation.
* **Header Tag:** Red pin badge with title "CHARUSAT CAMPUS INTERACTIVE MAP / Click map pins or select from the list below".
* **Layer Controls:** Dual toggle buttons for "Map View" (active crimson pill) and "Satellite View" (neutral pill).
* **Map Surface:** Leaflet-powered canvas with zoom buttons (`+` / `-`), locate target control, campus landmark pins, and active popover overlay ("CSPIT Engineering Building / Faculty of Technology & Engineering").

#### B. Gender Segmentation
* **Pill Selector:** "Boys Hostel" (solid crimson with user icon) versus "Girls Hostel" (neutral surface with user icon).

#### C. Hostel Chip Grid
* **Layout:** 3-column responsive grid of rounded chips:
  - "Shreedeep" (Selected: crimson border, crimson font, soft crimson background).
  - "Nisarg", "Ohm", "Royal Care", "Sahajanand", "Prince", "Neelkanth", "Darshan", "Patel".

#### D. Room Number & Final Action
* **Input Field:** Clean input container for Room Number.
* **Button:** Full-width crimson pill button ("Continue ->" / "Save Location").

---

### 2.4 Screen 4: Building & Department (Step 2 of 2 for Faculty)

#### A. Building Grid (3x3)
* **Visual Geometry:** 9 uniform card blocks with building icon, uppercase institute code, and rounded corners:
  - CSPIT (Selected: crisp crimson border, crimson text, light crimson fill).
  - DEPSTAR, RPCP, CMPICA, IIM, PDPIAS, BDIPS, MTIN, ARIP.

#### B. Department Selection Chips
* **Chip Taxonomy:** Flexible wrap chips for academic departments:
  - "Computer Engineering" (Selected: crimson outline & background).
  - "Information Technology", "Electronics & Communication", "Mechanical Engineering", "Civil Engineering", "Electrical Engineering", "Pharmacy", "Management Studies", "Other".

#### C. Staff Room Input
* **Input Control:** Dedicated input container with room icon, placeholder "e.g., A-301".

#### D. Save Location CTA
* **Button:** Full-width crimson pill button with checkmark icon ("Save Location").

---

## 3. TRANSLATION MATRIX: CURRENT VS REFERENCE TARGET

| UI Domain | Current CharusatNeeds Implementation | Reference Target Implementation | Architectural Action |
|:---|:---|:---|:---|
| **Mobile Header** | Centered logo, inline search, hidden cart | Clean logo left, Notification + Cart badge right | Refactor ClientLayout header |
| **Bottom Navigation** | 5 items including duplicate Cart tab | 4 items: Home, Offers, Orders, Profile | Remove Cart tab; restyle active indicator |
| **Search Experience** | Standard box input with square corners | Modern pill input with search and mic icons | Modernize search input geometry |
| **Dietary Toggle** | Text link or basic checkbox | Branded "VEG MODE" badge with animated switch | Implement custom mechanical toggle |
| **Promotional Banner** | Static coupon cards or tall carousel | Panoramic Deal of the Day card with food asset | Redesign banner geometry and typography |
| **Canteen Cards** | Card grid with dense text | Food-commerce cards with rating and open badges | Refactor card architecture and tags |
| **Role Selection** | Modal dialog with generic radio buttons | Rich touch cards with campus gate illustration | Redesign AddressModal Step 1 |
| **Hostel Selection** | Dropdown select box | Interactive campus map + Boys/Girls pill + 3x3 chip grid | Integrate map and segmented grid |
| **Faculty Selection** | Multi-select form | 3x3 icon building grid + department chips | Implement visual tile selector |
| **Cart & Scheduling** | Immediate checkout button | Zomato bill breakdown + ASAP vs Scheduled sheet | Implement time slot bottom sheet |
| **Public Menu** | Gated behind login redirect | Publicly discoverable without authentication | Unprotect menu routes; gate checkout only |

---

## 4. CONCLUSION
This reference analysis defines the complete blueprint for the visual modernization of CharusatNeeds. Implementation proceeds systematically across global foundations, navigation, onboarding modals, discovery surfaces, and cart/checkout workflows.
