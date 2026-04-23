# MedCognito — Design System for Claude Code

> **How to use this file:** Copy into your project root as `DESIGN_SYSTEM.md` and reference it from `CLAUDE.md`. Before writing any UI component, Claude Code must read this file. It contains the complete token system, component rules, and code patterns for every MedCognito build.
>
> **Stack:** Next.js 14 · TypeScript · Tailwind CSS v3.4 · shadcn/ui (add if not present) · Lucide React · Framer Motion
>
> **Last updated:** April 2026 — warm neutral palette introduced; mc-nursing/mc-pharmacy removed as UI tokens; card system unified (neutral-first); track-specific shadows removed; component library expanded. See `../medcognito-design-skills/README.md` for full changelog and Cowork skill files.

---

## MANDATORY RULES — Read Before Writing Any UI

1. **Never use arbitrary Tailwind values** like `w-[437px]` or `text-[13px]`. Use only tokens defined in `tailwind.config.ts`.
2. **Every interactive element must have a hover, focus, and active state** — no bare buttons or links.
3. **Minimum touch target is 44px** on all clickable elements (`min-h-[44px]` or `py-2.5`).
4. **All text on colored backgrounds must pass WCAG AA** (4.5:1 contrast minimum).
5. **Use the `cn()` utility** (clsx + tailwind-merge) for all conditional class logic — never string concatenation.
6. **Typography only from the type scale** — never invent new font-size/weight combinations.
7. **Color only from design tokens** — never raw hex values in className strings.
8. **All user-facing strings must respect the MedCognito voice** — clear, warm, action-oriented. No jargon, no passive voice.
9. **Inputs must show error state below the field, not inline** — reduces cognitive load for stressed learners.
10. **Dark mode must be considered** for every component using the `dark:` prefix.
11. **All enter/exit animations use Framer Motion** — not CSS keyframes. Import variants from `lib/motion.ts`, never define inline springs or durations.
12. **Always wrap conditional renders with `AnimatePresence`** when exit animation matters (modals, toasts, drawers, conditional panels).
13. **Always call `useMotionTransition()`** instead of hardcoding a transition — it automatically respects `prefers-reduced-motion`.

---

## 1. Project Setup

### Install shadcn/ui (if not already present)
```bash
npx shadcn-ui@latest init
```
When prompted:
- Style: **Default**
- Base color: **Slate** (we override everything via tokens)
- CSS variables: **Yes**
- `tailwind.config.ts`: **Yes**
- `components/ui`: **Yes**
- `lib/utils.ts`: **Yes**

### Install Framer Motion
```bash
npm install framer-motion
```

### cn() Utility
```typescript
// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## 2. Design Tokens — tailwind.config.ts

This is the single source of truth for all visual values. Copy this exactly.

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    // ─── Base overrides (replace defaults, not extend) ───────────────
    borderRadius: {
      none:    "0",
      sm:      "4px",    // small inline elements (tags, chips)
      DEFAULT: "6px",    // inner elements: buttons, badges, icon wells
      md:      "8px",    // card surfaces — tighter, more engineered
      lg:      "10px",   // larger containers
      xl:      "12px",   // modals, drawers
      "2xl":   "16px",
      full:    "9999px", // pills, avatars
    },
    // Card radius rule: card surface = 8px (rounded-md), inner elements = 6px (rounded-DEFAULT)
    extend: {
      // ─── Color tokens ──────────────────────────────────────────────
      colors: {
        // --- Primitive brand palette ---
        "mc-ruby": {
          DEFAULT: "#9E0E27",
          hover:   "#7D0B1F",
          light:   "#FDF2F4",
          dark:    "#6B0918",
        },
        "mc-orange": {
          DEFAULT: "#FE7406",
          hover:   "#E56805",
          light:   "#FFF4EB",
          dark:    "#CC5C00",
        },
        // --- Warm stone neutral scale (replaces cool gray + track sub-brands) ---
        // Slight warm undertone (hue ~30°, sat 5-7%) — harmonises with ruby + orange.
        // NOTE: mc-neutral-500 (#87817A) = 3.83:1 on white — NOT safe for normal text.
        // Minimum for body/caption text: mc-neutral-600 (#625C56) = 6.58:1 ✓
        "mc-neutral": {
          50:  "#FAFAF9",   // near-white, hover tints
          100: "#F5F3F0",   // page background (replaces #F2F3F6)
          200: "#EAE7E2",   // borders, dividers, input outlines
          300: "#D5D0C9",   // subtle borders, disabled outlines
          400: "#ADA79F",   // placeholder icons, decorative only
          500: "#87817A",   // large text / icons only (3.83:1 — fails AA for normal text)
          600: "#625C56",   // muted-foreground, captions (6.58:1 ✓ AA)
          700: "#47423C",   // strong secondary text (10.4:1 ✓ AAA)
          800: "#2C2823",   // very dark, near-black surfaces
          900: "#1C1814",   // foreground / primary text (17.3:1 ✓ AAA)
        },
        // --- Semantic surface tokens (CSS var driven) ---
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT:    "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT:    "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        border:  "hsl(var(--border))",
        input:   "hsl(var(--input))",
        ring:    "hsl(var(--ring))",
      },

      // ─── Typography ────────────────────────────────────────────────
      fontFamily: {
        heading: ["Poppins", "system-ui", "sans-serif"],
        body:    ["Manrope", "system-ui", "sans-serif"],
        mono:    ["'Courier New'", "Courier", "monospace"],
      },
      fontSize: {
        // [size, { lineHeight, letterSpacing, fontWeight }]
        "display":  ["3.5rem",  { lineHeight: "1.1",   letterSpacing: "-0.03em" }],  // 56px
        "h1":       ["2.5rem",  { lineHeight: "1.15",  letterSpacing: "-0.025em" }], // 40px
        "h2":       ["2rem",    { lineHeight: "1.2",   letterSpacing: "-0.02em" }],  // 32px
        "h3":       ["1.5rem",  { lineHeight: "1.3",   letterSpacing: "-0.015em" }], // 24px
        "h4":       ["1.25rem", { lineHeight: "1.4",   letterSpacing: "-0.01em" }],  // 20px
        "h5":       ["1.125rem",{ lineHeight: "1.4",   letterSpacing: "-0.005em" }], // 18px
        "body-lg":  ["1.125rem",{ lineHeight: "1.7",   letterSpacing: "0" }],        // 18px
        "body":     ["1rem",    { lineHeight: "1.6",   letterSpacing: "0" }],        // 16px — base
        "body-sm":  ["0.9375rem",{lineHeight: "1.6",   letterSpacing: "0" }],        // 15px
        "label":    ["0.875rem",{ lineHeight: "1.5",   letterSpacing: "0.005em" }],  // 14px — form labels
        "caption":  ["0.8125rem",{lineHeight: "1.5",   letterSpacing: "0.01em" }],   // 13px
        "xs":       ["0.75rem", { lineHeight: "1.4",   letterSpacing: "0.02em" }],   // 12px — badges, tags
      },

      // ─── Spacing (8pt grid) ────────────────────────────────────────
      spacing: {
        // Extends Tailwind defaults — do not redefine 1-12
        "18":  "4.5rem",   // 72px
        "22":  "5.5rem",   // 88px
        "26":  "6.5rem",   // 104px
        "30":  "7.5rem",   // 120px
        "34":  "8.5rem",   // 136px
      },

      // ─── Shadows ───────────────────────────────────────────────────
      // Two-layer system: tight ambient layer + wide atmospheric layer.
      // Color-matched to track at low opacity — never neutral grey for track cards.
      // No borders on cards — shadow + page bg separation only.
      boxShadow: {
        // Neutral card shadows (default, elevated, stat)
        "card":           "0 2px 8px rgba(0,0,0,0.05), 0 12px 32px rgba(0,0,0,0.06)",
        "card-hover":     "0 4px 16px rgba(0,0,0,0.08), 0 20px 48px rgba(0,0,0,0.09)",
        "card-raised":    "0 4px 12px rgba(0,0,0,0.07), 0 20px 48px rgba(0,0,0,0.09)",
        "card-raised-hover":"0 8px 24px rgba(0,0,0,0.10), 0 28px 56px rgba(0,0,0,0.11)",

        // REMOVED: track-specific colored shadows (card-ruby, card-nursing, card-pharmacy, card-orange)
        // All card surfaces now use the neutral shadow system above.
        // Track identity is expressed through label text (MCCQE1, NCLEX-RN, PEBC), not shadow color.

        // Overlay / floating elements
        "dropdown": "0 8px 24px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
        "modal":    "0 24px 64px rgba(0,0,0,0.18), 0 8px 20px rgba(0,0,0,0.07)",

        // Focus rings
        "focus":        "0 0 0 3px rgba(158,14,39,0.20)",
        "focus-orange": "0 0 0 3px rgba(254,116,6,0.20)",

        // Inset — pressed states
        "inset-sm": "inset 0 1px 3px 0 rgba(0,0,0,0.06)",
      },

      // ─── Transitions ───────────────────────────────────────────────
      transitionTimingFunction: {
        "out-expo":   "cubic-bezier(0.16, 1, 0.3, 1)",   // Fast exit, slow land — feels natural
        "in-out-smooth": "cubic-bezier(0.4, 0, 0.2, 1)", // Google Material — buttery
        "spring":     "cubic-bezier(0.34, 1.20, 0.64, 1)", // Slight overshoot — feels alive
      },
      transitionDuration: {
        "75":  "75ms",   // Micro: tooltip appear, checkbox check
        "150": "150ms",  // Fast: hover color change
        "200": "200ms",  // Default: button press, focus ring
        "300": "300ms",  // Medium: drawer open, card expand
        "500": "500ms",  // Slow: page transitions, skeleton load
      },

      // ─── Border radius (extended from base overrides above) ────────
      borderRadius: {
        // shadcn/ui CSS var integration
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      // ─── Keyframes ─────────────────────────────────────────────────
      keyframes: {
        "fade-in": {
          "0%":   { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          "0%":   { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(4px)" },
        },
        "slide-in-right": {
          "0%":   { opacity: "0", transform: "translateX(16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          "0%":   { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "shimmer": {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.7" },
        },
      },
      animation: {
        "fade-in":       "fade-in 200ms ease-out-expo both",
        "fade-out":      "fade-out 150ms ease-in both",
        "slide-in-right":"slide-in-right 250ms ease-out-expo both",
        "scale-in":      "scale-in 200ms ease-spring both",
        "shimmer":       "shimmer 2s linear infinite",
        "pulse-subtle":  "pulse-subtle 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

---

## 3. CSS Variables — globals.css

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ─── Google Fonts ────────────────────────────────────────────────────── */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Manrope:wght@400;500;600&display=swap');

/* ─── MedCognito Design Tokens ───────────────────────────────────────── */
@layer base {
  :root {
    /* Surfaces — barely warm off-white page bg; pure white cards lift via shadow (no border needed) */
    --background:          36 11% 95%;           /* #F4F2EF — barely warm, whisper of warmth */
    --foreground:          25 12% 10%;           /* #1C1814 — warm near-black primary text */
    --card:                0 0% 100%;            /* #FFFFFF — cards sit above page bg */
    --card-foreground:     220 13% 13%;
    --popover:             0 0% 100%;
    --popover-foreground:  220 13% 13%;

    /* Brand primary — Ruby Red */
    --primary:             349 84% 33%;          /* #9E0E27 */
    --primary-foreground:  0 0% 100%;

    /* Secondary — barely warm neutral */
    --secondary:           36 11% 95%;           /* #F4F2EF — matches page bg */
    --secondary-foreground:25 9% 26%;            /* #47423C — mc-neutral-700 */

    /* Muted */
    --muted:               36 11% 95%;           /* #F4F2EF */
    --muted-foreground:    25 6% 36%;            /* #625C56 — mc-neutral-600 (6.58:1 ✓ AA) */

    /* Accent — Philippine Orange */
    --accent:              27 99% 51%;           /* #FE7406 */
    --accent-foreground:   0 0% 100%;

    /* Feedback */
    --destructive:         0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --success:             141 71% 33%;          /* #2E7D32 — Nursing green */
    --success-foreground:  0 0% 100%;
    --warning:             38 92% 50%;
    --warning-foreground:  0 0% 100%;

    /* Structure */
    --border:              30 8% 90%;            /* #EAE7E2 — warm neutral-200 */
    --input:               30 8% 90%;
    --ring:                349 84% 33%;          /* focus ring = ruby always */

    /* Layout */
    --radius:              10px;

    /* Sidebar (dashboard) */
    --sidebar-width:       256px;
    --sidebar-collapsed:   64px;
    --header-height:       64px;
    --content-max-width:   1280px;
  }

  .dark {
    --background:          222 20% 8%;           /* #0F1117 */
    --foreground:          210 20% 94%;          /* #ECEEF2 */
    --card:                222 20% 11%;          /* #161923 */
    --card-foreground:     210 20% 94%;
    --popover:             222 20% 11%;
    --popover-foreground:  210 20% 94%;

    --primary:             349 84% 45%;          /* Brighter ruby for dark bg */
    --primary-foreground:  0 0% 100%;
    --secondary:           222 20% 16%;
    --secondary-foreground:210 20% 80%;
    --muted:               222 20% 16%;
    --muted-foreground:    220 9% 58%;

    --accent:              27 99% 55%;           /* Slightly brighter orange */
    --accent-foreground:   0 0% 100%;

    --destructive:         0 72% 55%;
    --destructive-foreground: 0 0% 100%;
    --success:             141 60% 42%;
    --success-foreground:  0 0% 100%;
    --warning:             38 80% 55%;
    --warning-foreground:  0 0% 100%;

    --border:              222 20% 20%;
    --input:               222 20% 20%;
    --ring:                349 84% 55%;
  }
}

/* ─── Base styles ────────────────────────────────────────────────────── */
@layer base {
  * {
    @apply border-border;
  }

  html {
    @apply antialiased;
    font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    @apply bg-background text-foreground font-body text-body;
    min-height: 100dvh;
  }

  /* Typography defaults */
  h1, h2, h3, h4, h5, h6 {
    @apply font-heading font-bold text-foreground;
  }

  h1 { @apply text-h1; }
  h2 { @apply text-h2; }
  h3 { @apply text-h3; }
  h4 { @apply text-h4; }
  h5 { @apply text-h5; }

  p {
    @apply text-body text-foreground leading-relaxed;
  }

  /* Focus ring — always visible, never ugly */
  *:focus-visible {
    @apply outline-none ring-2 ring-ring ring-offset-2 ring-offset-background;
  }

  /* Scrollbar — webkit */
  ::-webkit-scrollbar       { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { @apply bg-transparent; }
  ::-webkit-scrollbar-thumb { @apply bg-border rounded-full; }
  ::-webkit-scrollbar-thumb:hover { @apply bg-muted-foreground/40; }
}

/* ─── Component layer ────────────────────────────────────────────────── */
@layer components {

  /* Page wrapper */
  .page-container {
    @apply mx-auto w-full max-w-[var(--content-max-width)] px-4 sm:px-6 lg:px-8;
  }

  /* Section spacing */
  .section { @apply py-12 sm:py-16 lg:py-24; }
  .section-sm { @apply py-8 sm:py-12; }

  /* Skeleton loader */
  .skeleton {
    @apply animate-shimmer rounded bg-gradient-to-r from-muted via-muted/60 to-muted;
    background-size: 200% 100%;
  }
}
```

---

## 4. Typography Rules

**Font assignments — never deviate:**

| Element | Font | Weight | Tailwind Class |
|---|---|---|---|
| Display hero | Poppins | 700 Bold | `font-heading font-bold text-display` |
| H1 | Poppins | 700 Bold | `font-heading font-bold text-h1` |
| H2 | Poppins | 700 Bold | `font-heading font-bold text-h2` |
| H3 | Poppins | 600 SemiBold | `font-heading font-semibold text-h3` |
| H4, H5 | Poppins | 600 SemiBold | `font-heading font-semibold text-h4` |
| Body (default) | Manrope | 400 Regular | `font-body text-body` |
| Body large | Manrope | 400 Regular | `font-body text-body-lg` |
| Labels / form | Manrope | 500 Medium | `font-body font-medium text-label` |
| Captions / meta | Manrope | 400 Regular | `font-body text-caption text-muted-foreground` |
| Badge / tag | Manrope | 600 SemiBold | `font-body font-semibold text-xs uppercase tracking-wide` |

**Letter-spacing is baked into the type scale** — do not add extra `tracking-*` classes to headings.

---

## 5. Color Usage Rules

| Token | Use | Never use for |
|---|---|---|
| `mc-ruby` | Primary CTAs, nav active, progress fills, key numbers | Body text (too low contrast on white) |
| `mc-orange` | Secondary CTAs, highlights, success micro-moments, accents | Primary backgrounds |
| `mc-nursing` | Nursing track badges, progress, icons, borders | General UI elements |
| `mc-pharmacy` | Pharmacy track badges, progress, icons, borders | General UI elements |
| `muted-foreground` | Helper text, placeholders, metadata, timestamps | Headings or primary content |
| `destructive` | Error states, delete confirmations | Warning or info states |
| `success` | Correct answers, completions, passed states | Nursing-specific colour (use `mc-nursing`) |

**On dark backgrounds** (ruby red, navy, dark surfaces): use `text-white` or `text-primary-foreground`, never raw color tokens.

---

## 6. Component Patterns

### Button

```tsx
// components/ui/button.tsx — extend or replace shadcn default
import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:   "bg-mc-ruby text-white hover:bg-mc-ruby-hover active:bg-mc-ruby-dark shadow-sm hover:shadow-card",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
  ghost:     "text-foreground hover:bg-secondary hover:text-foreground",
  danger:    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  outline:   "border border-mc-ruby text-mc-ruby bg-transparent hover:bg-mc-ruby-light",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm:   "h-8 px-3 text-label rounded-sm gap-1.5",
  md:   "h-11 px-5 text-body rounded gap-2",      // 44px — accessible touch target
  lg:   "h-13 px-7 text-body-lg rounded-md gap-2.5",
  icon: "h-11 w-11 rounded",                       // square icon-only button
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        // Base
        "inline-flex items-center justify-center font-heading font-semibold",
        "transition-all duration-150 ease-in-out-smooth",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "select-none whitespace-nowrap",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : children}
    </button>
  )
);
Button.displayName = "Button";
```

---

### Card

**Version 3 — April 2026**

Cards use shadow-only elevation. No border on any card surface — separation comes from the two-layer ambient shadow against the warm page background (`#F5F3F0`). All card surfaces are white (`bg-card`). Color appears in exactly three places: the 2px top accent stripe, progress bars, and CTA buttons. Everything else uses neutral tokens.

**Design rules (mandatory):**
- Never add a border to a card surface — use `outlined` variant only when a boundary is semantically required
- No tinted card backgrounds — all cards are white regardless of track content
- Icon wells are always neutral (`bg-secondary/70`) — no colored icon backgrounds
- Card title always uses `text-foreground` — never a brand color
- Track identity expressed through label text only (MCCQE1, NCLEX-RN, PEBC) — not color
- All cards use neutral shadows (`shadow-card` / `shadow-card-hover`) — no track-specific colored shadows
- Hover lift is `translateY(-2px)` + shadow intensification — never color change
- Card radius is `rounded-md` (8px) — inner elements use `rounded-DEFAULT` (6px)

**Card variants:**

| Variant | Use | Shadow |
|---|---|---|
| `default` | Standard card, dashboard panels, stat cards | `shadow-card` |
| `elevated` | Featured or primary content | `shadow-card-raised` |
| `surface` | Nested content inside a parent card | No shadow, tinted bg |
| `outlined` | Hard boundary needed (tables, code, forms) | No shadow, border |
| `ghost` | Transparent grouping, zero visual weight | None |

**Accent stripes (the only color on a card surface):**

| Accent | Stripe token | Use |
|---|---|---|
| `ruby` | `before:bg-primary` → `#9E0E27` | Primary content, all track modules |
| `orange` | `before:bg-accent` → `#FE7406` | Featured content, daily challenge |
| none | (no stripe) | Neutral/utility panels |

All cards use `shadow-card` / `shadow-card-hover` regardless of accent. Track-specific colored shadows are removed.

**Contrast-safe text on all card surfaces (white bg):**

| Context | Token | Hex | Ratio |
|---|---|---|---|
| Card title | `text-foreground` | `#1C1814` | 18.2:1 ✓ AAA |
| Progress % | `text-primary` | `#9E0E27` | 8.3:1 ✓ AAA |
| Metadata / captions | `text-muted-foreground` | `#625C56` | 6.58:1 ✓ AA |
| Track label pill | `text-muted-foreground` | `#625C56` | 6.58:1 ✓ AA |
| CTA button label | `text-primary-foreground` | `#FFFFFF` on `#9E0E27` | 8.3:1 ✓ AAA |

```tsx
// components/ui/med-card.tsx
"use client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { springSmooth } from "@/lib/motion";

type CardVariant = "default" | "elevated" | "surface" | "outlined" | "ghost";
type CardAccent  = "ruby" | "orange" | "nursing" | "pharmacy";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: CardVariant;
  accent?: CardAccent;   // 2px top stripe + track-matched ambient shadow
  hoverable?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

const variantBase: Record<CardVariant, string> = {
  default:  "bg-card shadow-card",
  elevated: "bg-card shadow-card-raised",
  surface:  "bg-secondary/50",
  outlined: "bg-card border border-border",
  ghost:    "bg-transparent",
};

const hoverShadow: Record<CardVariant, string> = {
  default:  "hover:shadow-card-hover",
  elevated: "hover:shadow-card-raised-hover",
  surface:  "",
  outlined: "",
  ghost:    "",
};

// Track-matched ambient shadow (overrides default shadow on hover)
const trackShadow: Record<CardAccent, { base: string; hover: string }> = {
  ruby:     { base: "shadow-card-ruby",     hover: "hover:shadow-card-ruby-hover" },
  nursing:  { base: "shadow-card-nursing",  hover: "hover:shadow-card-nursing-hover" },
  pharmacy: { base: "shadow-card-pharmacy", hover: "hover:shadow-card-pharmacy-hover" },
  orange:   { base: "shadow-card",          hover: "hover:shadow-card-hover" },
};

// Accent stripe colors
const accentStripe: Record<CardAccent, string> = {
  ruby:     "before:bg-mc-ruby",
  orange:   "before:bg-mc-orange",
  nursing:  "before:bg-mc-nursing",
  pharmacy: "before:bg-mc-pharmacy",
};

export function MedCard({
  children, className, variant = "default",
  accent, hoverable, clickable, onClick,
}: CardProps) {
  const isInteractive = hoverable || clickable || !!onClick;
  const shadow = accent ? trackShadow[accent] : null;

  return (
    <motion.div
      onClick={onClick}
      whileHover={isInteractive ? { y: -2 } : undefined}
      whileTap={clickable ? { scale: 0.99 } : undefined}
      transition={springSmooth}
      className={cn(
        // Base
        "relative rounded-md text-card-foreground overflow-hidden",   // rounded-md = 8px
        "transition-shadow duration-200 ease-out-expo",
        // Variant (overridden by accent shadow if present)
        shadow ? [shadow.base, isInteractive && shadow.hover] : [variantBase[variant], isInteractive && hoverShadow[variant]],
        // 2px top accent stripe
        accent && [
          "before:absolute before:inset-x-0 before:top-0 before:h-[2px]",
          accentStripe[accent],
        ],
        isInteractive && "cursor-pointer",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("px-5 pt-5 pb-3", className)}>{children}</div>;
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("px-5 pb-5 pt-3 border-t border-border/40 flex items-center gap-3", className)}>
      {children}
    </div>
  );
}

// ─── Track card — 5-slot hierarchy ───────────────────────────────
// Slot order is MANDATORY. Never reorder or add elements between slots.
// Slot 1: Identity  — icon well (neutral) + track label (top-right, 10px)
// Slot 2: Subject   — title (foreground, dominant)
// Slot 3: Status    — progress % (track color) + bar
// Slot 4: Detail    — metadata (contrast-safe fixed hex, below progress)
// Slot 5: Action    — CTA button (anchors base, full width)

// All tracks now use unified neutral tokens — identity via label text, not color.
// accentColor: ruby primary for all tracks; orange for daily/featured only.
// metaColor: muted-foreground (#625C56) for all tracks — 6.58:1 ✓ AA on white.
const trackConfig: Record<CardAccent, {
  label: string;
  accentColor: string;
  metaColor: string;
  ctaBg: string;
}> = {
  ruby:     { label: "MCCQE1",  accentColor: "#9E0E27", metaColor: "#625C56", ctaBg: "#9E0E27" },
  nursing:  { label: "NCLEX-RN",accentColor: "#9E0E27", metaColor: "#625C56", ctaBg: "#9E0E27" },
  pharmacy: { label: "PEBC",    accentColor: "#9E0E27", metaColor: "#625C56", ctaBg: "#9E0E27" },
  orange:   { label: "Daily",   accentColor: "#FE7406", metaColor: "#625C56", ctaBg: "#CC5C00" },
  // Note: orange ctaBg uses mc-orange-dark (#CC5C00) for WCAG AA compliance at 13px label size
};

interface TrackCardProps {
  track: CardAccent;
  title: string;
  subtitle?: string;
  progress: number;          // 0-100
  questionCount: number;
  timeLabel: string;
  status: "Start" | "Continue" | "Resume" | "Review";
  onClick?: () => void;
}

export function TrackCard({ track, title, subtitle, progress, questionCount, timeLabel, status, onClick }: TrackCardProps) {
  const cfg = trackConfig[track];

  return (
    <MedCard accent={track} hoverable clickable onClick={onClick}>
      {/* Slot 1 — Identity */}
      <div className="px-5 pt-5 flex items-start justify-between">
        {/* Icon well — neutral grey, never track color */}
        <div className="h-9 w-9 rounded-DEFAULT bg-secondary/70 flex items-center justify-center flex-shrink-0">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </div>
        {/* Track label — 10px, top-right, subdued */}
        <span className="font-body font-semibold text-xs uppercase tracking-wide"
              style={{ color: cfg.accentColor, background: cfg.accentColor + "14",
                       padding: "2px 8px", borderRadius: "999px", lineHeight: "1.6" }}>
          {cfg.label}
        </span>
      </div>

      {/* Slot 2 — Subject */}
      <div className="px-5 pt-3">
        <p className="font-heading font-semibold text-h5 text-foreground leading-snug">{title}</p>
        {subtitle && <p className="mt-1 font-body text-caption text-muted-foreground">{subtitle}</p>}
      </div>

      {/* Slot 3 — Status */}
      <div className="px-5 pt-4">
        <div className="flex items-baseline gap-1.5 mb-2">
          <span className="font-body font-semibold text-h4 leading-none" style={{ color: cfg.accentColor }}>
            {progress}%
          </span>
          <span className="font-body text-caption text-muted-foreground">complete</span>
        </div>
        <ProgressBar value={progress} variant={track} size="sm" />
      </div>

      {/* Slot 4 — Detail */}
      <div className="px-5 pt-2.5 flex gap-4">
        <span className="font-body text-xs flex items-center gap-1" style={{ color: cfg.metaColor }}>
          <Target className="h-3 w-3" /> {questionCount} questions
        </span>
        <span className="font-body text-xs flex items-center gap-1" style={{ color: cfg.metaColor }}>
          <Clock className="h-3 w-3" /> {timeLabel}
        </span>
      </div>

      {/* Slot 5 — Action */}
      <div className="px-5 pb-5 pt-3.5">
        <button
          className="w-full h-9 rounded-DEFAULT font-body font-semibold text-label text-white flex items-center justify-center gap-1.5 transition-all duration-150 hover:brightness-90"
          style={{ background: cfg.ctaBg }}
        >
          {status} <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </MedCard>
  );
}

// ─── Stat card ────────────────────────────────────────────────────
// Neutral icon well, foreground value, change indicator.
// Accent stripe provides track identity — no other color in the card.

interface StatCardProps {
  label: string;
  value: string | number;
  change: string;
  positive: boolean;
  accent?: CardAccent;
}

export function StatCard({ label, value, change, positive, accent }: StatCardProps) {
  return (
    <MedCard variant="default" accent={accent} hoverable>
      <CardBody>
        <div className="flex items-start justify-between mb-2.5">
          <span className="font-body text-caption text-muted-foreground">{label}</span>
          {/* Neutral icon well — no track color */}
          <div className="h-7 w-7 rounded-DEFAULT bg-secondary/70 flex items-center justify-center">
            <BarChart2 className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </div>
        <p className="font-heading font-bold text-h3 text-foreground">{value}</p>
        <p className={cn("mt-1 font-body text-caption font-medium flex items-center gap-1",
          positive ? "text-success" : "text-destructive")}>
          {positive ? "↑" : "↓"} {change}
        </p>
      </CardBody>
    </MedCard>
  );
}
```

**Usage:**
```tsx
// Default
<MedCard>content</MedCard>

// Track card — 5-slot hierarchy, accent stripe + ambient shadow
<TrackCard track="nursing" title="Pharmacology" subtitle="NCLEX-RN · Core review"
  progress={81} questionCount={96} timeLabel="~20 min left" status="Continue" />

// Stat
<StatCard label="Questions Answered" value="142" change="12 today" positive accent="ruby" />

// Elevated
<MedCard variant="elevated">featured content</MedCard>

// Nested surface (inside a parent card)
<MedCard variant="surface">inner content</MedCard>

// Explicit boundary needed
<MedCard variant="outlined">table or code</MedCard>
```

---

### Input + Form Field

```tsx
// components/ui/form-field.tsx
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  id: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FormField({ label, id, error, hint, required, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-body font-medium text-label text-foreground">
        {label}
        {required && <span className="ml-0.5 text-mc-ruby" aria-hidden>*</span>}
      </label>
      {children}
      {/* Error below field — never inline (reduces cognitive load) */}
      {error && (
        <p role="alert" className="text-caption text-destructive flex items-center gap-1">
          <span aria-hidden>⚠</span> {error}
        </p>
      )}
      {!error && hint && (
        <p className="text-caption text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

// Input
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function Input({ error, className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full rounded font-body text-body text-foreground",
        "h-11 px-4",                           // 44px height — accessible
        "bg-background border border-input",
        "placeholder:text-muted-foreground",
        "transition-colors duration-150",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
        "disabled:cursor-not-allowed disabled:opacity-50",
        error && "border-destructive focus:ring-destructive",
        className
      )}
      {...props}
    />
  );
}

// Textarea
export function Textarea({ error, className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }) {
  return (
    <textarea
      className={cn(
        "w-full rounded font-body text-body text-foreground",
        "min-h-[120px] px-4 py-3 resize-y",
        "bg-background border border-input",
        "placeholder:text-muted-foreground",
        "transition-colors duration-150",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
        "disabled:cursor-not-allowed disabled:opacity-50",
        error && "border-destructive focus:ring-destructive",
        className
      )}
      {...props}
    />
  );
}
```

---

### Badge / Tag

```tsx
// components/ui/badge.tsx
import { cn } from "@/lib/utils";

// mc-nursing and mc-pharmacy badge variants removed — track identity is now text-label only.
// Use "primary" for all brand/track badges; "accent" for featured/daily content.
type BadgeVariant = "default" | "primary" | "accent" | "success" | "warning" | "destructive" | "outline";

const badgeVariants: Record<BadgeVariant, string> = {
  default:      "bg-secondary text-secondary-foreground",
  primary:      "bg-mc-ruby-light text-mc-ruby",          // ruby — all track labels
  accent:       "bg-mc-orange-light text-mc-orange-dark", // orange — featured/daily
  success:      "bg-success/10 text-success",
  warning:      "bg-warning/10 text-warning",
  destructive:  "bg-destructive/10 text-destructive",
  outline:      "border border-border text-foreground bg-transparent",
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1",
        "px-2.5 py-0.5 rounded-full",
        "font-body font-semibold text-xs uppercase tracking-wide",
        "whitespace-nowrap",
        badgeVariants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
```

---

### Progress Bar

```tsx
// components/ui/progress-bar.tsx
import { cn } from "@/lib/utils";

// mc-nursing and mc-pharmacy fill variants removed.
// All track progress bars use "primary" (ruby). Use "accent" for orange/featured contexts.
interface ProgressBarProps {
  value: number;              // 0-100
  variant?: "primary" | "accent" | "success";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const trackHeight = { sm: "h-1.5", md: "h-2.5", lg: "h-4" };
const fillColor = {
  primary: "bg-primary",   // ruby — all track modules
  accent:  "bg-accent",    // orange — daily/featured
  success: "bg-success",
};

export function ProgressBar({ value, variant = "ruby", size = "md", showLabel, label, className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("w-full", className)}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-body text-caption text-muted-foreground">{label}</span>
          {showLabel && <span className="font-body font-medium text-caption text-foreground">{clamped}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn("w-full rounded-full bg-secondary overflow-hidden", trackHeight[size])}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out-expo",
            fillColor[variant]
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
```

---

### Toast / Notification

```tsx
// components/ui/toast.tsx
// Use this pattern — not the default shadcn toast which can feel generic

import { cn } from "@/lib/utils";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

const toastConfig: Record<ToastType, { icon: typeof CheckCircle; classes: string }> = {
  success: { icon: CheckCircle, classes: "border-success/20 bg-success/5 text-success" },
  error:   { icon: AlertCircle, classes: "border-destructive/20 bg-destructive/5 text-destructive" },
  info:    { icon: Info,        classes: "border-mc-ruby/20 bg-mc-ruby-light text-mc-ruby" },
  warning: { icon: AlertCircle, classes: "border-warning/20 bg-warning/5 text-warning" },
};

interface ToastProps {
  type?: ToastType;
  title: string;
  description?: string;
  onClose?: () => void;
}

export function Toast({ type = "info", title, description, onClose }: ToastProps) {
  const { icon: Icon, classes } = toastConfig[type];

  return (
    <div className={cn(
      "flex items-start gap-3 w-full max-w-sm",
      "rounded-lg border p-4 shadow-dropdown",
      "animate-slide-in-right",
      classes
    )}>
      <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-heading font-semibold text-label">{title}</p>
        {description && <p className="mt-0.5 text-caption opacity-90">{description}</p>}
      </div>
      {onClose && (
        <button onClick={onClose} className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
```

---

### Skeleton Loader

```tsx
// components/ui/skeleton.tsx
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded bg-muted",
        className
      )}
    />
  );
}

// Pre-built skeleton patterns for common MedCognito UI
export function CardSkeleton() {
  return (
    <div className="rounded-DEFAULT border border-border p-6 space-y-4">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function QuestionSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 w-full rounded-DEFAULT" />
      {[1,2,3,4].map(i => (
        <Skeleton key={i} className="h-14 w-full rounded" />
      ))}
    </div>
  );
}
```

---

## 7. Layout Patterns

### Dashboard Shell

```tsx
// app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-background">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-[var(--sidebar-width)] border-r border-border bg-card flex flex-col">
        {/* Logo */}
        <div className="flex h-[var(--header-height)] items-center px-6 border-b border-border flex-shrink-0">
          {/* <Logo variant="light" /> */}
        </div>
        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {/* NavItem components */}
        </nav>
        {/* User footer */}
        <div className="border-t border-border p-4 flex-shrink-0">
          {/* UserMenu */}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 pl-[var(--sidebar-width)] flex flex-col min-h-dvh">
        {/* Top header */}
        <header className="sticky top-0 z-40 h-[var(--header-height)] border-b border-border bg-background/80 backdrop-blur-sm flex items-center px-6">
          {/* Breadcrumb, actions */}
        </header>
        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-[var(--content-max-width)]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
```

### Page Header

```tsx
interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumb?: React.ReactNode;
}

export function PageHeader({ title, description, action, breadcrumb }: PageHeaderProps) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4">
      <div className="min-w-0">
        {breadcrumb && <div className="mb-2">{breadcrumb}</div>}
        <h1 className="font-heading font-bold text-h2 text-foreground truncate">{title}</h1>
        {description && (
          <p className="mt-1.5 text-body text-muted-foreground max-w-2xl">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
```

---

## 8. Animation Guidelines

Animation is split across two layers — **CSS transitions** (Tailwind) for micro-interactions, and **Framer Motion** for anything involving enter/exit, layout changes, or orchestrated sequences. Never use raw CSS keyframes for complex motion — use Framer Motion instead.

---

### 8a. When to Use What

| Scenario | Use | Why |
|---|---|---|
| Button hover lift, color change | CSS (`transition-all`) | Lightweight, no JS needed |
| Input focus ring | CSS (`transition-colors`) | Instant, GPU-accelerated |
| Card hover shadow + lift | CSS (`transition-all`) | No exit state needed |
| Element entering the DOM | Framer Motion `motion.*` | CSS can't animate mount |
| Element leaving the DOM | Framer Motion `AnimatePresence` | CSS can't animate unmount |
| Modal / drawer open & close | Framer Motion `AnimatePresence` | Needs exit animation |
| List items staggering in | Framer Motion `staggerChildren` | Orchestration not possible in CSS |
| Shared layout (card → fullscreen) | Framer Motion `layoutId` | Only Framer can do this |
| Question answer feedback reveal | Framer Motion | Spring feels alive, not robotic |
| Page transitions | Framer Motion `AnimatePresence` | Smooth route changes |
| Skeleton shimmer | CSS (`animate-shimmer`) | Pure visual, no state |
| Progress bar fill | CSS (`transition-all duration-500`) | Simple width change |

---

### 8b. Spring Configs

**Define springs once and reuse them — never inline custom values:**

```typescript
// lib/motion.ts — import from here everywhere
import type { Transition } from "framer-motion";

// ─── Spring presets ────────────────────────────────────────────
// Snappy: UI feedback, button presses, toggles
export const springSnappy: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 0.8,
};

// Smooth: cards entering, modals, drawers
export const springSmooth: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 28,
  mass: 1,
};

// Bouncy: celebrations, correct answer reveals, achievements
export const springBouncy: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 18,
  mass: 0.9,
};

// Gentle: page sections, large layout shifts
export const springGentle: Transition = {
  type: "spring",
  stiffness: 180,
  damping: 24,
  mass: 1.2,
};

// ─── Tween presets (for opacity, color — springs don't apply) ──
export const tweenFast: Transition   = { type: "tween", duration: 0.15, ease: [0.16, 1, 0.3, 1] };
export const tweenSmooth: Transition = { type: "tween", duration: 0.25, ease: [0.16, 1, 0.3, 1] };
export const tweenSlow: Transition   = { type: "tween", duration: 0.4,  ease: [0.16, 1, 0.3, 1] };

// ─── Reduced motion fallback ───────────────────────────────────
// Use this as the transition whenever useReducedMotion() returns true
export const instantTransition: Transition = { duration: 0 };
```

---

### 8c. Shared Variants

**Reusable animation variants — import and apply, never redefine inline:**

```typescript
// lib/motion.ts (continued)
import type { Variants } from "framer-motion";

// Fade up — default entrance for cards, sections, content blocks
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springSmooth,
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: tweenFast,
  },
};

// Scale in — modals, dialogs, popovers
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springSnappy,
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    transition: tweenFast,
  },
};

// Slide in from right — drawers, side panels, detail views
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 32 },
  visible: {
    opacity: 1,
    x: 0,
    transition: springSmooth,
  },
  exit: {
    opacity: 0,
    x: 24,
    transition: tweenFast,
  },
};

// Slide up — bottom sheets, mobile drawers
export const slideUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springSmooth,
  },
  exit: {
    opacity: 0,
    y: 16,
    transition: tweenFast,
  },
};

// Container for staggered children
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,   // 60ms between each child — fast enough to not feel slow
      delayChildren: 0.05,
    },
  },
};

// Child item for stagger lists
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springSnappy,
  },
};

// Answer option — exam questions
export const answerOption: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: springSnappy,
  },
};

// Correct answer reveal — bouncy, celebratory
export const correctReveal: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springBouncy,
  },
};
```

---

### 8d. AnimatePresence — Always Wrap Exit Animations

```tsx
// ─── Modal ───────────────────────────────────────────────────────
"use client";
import { AnimatePresence, motion } from "framer-motion";
import { scaleIn, tweenFast } from "@/lib/motion";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ open, onClose, children }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={tweenFast}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />
          {/* Panel */}
          <motion.div
            key="modal"
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-auto w-full max-w-lg rounded-lg bg-card shadow-modal border border-border"
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

---

### 8e. Stagger — Question Options & List Items

```tsx
// ─── Exam question options ────────────────────────────────────────
"use client";
import { motion } from "framer-motion";
import { staggerContainer, answerOption } from "@/lib/motion";

interface Option {
  id: string;
  text: string;
}

interface QuestionOptionsProps {
  options: Option[];
  selected?: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export function QuestionOptions({ options, selected, onSelect, disabled }: QuestionOptionsProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-3"
    >
      {options.map((option) => (
        <motion.button
          key={option.id}
          variants={answerOption}
          onClick={() => !disabled && onSelect(option.id)}
          className={cn(
            "w-full text-left rounded-DEFAULT border px-5 py-4",
            "font-body text-body transition-colors duration-150",
            "min-h-[44px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            selected === option.id
              ? "border-mc-ruby bg-mc-ruby-light text-mc-ruby font-medium"
              : "border-border bg-card text-foreground hover:border-mc-ruby/40 hover:bg-mc-ruby-light/50",
            disabled && "pointer-events-none opacity-70"
          )}
        >
          <span className="font-semibold mr-3 text-muted-foreground">{option.id}.</span>
          {option.text}
        </motion.button>
      ))}
    </motion.div>
  );
}
```

---

### 8f. Shared Layout — Card to Detail Expansion

```tsx
// ─── Study card that expands to full detail ───────────────────────
// Uses layoutId — Framer Motion smoothly morphs the card into the detail view

"use client";
import { motion, AnimatePresence } from "framer-motion";

interface StudyCard {
  id: string;
  title: string;
  track: "nursing" | "pharmacy";
}

// In list view — each card has a layoutId
export function StudyCardThumb({ card, onClick }: { card: StudyCard; onClick: () => void }) {
  return (
    <motion.div
      layoutId={`card-${card.id}`}
      onClick={onClick}
      className="rounded-DEFAULT border border-border bg-card p-5 cursor-pointer shadow-card hover:shadow-card-hover"
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <motion.h3 layoutId={`card-title-${card.id}`} className="font-heading font-semibold text-h4">
        {card.title}
      </motion.h3>
    </motion.div>
  );
}

// In detail view — same layoutId causes smooth shared layout animation
export function StudyCardDetail({ card, onClose }: { card: StudyCard; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        layoutId={`card-${card.id}`}
        className="fixed inset-4 z-50 rounded-lg bg-card border border-border shadow-modal overflow-auto p-8"
      >
        <motion.h2 layoutId={`card-title-${card.id}`} className="font-heading font-bold text-h2 mb-4">
          {card.title}
        </motion.h2>
        {/* Detail content fades in separately */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          {/* Full card content */}
        </motion.div>
        <button onClick={onClose} className="absolute top-4 right-4">✕</button>
      </motion.div>
    </AnimatePresence>
  );
}
```

---

### 8g. Page Transitions

```tsx
// app/template.tsx — Next.js App Router page wrapper
// Use template.tsx (not layout.tsx) so it re-mounts on every route change

"use client";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}
```

---

### 8h. Hover Micro-interactions — CSS + Framer Motion Combined

```tsx
// For simple hover states — use CSS Tailwind (faster, no JS)
<div className="transition-all duration-150 ease-out-expo hover:shadow-card-hover hover:-translate-y-0.5">

// For complex hover states that need spring physics — use whileHover
<motion.div
  whileHover={{ y: -3, boxShadow: "var(--shadow-card-hover)" }}
  whileTap={{ scale: 0.98 }}
  transition={springSnappy}
>

// Button press feedback — always use whileTap for primary CTAs
<motion.button
  whileTap={{ scale: 0.97 }}
  transition={springSnappy}
  className="bg-mc-ruby text-white ..."
>
```

---

### 8i. Reduced Motion — Always Respect

```tsx
// hooks/useMotion.ts
"use client";
import { useReducedMotion } from "framer-motion";
import { springSmooth, instantTransition } from "@/lib/motion";
import type { Transition } from "framer-motion";

// Use this hook in any animated component
export function useMotionTransition(preferred: Transition = springSmooth): Transition {
  const reduced = useReducedMotion();
  return reduced ? instantTransition : preferred;
}

// Usage in component:
// const transition = useMotionTransition(springBouncy);
// <motion.div transition={transition} ...>
```

Also keep this in `globals.css` as a CSS-level fallback:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

### 8j. CSS Tailwind Animations — Still Used for These

The following scenarios still use the Tailwind keyframe animations defined in `tailwind.config.ts` (not Framer Motion):

| Scenario | Class | Reason |
|---|---|---|
| Skeleton loader shimmer | `animate-shimmer` | Pure visual — no state or exit |
| Subtle status pulse | `animate-pulse-subtle` | Infinite loop, no trigger |
| Loading spinner | `animate-spin` | Tailwind built-in |

Everything else that involves mounting, unmounting, or user interaction uses Framer Motion.

---

## 9. Sub-Brand System

When rendering content specific to a track, apply the sub-brand token throughout that component tree. Use `variant="ambient"` with `accent` for track cards — this applies both a colored top stripe and a tinted ambient shadow, giving the card a clear identity without shouting.

```tsx
// Nursing track — green ambient shadow + top stripe
<MedCard variant="ambient" accent="nursing" hoverable>
  <CardHeader>
    <Badge variant="nursing">NCLEX-RN</Badge>
    <h3 className="font-heading font-semibold text-h4 mt-2">Practice Exam</h3>
  </CardHeader>
  <CardBody>
    <ProgressBar value={72} variant="nursing" showLabel label="Progress" />
  </CardBody>
</MedCard>

// Pharmacy track — blue sapphire ambient shadow + top stripe
<MedCard variant="ambient" accent="pharmacy" hoverable>
  <CardHeader>
    <Badge variant="pharmacy">PEBC</Badge>
    ...
  </CardHeader>
</MedCard>

// Default card — no track association, no accent
<MedCard>
  ...
</MedCard>
```

**Sub-brand rule:** A component uses only one sub-brand accent at a time. Never mix nursing green and pharmacy blue in the same component. Default/general content uses no accent.

---

## 10. Logo Usage in Code

```tsx
// components/logo.tsx
import Image from "next/image";

type LogoVariant = "light" | "dark" | "reversed" | "mono";

const logoSrc: Record<LogoVariant, string> = {
  light:    "/assets/logos/logo-full-color-white.png",
  dark:     "/assets/logos/logo-full-color-dark.png",
  reversed: "/assets/logos/logo-reversed-burgundy.png",
  mono:     "/assets/logos/logo-monochrome-dark.png",
};

interface LogoProps {
  variant?: LogoVariant;
  height?: number;
  className?: string;
}

export function Logo({ variant = "light", height = 36, className }: LogoProps) {
  return (
    <Image
      src={logoSrc[variant]}
      alt="MedCognito Class"
      height={height}
      width={height * 3}     // approximate aspect ratio
      className={className}
      priority
    />
  );
}
```

**Copy `assets/logos/` from the design system outputs folder into your project's `public/` folder.**

Logo selection rules:
- White backgrounds → `variant="light"` (default)
- Dark backgrounds / dark mode headers → `variant="dark"`
- Ruby red / brand-colored surfaces → `variant="reversed"`
- Monochrome print / watermark → `variant="mono"`
- Minimum rendered height: **28px digital** / **25mm print**

---

## 11. Voice in UI Copy

Every string Claude Code writes must follow these rules:

| ✅ Do | ❌ Don't |
|---|---|
| "Start your exam" | "Begin examination session" |
| "You're 80% there." | "Progress: 80% complete" |
| "Something went wrong. Try again." | "Error: request failed with status 500" |
| "Pick up where you left off" | "Resume previous session" |
| "Great work — 8 questions left." | "You have answered 12 of 20 questions." |
| "We couldn't load your results." | "Failed to fetch data" |

Empty states always include: what happened, why it matters, and one clear action.

```tsx
// Good empty state
<EmptyState
  icon={<BookOpen />}
  title="No exams started yet"
  description="Pick a module below to begin practicing. Most students start with MCCQE1 Part 1."
  action={<Button>Browse modules</Button>}
/>
```

---

## 12. Accessibility Checklist

Claude Code must verify every component against this list before considering it done:

- [ ] All interactive elements reachable by keyboard (`Tab`, `Enter`, `Space`, `Escape`)
- [ ] Focus ring visible on all focusable elements (never `outline-none` without a replacement)
- [ ] Color is never the **only** way to convey information (always pair with text or icon)
- [ ] Form inputs have associated `<label>` or `aria-label`
- [ ] Error messages use `role="alert"` for screen reader announcement
- [ ] Images have meaningful `alt` text (or `alt=""` if decorative)
- [ ] Buttons with only icons have `aria-label`
- [ ] Progress bars have `role="progressbar"` + `aria-valuenow/min/max`
- [ ] Minimum text contrast 4.5:1 (WCAG AA) — use `text-foreground` on `bg-background`
- [ ] Touch targets minimum 44×44px (`min-h-[44px]`)

---

## 13. What "Not AI-Generated" Means in Practice

When Claude Code writes UI for MedCognito, it must make the following deliberate choices — not defaults:

1. **Heading letter-spacing is negative** (baked into type scale) — type feels pulled together, not loose
2. **Cards lift on hover with shadow + transform** — not just color change
3. **Buttons use `font-heading`** — small but intentional: CTAs feel like they belong to the brand
4. **Border radius is 10px** — warm and approachable, not 4px (cold) or 24px (bubbly/generic)
5. **Transitions use `ease-out-expo`** — fast start, graceful settle — not `ease-in-out` (which feels robotic)
6. **Empty states tell a story** — not just "No data found"
7. **Error messages are human** — not status codes or technical jargon
8. **Left-border accent on cards** indicates category without shouting
9. **Muted foreground for metadata** — timestamps, subtitles never compete with primary content
10. **Focus rings are ruby-colored** — they match the brand, not the browser default blue

---

## 14. General UI Components

These components complete the interactive layer. shadcn/ui handles the behaviour and accessibility — the code below shows how to style them to MedCognito tokens. Install each via `npx shadcn-ui@latest add <component>`.

---

### Navigation — Sidebar Item

```tsx
// components/ui/nav-item.tsx
"use client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  badge?: string | number;
}

export function NavItem({ href, label, icon, active, badge }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-3 px-3 py-2.5 rounded-DEFAULT",
        "font-body font-medium text-label transition-colors duration-150",
        "min-h-[44px]",
        active
          ? "bg-mc-ruby-light text-mc-ruby"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      {/* Active indicator bar */}
      {active && (
        <motion.div
          layoutId="nav-active"
          className="absolute left-0 inset-y-2 w-[3px] rounded-full bg-mc-ruby"
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
      )}
      <span className={cn(
        "flex-shrink-0 transition-colors duration-150",
        active ? "text-mc-ruby" : "text-muted-foreground group-hover:text-foreground"
      )}>
        {icon}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {badge !== undefined && (
        <span className={cn(
          "flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full text-center",
          "font-body font-semibold text-xs leading-5",
          active ? "bg-mc-ruby/20 text-mc-ruby" : "bg-secondary text-muted-foreground"
        )}>
          {badge}
        </span>
      )}
    </Link>
  );
}
```

---

### Tabs

```tsx
// Install: npx shadcn-ui@latest add tabs
// Then override styles in your component:

"use client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// MedCognito tab style — pill variant (default) or underline variant
type TabsVariant = "pill" | "underline";

interface MedTabsProps {
  items: { value: string; label: string; content: React.ReactNode }[];
  defaultValue?: string;
  variant?: TabsVariant;
}

export function MedTabs({ items, defaultValue, variant = "pill" }: MedTabsProps) {
  return (
    <Tabs defaultValue={defaultValue ?? items[0]?.value}>
      <TabsList className={cn(
        variant === "pill"
          ? "bg-secondary p-1 rounded-DEFAULT gap-0.5"
          : "bg-transparent border-b border-border rounded-none p-0 gap-0 w-full"
      )}>
        {items.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            className={cn(
              "font-body font-medium text-label transition-all duration-150",
              variant === "pill"
                ? [
                    "rounded-sm px-4 py-2 min-h-[36px]",
                    "data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-card-xs",
                    "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground",
                  ]
                : [
                    "rounded-none px-4 py-3 min-h-[44px] border-b-2 border-transparent -mb-px",
                    "data-[state=active]:border-mc-ruby data-[state=active]:text-mc-ruby",
                    "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground",
                  ]
            )}
          >
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {items.map((item) => (
        <TabsContent key={item.value} value={item.value} className="mt-4 outline-none">
          {item.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
```

---

### Select / Dropdown

```tsx
// Install: npx shadcn-ui@latest add select
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface MedSelectProps {
  options: { value: string; label: string }[];
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  error?: boolean;
  className?: string;
}

export function MedSelect({ options, placeholder, value, onValueChange, error, className }: MedSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={cn(
        "h-11 px-4 font-body text-body rounded",
        "bg-background border border-input",
        "transition-colors duration-150",
        "focus:ring-2 focus:ring-ring focus:ring-offset-1",
        "data-[placeholder]:text-muted-foreground",
        error && "border-destructive focus:ring-destructive",
        className
      )}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="rounded-DEFAULT shadow-dropdown border border-border bg-card">
        {options.map((opt) => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            className={cn(
              "font-body text-body px-4 py-2.5 rounded-sm cursor-pointer",
              "transition-colors duration-100",
              "focus:bg-mc-ruby-light focus:text-mc-ruby",
              "data-[state=checked]:text-mc-ruby data-[state=checked]:font-medium"
            )}
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

---

### Checkbox & Radio

```tsx
// Install: npx shadcn-ui@latest add checkbox
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface CheckboxFieldProps {
  id: string;
  label: string;
  description?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export function CheckboxField({ id, label, description, checked, onCheckedChange }: CheckboxFieldProps) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={cn(
          "mt-0.5 h-5 w-5 rounded-sm border-2 border-input",
          "data-[state=checked]:bg-mc-ruby data-[state=checked]:border-mc-ruby",
          "transition-colors duration-150",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
      />
      <div className="min-w-0">
        <label htmlFor={id} className="font-body font-medium text-body text-foreground cursor-pointer">
          {label}
        </label>
        {description && (
          <p className="mt-0.5 font-body text-caption text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}
```

---

### Switch / Toggle

```tsx
// Install: npx shadcn-ui@latest add switch
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface SwitchFieldProps {
  id: string;
  label: string;
  description?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export function SwitchField({ id, label, description, checked, onCheckedChange }: SwitchFieldProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="min-w-0">
        <label htmlFor={id} className="font-body font-medium text-body text-foreground cursor-pointer">
          {label}
        </label>
        {description && (
          <p className="font-body text-caption text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={cn(
          "data-[state=checked]:bg-mc-ruby",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
      />
    </div>
  );
}
```

---

### Table

```tsx
// Install: npx shadcn-ui@latest add table
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: keyof T;
  label: string;
  align?: "left" | "right" | "center";
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface MedTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export function MedTable<T extends { id: string | number }>({
  columns, data, onRowClick, emptyMessage = "No data yet.",
}: MedTableProps<T>) {
  return (
    <MedCard variant="default" className="overflow-hidden p-0">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border/60 hover:bg-transparent">
            {columns.map((col) => (
              <TableHead
                key={String(col.key)}
                className={cn(
                  "px-6 py-4 font-body font-semibold text-label text-muted-foreground uppercase tracking-wide",
                  col.align === "right" && "text-right",
                  col.align === "center" && "text-center"
                )}
              >
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="px-6 py-12 text-center font-body text-body text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "border-b border-border/40 transition-colors duration-100",
                  onRowClick && "cursor-pointer hover:bg-secondary/50"
                )}
              >
                {columns.map((col) => (
                  <TableCell
                    key={String(col.key)}
                    className={cn(
                      "px-6 py-4 font-body text-body",
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center"
                    )}
                  >
                    {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? "")}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </MedCard>
  );
}
```

---

### Tooltip

```tsx
// Install: npx shadcn-ui@latest add tooltip
import {
  Tooltip, TooltipContent,
  TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

interface MedTooltipProps {
  content: string;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}

export function MedTooltip({ content, children, side = "top" }: MedTooltipProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side={side}
          className="bg-foreground text-background font-body text-caption px-3 py-1.5 rounded-sm shadow-dropdown max-w-xs"
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

---

### Avatar

```tsx
// Install: npx shadcn-ui@latest add avatar
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type AvatarSize = "sm" | "md" | "lg" | "xl";

const sizeClasses: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

interface MedAvatarProps {
  src?: string;
  name: string;
  size?: AvatarSize;
  className?: string;
}

export function MedAvatar({ src, name, size = "md", className }: MedAvatarProps) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {src && <AvatarImage src={src} alt={name} />}
      <AvatarFallback className="bg-mc-ruby-light text-mc-ruby font-heading font-semibold">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
```

---

### Alert / Banner

```tsx
// components/ui/alert-banner.tsx
import { cn } from "@/lib/utils";
import { Info, CheckCircle, AlertTriangle, XCircle, X } from "lucide-react";

type AlertVariant = "info" | "success" | "warning" | "error";

const alertConfig: Record<AlertVariant, {
  icon: typeof Info;
  classes: string;
  iconClass: string;
}> = {
  info:    { icon: Info,          classes: "bg-mc-ruby-light border-mc-ruby/20 text-mc-ruby",       iconClass: "text-mc-ruby" },
  success: { icon: CheckCircle,   classes: "bg-success/8 border-success/20 text-success",            iconClass: "text-success" },
  warning: { icon: AlertTriangle, classes: "bg-warning/8 border-warning/20 text-warning",            iconClass: "text-warning" },
  error:   { icon: XCircle,       classes: "bg-destructive/8 border-destructive/20 text-destructive",iconClass: "text-destructive" },
};

interface AlertBannerProps {
  variant?: AlertVariant;
  title: string;
  description?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function AlertBanner({ variant = "info", title, description, dismissible, onDismiss }: AlertBannerProps) {
  const { icon: Icon, classes, iconClass } = alertConfig[variant];

  return (
    <div className={cn(
      "flex items-start gap-3 rounded-DEFAULT border px-4 py-3.5",
      classes
    )}>
      <Icon className={cn("mt-0.5 h-5 w-5 flex-shrink-0", iconClass)} />
      <div className="flex-1 min-w-0">
        <p className="font-body font-semibold text-label">{title}</p>
        {description && <p className="mt-0.5 font-body text-caption opacity-90">{description}</p>}
      </div>
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity rounded p-0.5"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
```

---

### Empty State

```tsx
// components/ui/empty-state.tsx
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      "py-16 px-6 gap-4",
      className
    )}>
      {icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          {icon}
        </div>
      )}
      <div className="max-w-sm">
        <h3 className="font-heading font-semibold text-h5 text-foreground">{title}</h3>
        <p className="mt-1.5 font-body text-body-sm text-muted-foreground">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
```

---

### Pagination

```tsx
// components/ui/pagination.tsx
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visible = pages.filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1
  );

  return (
    <nav aria-label="Pagination" className="flex items-center gap-1">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex h-9 w-9 items-center justify-center rounded font-body text-body text-muted-foreground hover:bg-secondary transition-colors disabled:opacity-40 disabled:pointer-events-none"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {visible.map((page, i) => (
        <>
          {i > 0 && visible[i - 1] !== page - 1 && (
            <span key={`ellipsis-${page}`} className="px-1 text-muted-foreground">…</span>
          )}
          <button
            key={page}
            onClick={() => onPageChange(page)}
            aria-current={currentPage === page ? "page" : undefined}
            className={cn(
              "h-9 min-w-[36px] px-2 rounded font-body text-label transition-colors",
              currentPage === page
                ? "bg-mc-ruby text-white font-semibold"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            {page}
          </button>
        </>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex h-9 w-9 items-center justify-center rounded font-body text-body text-muted-foreground hover:bg-secondary transition-colors disabled:opacity-40 disabled:pointer-events-none"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
```

---

## 15. MedCognito-Specific Components

These components are unique to the platform. Claude Code cannot guess these correctly — they encode the exact UX decisions for exam-prep learners.

---

### Exam Timer

```tsx
// components/exam/exam-timer.tsx
"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { springSnappy, tweenFast } from "@/lib/motion";

interface ExamTimerProps {
  durationSeconds: number;
  onTimeUp: () => void;
  onWarning?: () => void;      // called when entering warning zone
  warningThreshold?: number;   // seconds remaining to trigger warning (default 60)
  paused?: boolean;
}

export function ExamTimer({
  durationSeconds,
  onTimeUp,
  onWarning,
  warningThreshold = 60,
  paused = false,
}: ExamTimerProps) {
  const [remaining, setRemaining] = useState(durationSeconds);
  const [warned, setWarned] = useState(false);

  const isWarning  = remaining <= warningThreshold && remaining > 0;
  const isCritical = remaining <= 30 && remaining > 0;
  const isDone     = remaining === 0;

  useEffect(() => {
    if (paused || isDone) return;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) { onTimeUp(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [paused, isDone, onTimeUp]);

  useEffect(() => {
    if (isWarning && !warned) {
      setWarned(true);
      onWarning?.();
    }
  }, [isWarning, warned, onWarning]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const display = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const progress = (remaining / durationSeconds) * 100;

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-2.5 rounded-DEFAULT transition-colors duration-300",
      isCritical ? "bg-destructive/10" : isWarning ? "bg-warning/10" : "bg-secondary"
    )}>
      <motion.div
        animate={isCritical ? { scale: [1, 1.15, 1] } : {}}
        transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
      >
        <Clock className={cn(
          "h-4 w-4 transition-colors duration-300",
          isCritical ? "text-destructive" : isWarning ? "text-warning" : "text-muted-foreground"
        )} />
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.span
          key={display}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={tweenFast}
          className={cn(
            "font-heading font-bold text-h5 tabular-nums transition-colors duration-300",
            isCritical ? "text-destructive" : isWarning ? "text-warning" : "text-foreground"
          )}
        >
          {display}
        </motion.span>
      </AnimatePresence>

      {/* Arc progress — thin ring around time */}
      <svg className="h-6 w-6 -rotate-90" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" className="stroke-border fill-none" strokeWidth="2" />
        <circle
          cx="12" cy="12" r="10"
          className={cn(
            "fill-none transition-all duration-1000",
            isCritical ? "stroke-destructive" : isWarning ? "stroke-warning" : "stroke-mc-ruby"
          )}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 10}`}
          strokeDashoffset={`${2 * Math.PI * 10 * (1 - progress / 100)}`}
        />
      </svg>
    </div>
  );
}
```

---

### Question Card

```tsx
// components/exam/question-card.tsx
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { MedCard, CardHeader, CardBody } from "@/components/ui/med-card";
import { staggerContainer, answerOption, correctReveal, springSnappy } from "@/lib/motion";

type QuestionState = "unanswered" | "answered" | "revealed";

interface Option { id: string; text: string; }

interface QuestionCardProps {
  questionNumber: number;
  totalQuestions: number;
  questionText: string;
  options: Option[];
  correctOptionId: string;
  explanation?: string;
  state?: QuestionState;
  selectedOptionId?: string;
  onSelect: (id: string) => void;
  track?: "nursing" | "pharmacy";
}

export function QuestionCard({
  questionNumber, totalQuestions, questionText,
  options, correctOptionId, explanation,
  state = "unanswered", selectedOptionId, onSelect, track,
}: QuestionCardProps) {
  const isRevealed = state === "revealed";
  const isCorrect  = selectedOptionId === correctOptionId;

  return (
    <MedCard variant="default" accent={track}>
      <CardHeader>
        {/* Question counter */}
        <div className="flex items-center justify-between mb-3">
          <span className="font-body text-caption text-muted-foreground">
            Question <span className="font-semibold text-foreground">{questionNumber}</span> of {totalQuestions}
          </span>
          {state === "revealed" && (
            <motion.div
              variants={correctReveal}
              initial="hidden"
              animate="visible"
              className={cn(
                "flex items-center gap-1.5 font-body font-semibold text-label",
                isCorrect ? "text-success" : "text-destructive"
              )}
            >
              {isCorrect
                ? <><CheckCircle className="h-4 w-4" /> Correct</>
                : <><XCircle className="h-4 w-4" /> Incorrect</>
              }
            </motion.div>
          )}
        </div>
        {/* Question text */}
        <h2 className="font-heading font-semibold text-h4 text-foreground leading-relaxed">
          {questionText}
        </h2>
      </CardHeader>

      <CardBody className="pt-0 space-y-4">
        {/* Answer options */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-2.5"
        >
          {options.map((option) => {
            const isSelected = selectedOptionId === option.id;
            const isCorrectOption = option.id === correctOptionId;
            const showCorrect = isRevealed && isCorrectOption;
            const showWrong   = isRevealed && isSelected && !isCorrectOption;

            return (
              <motion.button
                key={option.id}
                variants={answerOption}
                whileTap={state === "unanswered" ? { scale: 0.99 } : undefined}
                transition={springSnappy}
                onClick={() => state === "unanswered" && onSelect(option.id)}
                disabled={state !== "unanswered"}
                className={cn(
                  "w-full text-left rounded flex items-start gap-3 px-5 py-3.5 min-h-[44px]",
                  "font-body text-body transition-all duration-150",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  // Unanswered states
                  state === "unanswered" && !isSelected &&
                    "bg-card border border-border hover:border-mc-ruby/30 hover:bg-mc-ruby-light/40",
                  state === "unanswered" && isSelected &&
                    "bg-mc-ruby-light border-2 border-mc-ruby text-mc-ruby font-medium",
                  // Answered (submitted but not yet revealed)
                  state === "answered" && isSelected &&
                    "bg-mc-ruby-light border-2 border-mc-ruby text-mc-ruby font-medium",
                  state === "answered" && !isSelected &&
                    "bg-card border border-border opacity-60",
                  // Revealed states
                  showCorrect && "bg-success/8 border-2 border-success text-success font-medium",
                  showWrong   && "bg-destructive/8 border-2 border-destructive text-destructive",
                  isRevealed && !isSelected && !isCorrectOption && "bg-card border border-border/50 opacity-50",
                )}
              >
                {/* Option letter */}
                <span className={cn(
                  "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
                  "font-heading font-bold text-xs mt-0.5 transition-colors",
                  showCorrect ? "bg-success text-white"
                  : showWrong ? "bg-destructive text-white"
                  : isSelected ? "bg-mc-ruby text-white"
                  : "bg-secondary text-muted-foreground"
                )}>
                  {option.id}
                </span>
                <span className="flex-1">{option.text}</span>
                {/* Feedback icon on reveal */}
                {isRevealed && (isSelected || isCorrectOption) && (
                  <span className="flex-shrink-0 mt-0.5">
                    {showCorrect ? <CheckCircle className="h-4 w-4 text-success" />
                    : showWrong  ? <XCircle className="h-4 w-4 text-destructive" />
                    : null}
                  </span>
                )}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Explanation — only shown after reveal */}
        <AnimatePresence>
          {isRevealed && explanation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="overflow-hidden"
            >
              <div className="pt-2 border-t border-border/50">
                <div className="flex items-start gap-2 mt-3 p-4 rounded bg-secondary/60">
                  <AlertCircle className="h-4 w-4 text-mc-ruby flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-body font-semibold text-label text-foreground mb-1">Explanation</p>
                    <p className="font-body text-body-sm text-muted-foreground leading-relaxed">{explanation}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardBody>
    </MedCard>
  );
}
```

---

### Score Summary

```tsx
// components/exam/score-summary.tsx
"use client";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Clock, Target } from "lucide-react";
import { MedCard, CardHeader, CardBody } from "@/components/ui/med-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import { staggerContainer, staggerItem, correctReveal } from "@/lib/motion";

interface ScoreSummaryProps {
  score: number;               // 0-100
  correct: number;
  incorrect: number;
  skipped: number;
  totalQuestions: number;
  timeTakenSeconds: number;
  passingScore?: number;       // default 60
  examTitle: string;
  track?: "nursing" | "pharmacy";
}

export function ScoreSummary({
  score, correct, incorrect, skipped,
  totalQuestions, timeTakenSeconds,
  passingScore = 60, examTitle, track,
}: ScoreSummaryProps) {
  const passed = score >= passingScore;
  const mins   = Math.floor(timeTakenSeconds / 60);
  const secs   = timeTakenSeconds % 60;

  return (
    <div className="space-y-6">
      {/* Hero score card */}
      <MedCard variant="elevated" accent={track} className="text-center">
        <CardBody className="py-10">
          <motion.div variants={correctReveal} initial="hidden" animate="visible">
            <Badge variant={passed ? "success" : "destructive"} className="mb-4">
              {passed ? "Passed" : "Not yet — keep going"}
            </Badge>
            <p className="font-heading font-bold text-display text-foreground">
              {score}<span className="text-h2 text-muted-foreground">%</span>
            </p>
            <p className="mt-2 font-body text-body-sm text-muted-foreground">{examTitle}</p>
            <div className="mt-6 max-w-xs mx-auto">
              <ProgressBar
                value={score}
                variant={passed ? (track ?? "ruby") : "ruby"}
                size="lg"
                showLabel
                label={`Passing score: ${passingScore}%`}
              />
            </div>
          </motion.div>
        </CardBody>
      </MedCard>

      {/* Stat breakdown */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        {[
          { icon: <CheckCircle className="h-5 w-5" />, label: "Correct",   value: correct,   color: "text-success" },
          { icon: <XCircle className="h-5 w-5" />,     label: "Incorrect", value: incorrect, color: "text-destructive" },
          { icon: <Target className="h-5 w-5" />,      label: "Skipped",   value: skipped,   color: "text-muted-foreground" },
          { icon: <Clock className="h-5 w-5" />,       label: "Time",      value: `${mins}m ${secs}s`, color: "text-mc-ruby" },
        ].map((stat) => (
          <motion.div key={stat.label} variants={staggerItem}>
            <MedCard variant="default" hoverable>
              <CardBody className="text-center py-5">
                <span className={stat.color}>{stat.icon}</span>
                <p className="mt-2 font-heading font-bold text-h3 text-foreground">{stat.value}</p>
                <p className="font-body text-caption text-muted-foreground">{stat.label}</p>
              </CardBody>
            </MedCard>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
```

---

### Study Module Card

```tsx
// components/modules/module-card.tsx
"use client";
import { motion } from "framer-motion";
import { BookOpen, ChevronRight } from "lucide-react";
import { MedCard, CardBody } from "@/components/ui/med-card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { springSmooth } from "@/lib/motion";

type ModuleTrack = "nursing" | "pharmacy";
type ModuleStatus = "not-started" | "in-progress" | "completed";

interface ModuleCardProps {
  id: string;
  title: string;
  description: string;
  track: ModuleTrack;
  questionCount: number;
  progress: number;          // 0-100
  status: ModuleStatus;
  onClick?: () => void;
}

const statusLabel: Record<ModuleStatus, string> = {
  "not-started": "Start",
  "in-progress": "Continue",
  "completed":   "Review",
};

export function ModuleCard({
  title, description, track,
  questionCount, progress, status, onClick,
}: ModuleCardProps) {
  return (
    <MedCard variant="ambient" accent={track} hoverable clickable onClick={onClick}>
      <CardBody className="flex items-start gap-4 py-5">
        {/* Icon */}
        <div className={`flex-shrink-0 p-2.5 rounded-lg ${
          track === "nursing" ? "bg-mc-nursing-light" : "bg-mc-pharmacy-light"
        }`}>
          <BookOpen className={`h-5 w-5 ${
            track === "nursing" ? "text-mc-nursing" : "text-mc-pharmacy"
          }`} />
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-heading font-semibold text-h5 text-foreground">{title}</h3>
              <p className="mt-0.5 font-body text-body-sm text-muted-foreground line-clamp-2">{description}</p>
            </div>
            <ChevronRight className="flex-shrink-0 h-5 w-5 text-muted-foreground mt-0.5" />
          </div>

          <div className="flex items-center justify-between gap-4 pt-1">
            <div className="flex-1">
              <ProgressBar value={progress} variant={track} size="sm" />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="font-body text-caption text-muted-foreground">
                {questionCount} Qs
              </span>
              <Badge variant={track}>
                {statusLabel[status]}
              </Badge>
            </div>
          </div>
        </div>
      </CardBody>
    </MedCard>
  );
}
```

---

*This design system is derived from the MedCognito Brand Guidelines (2025, Artlas Plus) and translated for developer use. Brand source of truth: `medcognito-style-guide.md`.*
