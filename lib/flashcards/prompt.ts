// lib/flashcards/prompt.ts
//
// System blocks lifted verbatim from the legacy medcognito-proxy
// (api/flashcards-v3.js / v4.js). These are the IP — they encode MCC blueprint
// weighting, MCC question style, and CTFPHC screening recommendations that
// shape every generation.
//
// PROMPT_VERSION is part of the cache key. Bump it whenever the prompt or
// model changes — old cache entries become inaccessible (and naturally expire
// after 30 days).

import type { CardFormat, CardType } from "@/types";

// IMPORTANT: bump this when the prompt content, model, or temperature changes.
export const PROMPT_VERSION = "2026-04-26.v2";

// Model + sampling parameters. Encoded into the version above so changes
// invalidate the cache.
export const MODEL_NAME = "claude-haiku-4-5";
export const MODEL_TEMPERATURE = 0.5;
export const MODEL_MAX_TOKENS = 4000;

export const ALLOWED_CARD_TYPES: readonly CardType[] = [
  "definition",
  "clinical",
  "investigation",
  "management",
  "complications",
  "differentials",
  "referral",
];

export const ALLOWED_CARD_FORMATS: readonly CardFormat[] = ["basic", "cloze", "mcq"];

// ── System block 1: MCC framework ───────────────────────────────────────────
const MCC_FRAMEWORK =
  "MCC EXAMINATION OBJECTIVES CORE FRAMEWORK MCCQE Part I 2025: " +
  "MCQ-only format as CDM section was removed April 2025. " +
  "Organized under CanMEDS roles. " +
  "BLUEPRINT WEIGHTING: Medicine 28%, Surgery 18%, Psychiatry 10%, " +
  "Obstetrics and Gynaecology 10%, Paediatrics 12%, Preventive Medicine 12%, " +
  "Ethics/Legal/Professional 10%. " +
  "HIGH YIELD CLINICAL PRESENTATIONS: " +
  "Cardiovascular: chest pain, dyspnea, palpitations, syncope, edema, hypertension, shock. " +
  "Respiratory: cough, hemoptysis, wheezing, respiratory distress, hypoxemia. " +
  "GI: abdominal pain, GI bleeding, jaundice, diarrhea, nausea. " +
  "Neurological: headache, altered LOC, seizure, weakness, dizziness. " +
  "Endocrine: polyuria, weight change, fatigue. " +
  "Mental Health: depressed mood, anxiety, psychosis, suicidal ideation, substance use. " +
  "OB/Gyn: vaginal bleeding, pelvic pain, amenorrhea, prenatal care. " +
  "Pediatric: fever, failure to thrive, developmental delay. " +
  "CANADIAN PRIORITIES: Mandatory reporting TB, STIs, child abuse, gunshot wounds. " +
  "Ethics: capacity assessment, substitute decision-makers, advance directives. " +
  "Indigenous health: SDOH, culturally safe care. " +
  "Healthcare system: provincial formularies, OHIP, RAMQ.";

// ── System block 2: MCC question reference ─────────────────────────────────
const MCC_QUESTIONS_REFERENCE =
  "MCC OFFICIAL QUESTION STYLE AND REASONING REFERENCE " +
  "(55 official MCCQE Part I practice questions, 2025): " +
  "Use these as the gold standard for how to frame clinical vignettes, " +
  "construct answer rationales, and write reasoning explanations. " +
  "KEY PATTERNS FROM MCC QUESTIONS: " +
  "(1) Clinical vignettes always include: age, sex, presenting complaint with duration, " +
  "key positive and negative findings, and end with " +
  "'Which one of the following is the best next step?' or similar. " +
  "(2) Distractors are clinically plausible but wrong for a specific reason " +
  "always explained in the rationale. " +
  "(3) Ethics/professionalism questions prioritize: patient autonomy and consent first, " +
  "then safety, then disclosure. " +
  "(4) Canadian-specific content tested includes: SOGC guidelines for obstetrics, " +
  "CANMAT for psychiatry, CCS for cardiology, CTFPHC for screening, " +
  "NACI for immunization, CMPA for medico-legal. " +
  "(5) Reasoning style: always explain WHY the correct answer is right. " +
  "Reference specific Canadian guidelines by name.";

// ── System block 3: CTFPHC + card format rules ─────────────────────────────
const CTFPHC_GUIDELINES =
  "CANADIAN TASK FORCE ON PREVENTIVE HEALTH CARE (CTFPHC) KEY SCREENING RECOMMENDATIONS: " +
  "Cervical cancer: Pap smear every 3 years ages 25-69. " +
  "Breast cancer: Mammography NOT recommended under 50 for average risk; " +
  "ages 50-74 every 2-3 years with shared decision-making. " +
  "Colorectal cancer: FOBT/FIT every 2 years OR flexible sigmoidoscopy every 10 years " +
  "for ages 50-74; colonoscopy only for high-risk. " +
  "Lung cancer: Annual low-dose CT for ages 55-74 with 30+ pack-year history " +
  "who smoke or quit less than 15 years ago. " +
  "Prostate cancer: PSA screening NOT routinely recommended; shared decision-making for men 50+. " +
  "Hypertension: Screen all adults 18+ at every visit. " +
  "Diabetes: Screen adults 40+ or high risk using fasting glucose or HbA1c. " +
  "Depression adults: Insufficient evidence for routine screening without adequate follow-up systems. " +
  "Depression perinatal: Routine standardized tool screening NOT recommended; " +
  "ask about well-being instead. " +
  "Obesity: Screen all adults; offer referral to intensive behavioral programs for BMI 30+. " +
  "Chlamydia/Gonorrhea: Screen sexually active women 24 and under and older women with risk factors. " +
  "Immunization: Follow NACI schedule not ACIP.";

const CARD_FORMAT_RULES =
  "CANADIAN RULES: Use Canadian drug names (salbutamol not albuterol). " +
  "Follow CCS SOGC CANMAT CPS guidelines. Canadian spelling.\n\n" +
  "CARD FORMAT:\n" +
  "- context: brief Canadian clinical scene-setter\n" +
  "- front: question or challenge; clinical cards use MCC vignette style\n" +
  "- back: direct answer, under 50 words\n" +
  "- reasoning: 1-2 sentences, cite Canadian guideline by name, under 40 words\n\n" +
  "Choose the best format per card:\n" +
  "- basic: definition, recall, single-fact mastery\n" +
  "- cloze: clinical vignettes where 1-2 key terms are the high-yield retrieval " +
  "target. Format the front with {{c1::answer}} markers. Back must list the same " +
  "terms in order.\n" +
  "- mcq: when the topic has 3 clinically-meaningful distractors. Provide 4 " +
  "options with exactly 1 correct=true.\n" +
  "Aim for about 50% basic, 30% cloze, and 20% mcq across a 10-card set.\n\n" +
  "Never repeat same card type more than 3 times. " +
  "Flag Choosing Wisely Canada on investigation cards.";

// ── Anthropic tool spec — guarantees parseable output ──────────────────────
export const FLASHCARD_TOOL = {
  name: "deliver_flashcards",
  description: "Deliver the generated flashcard set to the MedCognito application.",
  input_schema: {
    type: "object",
    properties: {
      cards: {
        type: "array",
        minItems: 5,
        maxItems: 10,
        items: {
          type: "object",
          properties: {
            type: { type: "string", enum: [...ALLOWED_CARD_TYPES] },
            format: { type: "string", enum: [...ALLOWED_CARD_FORMATS] },
            context: { type: "string" },
            front: { type: "string" },
            back: { type: "string" },
            reasoning: { type: "string" },
            mcq_options: {
              type: "array",
              minItems: 4,
              maxItems: 4,
              items: {
                type: "object",
                properties: {
                  label: { type: "string" },
                  text: { type: "string" },
                  correct: { type: "boolean" },
                  explanation: { type: "string" },
                },
                required: ["label", "text", "correct"],
              },
            },
          },
          required: ["type", "format", "context", "front", "back", "reasoning"],
        },
      },
    },
    required: ["cards"],
  },
} as const;

// ── System blocks (Anthropic prompt-caching ephemeral) ─────────────────────
//
// Each block is wrapped with cache_control: ephemeral so the input tokens
// are billed at ~10% of the standard rate on repeat calls (5-min server-side
// cache window). The content of each block is stable across requests, which
// is what makes the cache effective.

interface SystemBlock {
  type: "text";
  text: string;
  cache_control?: { type: "ephemeral" };
}

export function buildSystemBlocks(cwcContext: string | null): SystemBlock[] {
  const blocks: SystemBlock[] = [
    {
      type: "text",
      text:
        "You are a medical education assistant for MedCognito, a Canadian healthcare " +
        "learning platform. Learners are MCCQE Part 1 / NAC OSCE students and IMGs.\n\n" +
        MCC_FRAMEWORK,
      cache_control: { type: "ephemeral" },
    },
    {
      type: "text",
      text: MCC_QUESTIONS_REFERENCE,
      cache_control: { type: "ephemeral" },
    },
    {
      type: "text",
      text: CTFPHC_GUIDELINES + "\n\n" + CARD_FORMAT_RULES,
      cache_control: { type: "ephemeral" },
    },
  ];

  // Per-request CWC grounding is NOT cached — varies per topic.
  if (cwcContext) {
    blocks.push({ type: "text", text: cwcContext });
  }

  return blocks;
}

// ── User prompt builder ─────────────────────────────────────────────────────
export function buildUserPrompt(
  topic: string,
  mode: "describe" | "paste"
): string {
  if (mode === "paste") {
    return `Extract 5-10 flashcard pairs from this text. Use deliver_flashcards. Text: ${topic}`;
  }
  return `Create 10 flashcards about: ${topic}. Mix types. Use deliver_flashcards.`;
}
