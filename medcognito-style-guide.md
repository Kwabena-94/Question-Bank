# MedCognito Class — Style Guide & Brand Guidelines for Application Development

> **Purpose:** This file is a comprehensive design and development reference for any MedCognito application build. Feed this to Claude Code, Cursor, or any AI-assisted development tool as project context. It covers visual design, component patterns, voice, and architecture decisions.
>
> **Source of truth:** MedCognito Brand Guidelines (2025), designed by Artlas Plus. This document translates those guidelines into developer-ready specifications.
>
> **Last updated:** March 2026

---

## 1. Brand Identity

**Company:** MedCognito Class
**Domain:** medcognito.com
**Mission:** "Your Success. Our Mission."
**Tagline:** "Together Towards Success"
**What it is:** A digital tutoring platform for internationally trained healthcare professionals preparing for Canadian licensure exams (MCCQE1, NAC OSCE, TDM, CaRMS, PRA, CFA, NCLEX-RN, PEBC, OET).
**Primary audience:** Stressed, time-poor, high-stakes learners — mostly internationally trained doctors, nurses, and pharmacists in Canada and North America.
**CEO / Co-Founder:** Manuel Ansah (m.ansah@medcognito.com)

**Brand personality — three pillars that must coexist in every touchpoint:**

| Pillar | Identity | What It Means |
|---|---|---|
| **Professional** | Mentor | We carry the voice of authority and expertise, guiding doctors with precision and clarity. Like a trusted mentor, MedCognito provides structure, discipline, and direction. |
| **Encouraging** | Motivator | Beyond teaching, we inspire. Our brand speaks with positivity and encouragement, reminding students that they are capable and supported throughout their journey. |
| **Modern** | Innovator | MedCognito is forward-thinking, embracing modern technology and fresh approaches to medical training. We combine tradition with innovation, using flexible online platforms, digital tools, and new learning methods. |

---

## 2. Color System

### Primary Palette

| Token | Name | Hex | RGB | CMYK | Usage |
|---|---|---|---|---|---|
| `--color-primary` | Ruby Red (Burgundy) | `#9E0E27` | rgb(158, 14, 39) | C-24, M-100, Y-89, K-21 | Primary brand color. Buttons, headers, navigation, key CTAs. Carries the strongest weight — trust, expertise, professionalism. |
| `--color-accent` | Philippine Orange | `#FE7406` | rgb(254, 116, 6) | C-0, M-68, Y-100, K-0 | Secondary brand color. Highlights, hover states, progress indicators, badges, "Sign Up" CTAs. Energy, optimism, knowledge. |

### Secondary Palette

| Token | Name | Hex | RGB | CMYK | Usage |
|---|---|---|---|---|---|
| `--color-nursing` | (Green accent) | `#2E7D32` | rgb(46, 125, 50) | — | Sub-brand accent for Nursing track content and UI elements. |
| `--color-pharmacy` | Blue Sapphire | `#145A79` | rgb(20, 90, 121) | C-93, M-60, Y-35, K-15 | Sub-brand accent for Pharmacy track content and UI elements. |
| `--color-pharmacy-light` | Cherry Blossom Pink | `#F9B4C7` | rgb(249, 180, 199) | C-0, M-37, Y-5, K-0 | Supporting accent. Light backgrounds, badges, tags for pharmacy-related content. |

### Neutral Palette

| Token | Hex | Usage |
|---|---|---|
| `--color-neutral-900` | `#1A1A1A` | Primary text |
| `--color-neutral-700` | `#4A4A4A` | Secondary text, body copy |
| `--color-neutral-500` | `#8A8A8A` | Placeholder text, disabled states |
| `--color-neutral-300` | `#D4D4D4` | Borders, dividers |
| `--color-neutral-100` | `#F5F5F5` | Background surfaces, cards |
| `--color-neutral-0` | `#FFFFFF` | Page background |

### Semantic Colors

| Token | Hex | Usage |
|---|---|---|
| `--color-success` | `#2E7D32` | Pass states, completion, positive feedback |
| `--color-warning` | `#F9A825` | Caution, approaching deadlines |
| `--color-error` | `#C62828` | Errors, failed attempts, critical alerts |
| `--color-info` | `#145A79` | Informational states, tips, guidance |

### Rules

- Burgundy (`#9E0E27`) and Orange (`#FE7406`) are always the foundation. **No unapproved colors should be introduced into the system**, as they would dilute the impact of the brand.
- The MedCognito logotype must always be reproduced using these approved colors.
- When applying the palette, aim for balanced use across communications — avoid the brand becoming overly tied to a single color.
- The positive (primary) logo should be used wherever possible; when background colors conflict with logo elements, use the reversed (negative) version.
- Sub-brand colors (Blue Sapphire, Green) are accents only — never replace the primary palette.
- Maintain a minimum contrast ratio of 4.5:1 for text on backgrounds (WCAG AA).
- Orange on white fails WCAG AA for small text. Use it for large text, icons, or decorative elements only — never for body copy on white.

### CSS Custom Properties

```css
:root {
  /* Primary */
  --color-primary: #9E0E27;
  --color-primary-hover: #7D0B1F;
  --color-primary-light: #FDF2F4;
  --color-accent: #FE7406;
  --color-accent-hover: #E56805;
  --color-accent-light: #FFF4EB;

  /* Sub-brands */
  --color-nursing: #2E7D32;
  --color-nursing-light: rgba(46, 125, 50, 0.1);
  --color-pharmacy: #145A79;
  --color-pharmacy-light: #F9B4C7;

  /* Neutrals */
  --color-neutral-900: #1A1A1A;
  --color-neutral-700: #4A4A4A;
  --color-neutral-500: #8A8A8A;
  --color-neutral-300: #D4D4D4;
  --color-neutral-100: #F5F5F5;
  --color-neutral-0: #FFFFFF;

  /* Semantic */
  --color-success: #2E7D32;
  --color-warning: #F9A825;
  --color-error: #C62828;
  --color-info: #145A79;
}
```

---

## 3. Typography

### Font Stack

The brand uses a two-font system: **Poppins** for all headings and UI labels, **Manrope** for all body copy.

| Role | Font Family | Weight | Tracking | Fallback |
|---|---|---|---|---|
| Headline Font (H1) | Poppins | 700 (Bold) | -0.03em (-30) | system-ui, sans-serif |
| Sub Font (H2) | Poppins | 600 (SemiBold) | -0.01em (-10) | system-ui, sans-serif |
| H3-H6 Section headers | Poppins | 500 (Medium) | 0 | system-ui, sans-serif |
| Body copy | Manrope | 400 (Regular) | 0 | system-ui, sans-serif |
| Body emphasis | Manrope | 500 (Medium) | 0 | system-ui, sans-serif |
| Buttons / Labels | Poppins | 500 (Medium) | 0.02em | system-ui, sans-serif |
| Code / Data | JetBrains Mono | 400 | 0 | monospace |

**Approved Poppins weights:** Regular (400), Medium (500), SemiBold (600), Bold (700)
**Approved Manrope weights:** Regular (400), Medium (500)

**Pairing rules from brand guidelines:**
- H1 uses Poppins SemiBold for pairing context (when used alongside H2)
- H2 uses Poppins Regular for pairing context
- Headline font for standalone/hero use: Poppins Bold, tracking -30
- Sub font for section headings: Poppins SemiBold, tracking -10
- Body font: Manrope Regular, tracking 0

Maintain the font pairing, tracking, leading, and paragraph headlines consistently.

### Google Fonts Import

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Manrope:wght@400;500;600&display=swap" rel="stylesheet">
```

Or via CSS:

```css
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Manrope:wght@400;500;600&display=swap');
```

### Type Scale

| Element | Size | Line Height | Weight | Font | Tracking |
|---|---|---|---|---|---|
| H1 (Hero/Page title) | 2.25rem (36px) | 1.2 | 700 (Bold) | Poppins | -0.03em |
| H2 (Section heading) | 1.75rem (28px) | 1.3 | 600 (SemiBold) | Poppins | -0.01em |
| H3 | 1.375rem (22px) | 1.4 | 500 (Medium) | Poppins | 0 |
| H4 | 1.125rem (18px) | 1.4 | 500 (Medium) | Poppins | 0 |
| Body | 1rem (16px) | 1.6 | 400 (Regular) | Manrope | 0 |
| Body Small | 0.875rem (14px) | 1.5 | 400 (Regular) | Manrope | 0 |
| Caption | 0.75rem (12px) | 1.4 | 400 (Regular) | Manrope | 0 |
| Button | 0.875rem (14px) | 1 | 500 (Medium) | Poppins | 0.02em |

### CSS Type Definitions

```css
body {
  font-family: 'Manrope', system-ui, sans-serif;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--color-neutral-900);
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Poppins', system-ui, sans-serif;
  color: var(--color-neutral-900);
}

h1 { font-size: 2.25rem; font-weight: 700; letter-spacing: -0.03em; line-height: 1.2; }
h2 { font-size: 1.75rem; font-weight: 600; letter-spacing: -0.01em; line-height: 1.3; }
h3 { font-size: 1.375rem; font-weight: 500; line-height: 1.4; }
h4 { font-size: 1.125rem; font-weight: 500; line-height: 1.4; }
```

---

## 4. Spacing & Layout

### Spacing Scale (8px base)

| Token | Value | Usage |
|---|---|---|
| `--space-1` | 4px | Tight inner padding, icon gaps |
| `--space-2` | 8px | Default inner padding, inline gaps |
| `--space-3` | 12px | Small component padding |
| `--space-4` | 16px | Standard component padding, card padding |
| `--space-5` | 24px | Section gaps, card margins |
| `--space-6` | 32px | Large section gaps |
| `--space-8` | 48px | Page section breaks |
| `--space-10` | 64px | Major layout divisions |
| `--space-12` | 80px | Hero / feature section padding |

### Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 4px | Inputs, small elements |
| `--radius-md` | 8px | Cards, containers |
| `--radius-lg` | 12px | Modals, dialogs |
| `--radius-xl` | 16px | Feature cards, hero elements |
| `--radius-full` | 9999px | Badges, pills, avatars, Sign Up button |

### Breakpoints

| Name | Width | Usage |
|---|---|---|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Wide desktop |
| `2xl` | 1536px | Ultra-wide |

### Container

```css
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

@media (min-width: 768px) {
  .container { padding: 0 var(--space-6); }
}
```

---

## 5. Component Patterns

### Navigation (Reference layout from brand guidelines, page 36)

```
[Home] [Courses] [Contact Us]    [LOGO centered]    [Log In] [Sign Up (orange pill)]
```

- Logo centered in navigation bar
- Primary nav items left-aligned: Home, Courses, Contact Us
- Auth actions right-aligned: Log In (text), Sign Up (orange pill button)
- Sign Up uses `--color-accent` background with `--radius-full` (pill shape)

### Buttons

```css
/* Primary — Burgundy. Default CTA. */
.btn-primary {
  background: var(--color-primary);
  color: #FFFFFF;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 0.875rem;
  padding: 12px 24px;
  border-radius: var(--radius-sm);
  border: none;
  cursor: pointer;
  transition: background 0.2s ease;
}
.btn-primary:hover { background: var(--color-primary-hover); }

/* Secondary — Orange. Used for Sign Up, highlights, energy CTAs. */
.btn-secondary {
  background: var(--color-accent);
  color: #FFFFFF;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 0.875rem;
  padding: 12px 24px;
  border-radius: var(--radius-full); /* pill shape per brand mockups */
  border: none;
  cursor: pointer;
  transition: background 0.2s ease;
}
.btn-secondary:hover { background: var(--color-accent-hover); }

/* Ghost — Outlined. Used for tertiary actions. */
.btn-ghost {
  background: transparent;
  color: var(--color-primary);
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 0.875rem;
  padding: 12px 24px;
  border-radius: var(--radius-sm);
  border: 2px solid var(--color-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-ghost:hover {
  background: var(--color-primary);
  color: #FFFFFF;
}
```

### Cards

```css
.card {
  background: var(--color-neutral-0);
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-md);
  padding: var(--space-5);
  transition: box-shadow 0.2s ease;
}
.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* Exam track card — colored top border indicates track */
.card--doctors { border-top: 4px solid var(--color-primary); }
.card--nursing { border-top: 4px solid var(--color-nursing); }
.card--pharmacy { border-top: 4px solid var(--color-pharmacy); }
```

### Form Inputs

```css
.input {
  font-family: 'Manrope', sans-serif;
  font-size: 1rem;
  padding: 12px 16px;
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-sm);
  color: var(--color-neutral-900);
  background: var(--color-neutral-0);
  transition: border-color 0.2s ease;
  width: 100%;
}
.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}
.input::placeholder { color: var(--color-neutral-500); }
.input--error { border-color: var(--color-error); }
.input--error:focus { box-shadow: 0 0 0 3px rgba(198, 40, 40, 0.1); }
```

### Progress / Score Indicators

```css
/* Used in exam prep — scores, completion, study progress */
.progress-bar {
  background: var(--color-neutral-100);
  border-radius: var(--radius-full);
  height: 8px;
  overflow: hidden;
}
.progress-bar__fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}
.progress-bar__fill--passing { background: var(--color-success); }
.progress-bar__fill--warning { background: var(--color-warning); }
.progress-bar__fill--failing { background: var(--color-error); }
```

### Tags / Badges

```css
/* Exam track badges */
.badge {
  display: inline-flex;
  align-items: center;
  font-family: 'Poppins', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: var(--radius-full);
}
.badge--mccqe1 { background: var(--color-primary-light); color: var(--color-primary); }
.badge--nac-osce { background: var(--color-primary-light); color: var(--color-primary); }
.badge--tdm { background: var(--color-primary-light); color: var(--color-primary); }
.badge--nclex { background: rgba(46, 125, 50, 0.1); color: var(--color-nursing); }
.badge--pebc { background: rgba(20, 90, 121, 0.1); color: var(--color-pharmacy); }
```

---

## 6. Sub-Brand System

MedCognito operates as a **master brand** with specialized offerings for different professional groups. While these are distinct focus areas, they remain connected under the unified MedCognito identity.

### Unified Master Brand

- All communication should remain under the MedCognito master brand to ensure clarity and consistency.
- Sub-offerings (Nursing, Pharmacy) are treated as programs within the MedCognito ecosystem, not independent brands.
- This reinforces MedCognito's role as a single, trusted hub for all medical professionals preparing for Canadian licensure.

### Visual Differentiation

| Track | Label | Color Accent | Naming Convention |
|---|---|---|---|
| Doctors (default) | MCCQE1, NAC OSCE, TDM, CaRMS, PRA, CFA | Burgundy + Orange (core) | "MedCognito" (no suffix needed) |
| Nursing | NCLEX-RN | Green (`#2E7D32`) | "MedCognito Nursing" |
| Pharmacy | PEBC | Blue Sapphire (`#145A79`) | "MedCognito Pharmacy" |

### Implementation Rules

- The primary palette (Burgundy + Orange) is always present. Sub-brand colors are additive accents, not replacements.
- Each sub-brand may use a supporting accent color (Green for Nursing, Blue Sapphire for Pharmacy) while maintaining Burgundy and Orange as the core.
- Create design templates where sub-brand content is framed but still visibly part of MedCognito.
- Always lead with the MedCognito master logo; sub-brand names should appear as extensions (e.g., "MedCognito Nursing").
- In navigation, use the sub-brand color as an active indicator or icon tint for the relevant track.
- In course cards and content, use a colored top border or small badge to indicate track — never full-page color changes.

### Content Strategy

- **Single Channel Approach:** All sub-brand content is published under MedCognito's existing social media channels. Separate pages are not required at this stage.
- **Segmentation:** Use hashtags (`#MedCognitoNursing`, `#MedCognitoPharmacy`) and highlight covers to group content for different audiences.
- **Messaging:** Always introduce sub-offerings as part of the master brand. Example: "MedCognito Nursing — empowering nurses for Canadian licensure."

### Scalability

As sub-brands grow, MedCognito may introduce dedicated landing pages or micro-sites for each discipline. Until then, the strategy is to unify all communication under one brand identity, using visual systems and structured messaging to avoid confusion.

---

## 7. Logo Usage

### Logo Breakdown

The MedCognito Class logo is a modern, bold wordmark that blends professionalism with creativity:

- **"Med"** is in bright orange, symbolizing energy, optimism, and knowledge.
- **"Cognito"** is in deep burgundy, representing authority, trust, and professionalism.
- The **"t"** doubles as a medical professional wearing a stethoscope, directly linking the brand to healthcare.
- The playful **dot and hook-like extension under the "g"** adds a dynamic and approachable character.
- **"class"** in lowercase orange reflects accessibility, simplicity, and friendliness.

### Logo Variations

| Variant | File | Background | Description | When to Use |
|---|---|---|---|---|
| **Full Color — Light** (Primary) | `assets/logos/logo-full-color-white.png` | White / light | Orange "Med" + Burgundy "Cognito" + Orange "class" | Default for all light-background contexts: website headers, documents, print on white stock |
| **Full Color — Dark** | `assets/logos/logo-full-color-dark.png` | Black / dark | Orange "Med" + Burgundy "Cognito" + Orange "class" on dark bg | Dark-themed UI, overlays on dark images, dark hero sections |
| **Reversed** | `assets/logos/logo-reversed-burgundy.png` | Ruby Red / brand bg | Orange "Med" + White "Cognito" + Orange "class" | Brand-colored backgrounds, marketing materials on ruby red, hero banners |
| **Monochrome** | `assets/logos/logo-monochrome-dark.png` | Black / dark | All-white single-color wordmark | When full color is not possible: watermarks, one-color printing, dark overlays, footer on dark bg |

**Import paths (relative to project root):**
```
/assets/logos/logo-full-color-white.png   ← PRIMARY (use by default)
/assets/logos/logo-full-color-dark.png    ← dark backgrounds
/assets/logos/logo-reversed-burgundy.png  ← brand-colored backgrounds
/assets/logos/logo-monochrome-dark.png    ← monochrome / single-color contexts
```

### Size Rules

- **Minimum digital size:** 120px wide.
- **Minimum print size:** 25mm wide.
- **Clearspace (exclusion zone):** Defined by the height of the letter "M" in the logo on all four sides. This area must remain free from any text, graphics, or other elements.

### Prohibited Uses

- Do not scale the logo disproportionately. The text should remain proportional when scaled.
- Do not alter the placement of the text or icon.
- Do not alter the icon portion of the logo.
- Do not display the full-color logo on colored backgrounds or colored paper.
- Do not merge or modify the logo for co-branding.

### Logo on Images

- Always place the logo over areas of the image that are light, neutral, or uncluttered.
- Use the positive (full-color) version on light or pale backgrounds.
- Use the negative (white) version on dark or richly colored backgrounds.
- Ensure sufficient contrast between the logo and the image.
- The logo must always feel integrated but never lost within the image.

### CSS Implementation

```css
.logo {
  height: 40px; /* default navigation size */
  width: auto;
}
.logo--small { height: 28px; }
.logo--large { height: 56px; }

/* Ensure clearspace via padding on container */
.logo-container {
  padding: 12px; /* approximates "M" height clearspace */
}

/* Variant selection based on theme */
.logo-img { content: url('/assets/logos/logo-full-color-white.png'); }
[data-theme="dark"] .logo-img { content: url('/assets/logos/logo-full-color-dark.png'); }
.hero--brand .logo-img { content: url('/assets/logos/logo-reversed-burgundy.png'); }
```

**React/Next.js usage example:**
```tsx
// components/Logo.tsx
import logoLight from '@/assets/logos/logo-full-color-white.png';
import logoDark from '@/assets/logos/logo-full-color-dark.png';
import logoReversed from '@/assets/logos/logo-reversed-burgundy.png';
import logoMono from '@/assets/logos/logo-monochrome-dark.png';

type LogoVariant = 'light' | 'dark' | 'reversed' | 'mono';

const logos: Record<LogoVariant, string> = {
  light: logoLight,
  dark: logoDark,
  reversed: logoReversed,
  mono: logoMono,
};

export function Logo({ variant = 'light', className }: { variant?: LogoVariant; className?: string }) {
  return <img src={logos[variant]} alt="MedCognito Class" className={className} />;
}
```

---

## 8. Iconography & Imagery

### Icons

The brand uses outlined, medical-themed line icons with a professional yet approachable style. Icons provide clarity, support communication, and add visual interest.

- Style: outlined/line-art, consistent stroke weight (1.5-2px), not filled.
- Default icon size: 20px for inline, 24px for standalone.
- Icon color inherits from text color by default. For decorative icons, use `--color-primary` or `--color-accent`.
- Medical themes: stethoscope, cross/plus, thermometer, heartbeat, test tube, microscope, pills, syringe, DNA, etc.
- When used consistently, icons reinforce MedCognito's professional yet approachable personality.

### Photography

Photography and imagery should always reflect professionalism, inclusivity, and a supportive learning environment while reinforcing trust in the brand.

**Style & Tone:**
- Professional & Modern: Crisp, high-quality images with natural lighting.
- Inclusive & Diverse: Represent international doctors, nurses, and pharmacists from varied backgrounds.
- Supportive & Human: Capture collaboration, mentorship, and real moments of learning.
- Clean & Balanced: Use uncluttered compositions and backgrounds that allow logos and text to remain legible.

**Subject Matter:**
- Core Focus: Students in study or exam-prep environments (online and offline).
- Faculty Interaction: Teachers guiding candidates, providing mentorship, and conducting mock exams.
- Tools of Learning: Stethoscopes, notes, digital devices, and exam materials shown in context.
- Success Stories: Confident candidates preparing for or celebrating milestones.

### Illustrations

If using illustrations instead of photography, maintain a clean, modern line-art style with the brand palette. Avoid cartoonish or overly playful styles — the audience is professional.

---

## 9. Voice & Tone for UI Copy

### Three Pillars (must coexist)

Every design element — from color choices and typography to imagery and layout — should reinforce the brand's personality and values. The voice and tone must always align with the mission: "Your Success. Our Mission."

**1. Professional & Trustworthy**
- Voice: Authoritative, clear, and reliable.
- Tone in Visuals: Clean layouts, balanced grids, and structured typography that reflect medical professionalism.
- Application: Minimal clutter, precise use of brand colors (burgundy for trust, orange for energy). Visuals should look polished and academic, instilling confidence.

**2. Supportive & Encouraging**
- Voice: Positive, motivating, and empathetic.
- Tone in Visuals: Warm color accents, approachable photography, and design that highlights community and mentorship.
- Application: Use images of students collaborating, learning, or celebrating milestones. Visuals should reassure students that MedCognito is with them every step of the way.

**3. Modern & Innovative**
- Voice: Forward-thinking, dynamic, and adaptable.
- Tone in Visuals: Fresh, uncluttered layouts with adaptive grids, icons, and digital-friendly elements that show innovation.
- Application: Use bold headline typography, clean vector icons, and imagery of digital learning environments to emphasize MedCognito's flexible online approach.

### Guidelines for Designers / Developers

- **Consistency:** Always align visuals with the brand's approved colors, typography, and grid systems.
- **Clarity:** Prioritize legibility and simplicity — visuals should never overwhelm the message.
- **Emotion:** Every visual should make the audience feel confident, inspired, and supported.
- **Global Inclusivity:** Ensure images and designs represent diverse students, cultures, and contexts.

**Summary:** Visually, MedCognito should always look professional, feel supportive, and appear modern. The design language is more than aesthetics — it's how we communicate trust, encouragement, and innovation at a glance.

### UI Copy Guidelines

| Element | Guidance | Good Example | Bad Example |
|---|---|---|---|
| Headings/titles | Clear, direct, action-oriented. Lead with what the user gets. | "Start Your MCCQE1 Prep" | "Welcome to Our Exam Preparation Platform" |
| Button labels | Verb-first, specific. | "Begin Practice Exam" | "Click Here" |
| Empty states | Encouraging, not deflating. | "No practice scores yet — start your first quiz to see progress here." | "No data available." |
| Error messages | Specific and helpful. | "That email is already registered. Try signing in instead." | "Error 409." |
| Success messages | Celebrate without being excessive. | "Score submitted. Nice work." | "Congratulations! You have successfully submitted your amazing score!" |
| Loading states | Brief and human. Use skeleton screens over spinners. | "Preparing your questions..." | "Loading, please wait..." |

### Tone by Context

| Context | Tone | Example |
|---|---|---|
| Onboarding | Warm, structured, guiding | "Let's set up your study plan. Which exam are you preparing for?" |
| Study/practice | Focused, calm, supportive | "Question 14 of 50. Take your time." |
| Results/scores | Honest, encouraging, forward-looking | "You scored 62%. Your weakest area is pharmacology — we've added targeted questions to your next session." |
| Payments/billing | Clear, no-frills, trustworthy | "Your subscription renews on April 15. Cancel anytime from Settings." |
| Emails/notifications | Concise, action-oriented | "Your NAC OSCE mock exam is scheduled for Saturday. Here's how to prepare." |

### Words to Use

Prepare, build, practice, progress, achieve, support, guide, structured, focused, ready, confident, clear, targeted, milestone

### Words to Avoid

Revolutionary, game-changing, best-in-class, synergy, leverage, disrupt, hack, crush it, dominate, easy (nothing about these exams is easy — respect the difficulty)

---

## 10. Co-Branding

When collaborating with universities, hospitals, training institutions, or sponsors, the brand must remain clear, consistent, and respected.

**Rules:**
- **Master Brand First:** MedCognito's logo must always appear clearly and with prominence in all collaborations.
- **Equal Balance:** Partner logos should be aligned side by side (horizontal or vertical) with equal visual weight, but never larger than MedCognito's logo.
- **Consistency:** Always use the official MedCognito full-color logo, never alter or merge it with another brand.
- **Spacing:** Maintain clear space around the logo (minimum "M" height rule) to avoid clutter.
- **Messaging:** Frame partnerships as collaborations that benefit students. Suggested phrasing: "MedCognito × Partner: Building pathways for medical success."

**Approved co-branding layouts:**
1. Stacked with × symbol: MedCognito logo above, × separator, partner logo below.
2. Stacked with line separator: MedCognito logo above, orange line, partner logo below.
3. Side by side with | separator: MedCognito logo | Partner logo, horizontally aligned.

---

## 11. Accessibility Standards

- Target WCAG 2.1 AA compliance minimum.
- All interactive elements must be keyboard navigable.
- All images must have descriptive alt text.
- Form inputs must have visible labels (not placeholder-only).
- Color must not be the sole means of conveying information (pair with icons or text).
- Focus states must be visible: use `box-shadow: 0 0 0 3px var(--color-primary-light)` or equivalent.
- Minimum touch target: 44x44px on mobile.
- Text contrast: 4.5:1 for body text, 3:1 for large text (18px+ or 14px bold+).

---

## 12. Dark Mode (Optional)

If implementing dark mode, remap the neutral palette:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-neutral-900: #F5F5F5;
    --color-neutral-700: #D4D4D4;
    --color-neutral-500: #8A8A8A;
    --color-neutral-300: #3A3A3A;
    --color-neutral-100: #2A2A2A;
    --color-neutral-0: #1A1A1A;

    --color-primary-light: rgba(158, 14, 39, 0.15);
    --color-accent-light: rgba(254, 116, 6, 0.15);
  }
}
```

The primary Burgundy and Orange remain unchanged in dark mode — they have sufficient contrast on dark backgrounds.

---

## 13. Exam Reference (for data models and content)

Always use the correct exam names and abbreviations:

| Abbreviation | Full Name | Track |
|---|---|---|
| MCCQE1 / QE1 | Medical Council of Canada Qualifying Examination Part 1 | Doctors |
| NAC OSCE | National Assessment Collaboration Objective Structured Clinical Examination | Doctors |
| TDM | Therapeutic Decision Making | Doctors |
| CaRMS | Canadian Resident Matching Service | Doctors |
| PRA | Practice Readiness Assessment | Doctors |
| CFA | Clinical Field Assessment | Doctors |
| NCLEX-RN | National Council Licensure Examination — Registered Nurse | Nursing |
| PEBC | Pharmacy Examining Board of Canada | Pharmacy |
| OET | Occupational English Test | Cross-track |

---

## 14. Tech Stack Context

Current MedCognito infrastructure for reference when building integrations:

| Layer | Tool |
|---|---|
| Website | WordPress (medcognito.com) |
| LMS | Teachable |
| Blog | blog.medcognito.com (subdomain) |
| Email marketing | Gmail-based (Andrews manages) |
| Design | Michael (in-house) |
| Payments | Teachable native checkout |
| AI tooling | In-house build (exploration phase) |

When building a new application, consider how it connects to or replaces elements of this stack. The LMS (Teachable) is the core platform — any student-facing tool must integrate with or complement it.

---

## 15. Consistency Checklist

Use this checklist before shipping any MedCognito-facing build:

**Visual Identity:**
- [ ] Logo usage follows brand guidelines (correct size, placement, and variations)
- [ ] Approved color palette is consistently applied across all materials
- [ ] Fonts and typography align with brand standards (Poppins headings, Manrope body)
- [ ] Image style and photography maintain a cohesive look and feel
- [ ] Icons and graphics adhere to brand aesthetics (outlined, medical-themed)

**Content & Copy:**
- [ ] Website content aligns with brand messaging and tone
- [ ] Social media posts reflect brand identity and maintain a unified voice
- [ ] Marketing materials (brochures, ads, presentations) maintain consistency
- [ ] Email templates and signatures follow brand guidelines
- [ ] Product descriptions use approved language and terminology

**Messaging & Tone:**
- [ ] Brand voice and tone remain consistent across all content
- [ ] Key messaging reflects brand values and positioning
- [ ] Taglines and slogans are used correctly and consistently ("Together Towards Success" / "Your Success. Our Mission.")
- [ ] Communication is tailored to the target audience while maintaining brand identity

**Internal & External Applications:**
- [ ] Employee communications and internal documents follow brand identity
- [ ] Customer service interactions align with brand voice and values
- [ ] Partnerships and co-branding maintain brand integrity
- [ ] Merchandise and packaging adhere to brand style and messaging

---

*This guide is derived from MedCognito's official Brand Guidelines (2025, designed by Artlas Plus) and operational context. For questions on application, consult Quabs (Operations Lead) or Manuel Ansah (CEO/Co-Founder).*
