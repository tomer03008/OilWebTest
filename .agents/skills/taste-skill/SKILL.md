name: design-taste-frontend
description: Anti-slop frontend skill for landing pages, portfolios, and redesigns. The agent reads the brief, infers the right design direction, and ships interfaces that do not look templated. Real design systems when applicable, audit-first on redesigns, strict pre-flight check.
---

# tasteskill: Anti-Slop Frontend Skill

> Landing pages, portfolios, and redesigns. Not dashboards, not data tables, not multi-step product UI.
> Every rule below is **contextual**. None of it fires automatically. First read the brief, then pull only what fits.

---

## 0. BRIEF INFERENCE (Read the Room Before Anything Else)

Before touching code or tweaking dials, **infer what the user actually wants**. Most LLM design output is bad because the model jumps to a default aesthetic instead of reading the room.

### 0.A Read these signals first
1. **Page kind** - landing (SaaS / consumer / agency / event), portfolio (dev / designer / creative studio), redesign (preserve vs overhaul), editorial / blog.
2. **Vibe words** the user used - "minimalist", "calm", "Linear-style", "Awwwards", "brutalist", "premium consumer", "Apple-y", "playful", "serious B2B", "editorial", "agency-y", "glassy", "dark tech".
3. **Reference signals** - URLs they linked, screenshots they pasted, products they named, brands they're competing with.
4. **Audience** - B2B procurement panel vs. design-conscious consumer vs. recruiter scanning a portfolio. The audience picks the aesthetic, not your taste.
5. **Brand assets that already exist** - logo, color, type, photography. For redesigns, these are starting material, not optional input.
6. **Quiet constraints** - accessibility-first audiences, public-sector, regulated industries, trust-first commerce, kids' products. These constraints OVERRIDE aesthetic preference.

### 0.B Output a one-line "Design Read" before generating
Before any code, state in one line: **"Reading this as: \<page kind> for \<audience>, with a \<vibe> language, leaning toward \<design system or aesthetic family>."**

### 0.C If the brief is ambiguous, ask one question, do not guess
Ask exactly **one** clarifying question - never a multi-question dump - and only when the design read genuinely diverges. Example: *"Should this feel closer to Linear-clean or Awwwards-experimental?"*

If you can confidently infer from context, **do not ask**. Just declare the design read and proceed.

### 0.D Anti-Default Discipline
Do not default to: AI-purple gradients, centered hero over dark mesh, three equal feature cards, generic glassmorphism on everything, infinite-loop micro-animations everywhere, Inter + slate-900. These are the LLM defaults. Reach past them deliberately based on the design read.

---

## 1. THE THREE DIALS (Core Configuration)

After the design read, set three dials. Every layout, motion, and density decision below is gated by these.

* **`DESIGN_VARIANCE: 8`** - 1 = Perfect Symmetry, 10 = Artsy Chaos
* **`MOTION_INTENSITY: 6`** - 1 = Static, 10 = Cinematic / Physics
* **`VISUAL_DENSITY: 4`** - 1 = Art Gallery / Airy, 10 = Cockpit / Packed Data

**Baseline:** `8 / 6 / 4`. Use these unless the design read overrides them. Do not ask the user to edit this file - overrides happen conversationally.

### 1.A Dial Inference (design read → dial values)
| Signal | VARIANCE | MOTION | DENSITY |
|---|---|---|---|
| "minimalist / clean / calm / editorial / Linear-style" | 5-6 | 3-4 | 2-3 |
| "premium consumer / Apple-y / luxury / brand" | 7-8 | 5-7 | 3-4 |
| "playful / wild / Dribbble / Awwwards / experimental / agency" | 9-10 | 8-10 | 3-4 |
| "landing page / portfolio / marketing site (default)" | 7-9 | 6-8 | 3-5 |
| "trust-first / public-sector / regulated / accessibility-critical" | 3-4 | 2-3 | 4-5 |

### 1.B Use-Case Presets
| Use case | VARIANCE | MOTION | DENSITY |
|---|---|---|---|
| Landing (SaaS, mainstream) | 7 | 6 | 4 |
| Landing (Agency / creative) | 9 | 8 | 3 |
| Landing (Premium consumer) | 7 | 6 | 3 |
| Portfolio (Designer / studio) | 8 | 7 | 3 |
| Portfolio (Developer) | 6 | 5 | 4 |

### 1.C How the Dials Drive Output
Use these (or user-overridden values) as global variables. Cross-references throughout this document refer to these exact variable names - never invent aliases like `LAYOUT_VARIANCE` or `ANIM_LEVEL`.

---

## 2. BRIEF → DESIGN SYSTEM MAP

Once you have the design read (Section 0) and dials (Section 1), pick the right foundation. Do not invent CSS for things that have an official package. Do not pretend an aesthetic trend is an official system.

### 2.A When to reach for a real design system (use official packages)
- Fluent UI, Material Web, Carbon Design, Polaris, Primer, GOV.UK, USWDS, Radix, shadcn/ui.
- One system per project. Do not mix them.

### 2.B When the brief is an aesthetic, not a system
For these directions, there is **no single official package**. Build with native CSS + Tailwind + a maintained component library.
- Glassmorphism, Bento Grid, Brutalism, Editorial / magazine, Hacker/Terminal, Aurora gradients.
- **Apple Liquid Glass** - Apple documents this for Apple platforms only. Web implementations are approximations using `backdrop-filter` + layered borders + highlights.

---

## 3. DEFAULT ARCHITECTURE & CONVENTIONS

Unless the design read picks a real design system (Section 2.A), these are the defaults:

### 3.A Stack
* **Framework:** React or Next.js. Default to Server Components (RSC).
* **Styling:** **Tailwind v4** (default).
* **Animation:** **Motion** (the library formerly known as Framer Motion). Import from `motion/react` (`import { motion } from "motion/react"`).
* **Fonts:** Always use `next/font` (Next.js) or self-host with `@font-face` + `font-display: swap`.

### 3.B State
* Local `useState` / `useReducer` for isolated UI.
* **NEVER** use `useState` to track continuous values driven by user input. Use Motion's `useMotionValue` / `useTransform` / `useScroll`.

### 3.C Icons
* **Allowed libraries (priority order):** `@phosphor-icons/react`, `hugeicons-react`, `@radix-ui/react-icons`, `@tabler/icons-react`.
* **NEVER hand-roll SVG icons.**
* **One family per project.** Standardize `strokeWidth` globally.

### 3.D Emoji Policy
Discouraged by default in code, markup, and visible text. Replace symbols with icon-library glyphs.

### 3.E Responsiveness & Layout Mechanics
* Standardize breakpoints (`sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`).
* **Viewport Stability:** NEVER use `h-screen` for full-height Hero sections. ALWAYS use `min-h-[100dvh]` to prevent layout jumping on mobile.
* **Grid over Flex-Math:** ALWAYS use CSS Grid (`grid grid-cols-1 md:grid-cols-3 gap-6`).

---

## 4. DESIGN ENGINEERING DIRECTIVES (Bias Correction)

### 4.1 Typography
* **Display / Headlines:** Default `text-4xl md:text-6xl tracking-tighter leading-none`.
* **Body / Paragraphs:** Default `text-base text-gray-600 leading-relaxed max-w-[65ch]`.
* **Sans font choice:** Geist, Outfit, Cabinet Grotesk, Satoshi.
* **SERIF DISCIPLINE:** Serif is **very discouraged as the default font for any project.**
* **Italic Descender Clearance:** When italic is used in display type and contains a descender (`y g j p q`), use `leading-[1.1]` minimum.

### 4.2 Color Calibration
* Max 1 accent color. Saturation < 80% by default.
* **The Lila Rule:** The "AI Purple / Blue glow" is discouraged as a default.
* **Color Consistency Lock:** Once an accent color is chosen for a page, use it on the WHOLE page.
* **Premium-Consumer Palette Ban:** Banned background hexes like `#f5f1ea`, `#f7f5f1`, `#efeae0`, `#faf7f1` combined with brass accents `#b08947` / `#b6553a` / `#9a2436`. Rotate alternatives: Cold Luxury, Forest, Black & Tan, Cobalt + Cream, Terracotta + Slate, Olive + Brick + Paper.

### 4.3 Layout Diversification
* **Anti-Center Bias:** Centered Hero / H1 sections are avoided when `DESIGN_VARIANCE > 4`.

### 4.4 Materiality, Shadows, Cards
- Use cards only when elevation communicates real hierarchy.
- **Shape Consistency Lock:** Pick ONE corner-radius scale for the page and stick to it.

### 4.5 Interactive UI States
- **Tactile Feedback:** On `:active`, use `-translate-y-[1px]` or `scale-[0.98]`.
- **Button Contrast Check:** Verify contrast ratio WCAG AA min (4.5:1).
- **CTA Button Wrap Ban:** Button text must fit on one line at desktop.
- **No Duplicate CTA Intent:** One label per intent.

### 4.6 Data & Form Patterns
* Label ABOVE input. Helper text optional.

### 4.7 Layout Discipline
- **Hero must fit in the initial viewport.** Headline max 2 lines, subtext max 20 words, CTAs visible without scroll.
- **Hero Top Padding Cap:** Hero top padding max `pt-24` (≈6rem) at desktop.
- **Hero Stack Discipline:** Max 4 text elements (eyebrow, headline, subtext, CTAs).
- **Navigation on a single line.** Height cap: 80px max desktop.
- **Bento cell count rule:** A bento grid has EXACTLY as many cells as you have content for.
- **Section-Layout-Repetition Ban:** A landing page with 8 sections must use at least 4 different layout families.
- **Zigzag Alternation Cap:** Max 2 sections in a row with image+text split pattern.
- **Eyebrow Restraint:** Maximum 1 eyebrow per 3 sections.
- **Split-Header Ban:** Banned as default (headline left, paragraph right split header).
- **Bento Background Diversity:** At least 2-3 cells in any grid need real visual variation.
- **Mobile collapse must be explicit.**

### 4.8 Image & Visual Asset Strategy
- **Priority order for visual assets:** Image-generation tool first, Real web images second, placeholder slots as last resort.
- **Real company logos for social proof:** Use Simple Icons SVG logos.
- **Hand-rolled illustrations / Div-based fake screenshots are banned.**
- **Hero needs a real visual.**

### 4.9 Content Density
* **Default content shape per section:** short headline (≤ 8 words) + short sub-paragraph (≤ 25 words) + one visual asset OR one CTA.
* **No data-dump sections.**
* **Long lists need a different UI component.**
* **Spec sheets specifically:** Banned standard spec tables. Use 2-col card grid, scroll-snap horizontal pills, or grouped chunks.
