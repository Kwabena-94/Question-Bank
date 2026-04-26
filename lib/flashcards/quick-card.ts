// lib/flashcards/quick-card.ts
//
// Deterministic, non-LLM extraction of a flashcard from an existing
// question row. Used by:
//   - POST /api/flashcards/quick-add  (single card from one question)
//   - generateMockReviewPack          (one card per wrong answer)
//
// We keep this LLM-free on purpose: no extra cost, no extra latency,
// and the question already has a curated explanation. The card is a
// "basic" format (front/back) with the explanation as reasoning.

import type { Flashcard, Question } from "@/types";

export interface QuickCardInput {
  question: Pick<
    Question,
    "id" | "content" | "options" | "correct_option" | "explanation" | "clinical_specialty"
  >;
}

export function quickCardFromQuestion({ question }: QuickCardInput): Flashcard {
  const correct = question.options.find((o) => o.key === question.correct_option);
  const correctText = correct ? `${correct.key.toUpperCase()}. ${correct.text}` : "";
  return {
    type: "clinical",
    format: "basic",
    front: question.content.trim(),
    back: correctText || "(see explanation)",
    reasoning: (question.explanation ?? "").trim(),
    context: null,
  };
}

/** A short topic label suitable for cache_key + UI listing. */
export function quickCardTopic(question: Pick<Question, "content" | "clinical_specialty">): string {
  const stem = question.content.replace(/\s+/g, " ").trim();
  const head = stem.length > 80 ? stem.slice(0, 77) + "…" : stem;
  return question.clinical_specialty
    ? `${question.clinical_specialty} · ${head}`
    : head;
}
