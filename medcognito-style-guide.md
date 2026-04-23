# MedCognito Brand Guidelines (Reference)
> Extracted from official Brand Guidelines document (2025). Use this file whenever creating or reviewing any MedCognito-facing content, design briefs, or communications.

---

## Mission & Taglines
- **Mission:** "Your Success. Our Mission."
- **Tagline:** "Together Towards Success"
- **Core purpose:** Provide an efficient and simplified path to Canadian medical licensure through structured knowledge transfer.

---

## Exam Coverage

### For Doctors
| Exam | Full Name |
|---|---|
| **MCCQE1 / QE1** | Medical Council of Canada Qualifying Examination Part 1 |
| **NAC OSCE** | National Assessment Collaboration Objective Structured Clinical Examination |
| **TDM** | Therapeutic Decision Making |
| **CaRMS** | Canadian Resident Matching Service |
| **PRA** | Practice Readiness Assessment |
| **CFA** | Clinical Field Assessment |

### For Nurses
| Exam | Full Name |
|---|---|
| **NCLEX RN** | National Council Licensure Examination – Registered Nurse |

### For Pharmacists
| Exam | Full Name |
|---|---|
| **PEBC** | Pharmacy Examining Board of Canada |

---

## Brand Personality

Three pillars — all must coexist in every touchpoint:

| Pillar | Identity | What It Means |
|---|---|---|
| **Professional** | Mentor | Authoritative, precise, clear. Structured discipline. Students trust MedCognito like a mentor. |
| **Encouraging** | Motivator | Positive, empathetic, motivating. Makes hard preparation feel achievable. Energy and optimism. |
| **Modern** | Innovator | Forward-thinking, embraces digital tools. Combines tradition with fresh approaches. |

---

## Brand Colors

### Primary
| Name | Hex | RGB | CMYK | Role |
|---|---|---|---|---|
| **Ruby Red (Burgundy)** | `#9E0E27` | R-158, G-14, B-39 | C-24, M-100, Y-89, K-21 | Trust, expertise, professionalism — dominant color |
| **Philippine Orange** | `#FE7406` | R-254, G-116, B-6 | C-0, M-68, Y-100, K-0 | Energy, optimism, knowledge — vibrant contrast |

### Secondary
| Name | Hex | RGB | Role |
|---|---|---|---|
| **Nursing Green** | `#2E7D32` | R-46, G-125, B-50 | Sub-brand accent — Nursing (NCLEX-RN) |
| **Blue Sapphire** | `#145A79` | R-20, G-90, B-121 | Sub-brand accent — Pharmacy (PEBC) |
| **Cherry Blossom Pink** | `#F9B4C7` | R-249, G-180, B-199 | Sub-brand accent |

### Sub-brand Accent Colors (Architecture)
- **Doctors:** Burgundy `#9E0E27` + Orange `#FE7406` (core — all doctor tracks)
- **Nursing:** Green `#2E7D32` — NCLEX-RN track
- **Pharmacy:** Blue Sapphire `#145A79` — PEBC track

> ⚠️ **Confirmed correction:** Nursing = Green, Pharmacy = Blue Sapphire. The original brand doc had this inverted — the above values are the confirmed, locked mapping.

**Rule:** No unapproved colors. Burgundy and Orange are always the foundation.

---

## Typography

| Role | Font | Weight |
|---|---|---|
| **H1 Headlines** | Poppins SemiBold | Tracking: -30 |
| **H2 Subheadings** | Poppins Regular | Tracking: -10 |
| **Body Copy** | Manrope Regular | Tracking: 0 |

**Approved weights:** Poppins Regular, Medium, SemiBold, Bold · Manrope Regular, Medium

---

## Voice & Tone

Three modes — match to context:

**1. Professional & Trustworthy**
- Authoritative, clear, reliable
- Clean, structured, polished
- Instills confidence — feels academic and credible

**2. Supportive & Encouraging**
- Positive, motivating, empathetic
- Warm — reminds students they are capable and supported
- Highlights community, mentorship, milestone celebration

**3. Modern & Innovative**
- Forward-thinking, dynamic, adaptable
- Emphasises digital flexibility and fresh learning approaches
- Bold, clear, energetic

---

## Photography & Imagery Rules

**Style:** Crisp, high-quality, natural lighting. Never staged or stock-feeling.

**Subjects:**
- Students in study/exam-prep environments (online and offline)
- Faculty guiding, mentoring, conducting mock exams
- Tools of learning: stethoscopes, notes, digital devices
- Confident candidates at milestones

**Must reflect:** Diversity — international doctors, nurses, pharmacists from varied backgrounds.

**Composition:** Clean, balanced, uncluttered. Text and logo must remain legible.

---

## Logo Rules

**Primary:** Orange ("Med") + Burgundy ("Cognito") on white background.
**Monochrome:** Single-color burgundy or black when full color isn't possible.
**Reversed:** White logo on dark/solid backgrounds.

**Never:**
- Scale logo disproportionately
- Alter text placement or icon
- Use full-color logo on colored backgrounds
- Merge or modify the logo for co-branding

**Safe zone:** Minimum clearspace = height of the letter "M" in the logo on all sides.
**Minimum size:** Print: 25mm wide · Digital: 120px wide

---

## Brand Architecture

**Master brand first.** All programs sit under MedCognito — not as independent brands.

| Sub-offering | Naming convention | Example |
|---|---|---|
| Nursing | MedCognito Nursing | "MedCognito Nursing — empowering nurses for Canadian licensure" |
| Pharmacy | MedCognito Pharmacy | "MedCognito Pharmacy — built for PEBC success" |

**Single channel strategy:** All content published under MedCognito's channels. Use hashtags to segment: `#MedCognitoNursing` · `#MedCognitoPharmacy`

---

## Co-Branding
- MedCognito logo must always appear with prominence
- Partner logos: equal visual weight, never larger than MedCognito
- Suggested framing: *"MedCognito × Partner: Building pathways for medical success."*

---

## UI Design System (App Builds)

> **For any MedCognito app or UI work, the design system is the primary reference — not this file.**
> Read `../medcognito-design-system.md` before writing any component code.
> For targeted tasks, use the Cowork skill files in `../medcognito-design-skills/`.

### Stack
Next.js 14 · TypeScript · Tailwind CSS v3.4 · shadcn/ui · Lucide React · Framer Motion

### Key Token Quick-Reference

**Typography**
- Headings: `font-poppins font-semibold` / `font-bold`, tracking `-0.03em`
- Body: `font-manrope font-normal`, tracking `0`

**Border Radius Scale**
| Token | Value | Use |
|---|---|---|
| `rounded-sm` | 4px | Small inline elements, chips |
| `rounded` | 6px | Buttons, badges, icon wells, inner elements |
| `rounded-md` | 8px | **Card surfaces** |
| `rounded-xl` | 12px | Modals, command palette, drawers |

**Page Background:** `#F4F2EF` (neutral-100) — barely warm off-white so pure white cards lift via shadow without borders.

**Card Design Rules (v3 — April 2026)**
- All card surfaces are white (`bg-card`) — no tinted track backgrounds
- Elevation via neutral shadow only — no colored shadows, no border/stroke
- Color appears in exactly 3 places: 2px top accent stripe, progress bar, CTA button
- Icon wells: always neutral (`bg-secondary/70`) — never colored backgrounds
- Title: always `text-foreground` — never a brand color
- Track identity: text label only (MCCQE1, NCLEX-RN, PEBC) — not color

**Brand Colors vs UI Tokens — important distinction**

The brand has four sub-brand colors (Ruby, Orange, Nursing Green, Pharmacy Blue). In the **app's UI token system**, only Ruby and Orange are active design primitives. Nursing Green and Pharmacy Blue remain in the brand guidelines for print/marketing use but are **not** implemented as UI tokens in `tailwind.config.ts` or used for card surfaces, shadows, or badges in the platform.

| Color | Brand Use | App UI Use |
|---|---|---|
| Ruby `#9E0E27` | Primary brand | Primary CTAs, accent stripes, progress, focus ring |
| Orange `#FE7406` | Secondary brand | Featured CTAs, daily challenge stripe |
| Nursing Green `#2E7D32` | Sub-brand (print/marketing) | **Not a UI token** — track = NCLEX-RN label text |
| Pharmacy Blue `#145A79` | Sub-brand (print/marketing) | **Not a UI token** — track = PEBC label text |

**Component Files**
- Full tailwind.config.ts tokens → `medcognito-design-system.md` § Section 2
- globals.css CSS variables → `medcognito-design-system.md` § Section 3
- Card components (MedCard, TrackCard, StatCard) → `medcognito-design-system.md` § Section 6
- Framer Motion spring configs → `lib/motion.ts` (defined in `medcognito-design-system.md` § Section 8)
- Design skills (token auditor, contrast checker, etc.) → `../medcognito-design-skills/`

---

## Consistency Checklist (Claude's Reference)

When producing any MedCognito-facing content, verify:
- [ ] Tone reflects one or more of the three brand pillars (Professional / Encouraging / Modern)
- [ ] Tagline used correctly when included: "Together Towards Success" or "Your Success. Our Mission."
- [ ] Sub-brand named correctly (e.g. "MedCognito Nursing", not just "Nursing")
- [ ] No unapproved colors specified in design briefs
- [ ] Typography references Poppins (headlines) and Manrope (body) where relevant
- [ ] Photography direction reflects diversity and human warmth
- [ ] Messaging is audience-specific (doctors vs nurses vs pharmacists) but under the master brand
- [ ] Sub-brand track colors: Nursing = Green `#2E7D32`, Pharmacy = Blue Sapphire `#145A79`
