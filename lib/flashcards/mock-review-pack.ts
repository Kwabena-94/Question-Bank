// lib/flashcards/mock-review-pack.ts
//
// Post-mock review pack: when a mock attempt is graded, materialize one
// flashcard per missed question (deterministic, LLM-free) into a single
// flashcard set so the learner can review their misses in /flashcards.
//
// Idempotent: if a set already exists for this attempt, no-op.
// Best-effort: failures are logged, never thrown (we don't block submit).

import type { SupabaseClient } from "@supabase/supabase-js";
import { PROMPT_VERSION } from "./prompt";
import { quickCardFromQuestion } from "./quick-card";
import type { Question } from "@/types";

export async function generateMockReviewPack(
  supabase: SupabaseClient,
  opts: {
    userId: string;
    attemptId: string;
    /** Used in the set's display topic. */
    attemptTitle?: string | null;
  }
): Promise<{ created: boolean; set_id?: string; card_count: number }> {
  try {
    // Idempotency: check for any flashcard already linked to this attempt.
    const { data: existing } = await supabase
      .from("flashcards")
      .select("set_id")
      .eq("user_id", opts.userId)
      .eq("source_mock_attempt_id", opts.attemptId)
      .limit(1)
      .maybeSingle();
    if (existing) return { created: false, set_id: existing.set_id, card_count: 0 };

    // Pull wrong answers
    const { data: answers, error: aErr } = await supabase
      .from("mock_attempt_answers")
      .select("question_id, is_correct, position")
      .eq("mock_attempt_id", opts.attemptId)
      .eq("is_correct", false)
      .order("position", { ascending: true });
    if (aErr || !answers?.length) return { created: false, card_count: 0 };

    const qIds = answers.map((a) => a.question_id);
    const { data: questions, error: qErr } = await supabase
      .from("questions")
      .select("id, content, options, correct_option, explanation, clinical_specialty")
      .in("id", qIds);
    if (qErr || !questions?.length) return { created: false, card_count: 0 };

    const byId = new Map(questions.map((q) => [q.id, q as unknown as Question]));
    const cards = answers
      .map((a) => byId.get(a.question_id))
      .filter((q): q is Question => !!q)
      .map((question) => ({
        question,
        card: quickCardFromQuestion({ question }),
      }));
    if (!cards.length) return { created: false, card_count: 0 };

    const topic =
      opts.attemptTitle && opts.attemptTitle.trim().length
        ? `Mock review · ${opts.attemptTitle.trim()}`
        : `Mock review · ${new Date().toLocaleDateString()}`;

    // The attempt link lives on the per-card rows (flashcards.source_mock_attempt_id).
    const { data: setRow, error: setErr } = await supabase
      .from("flashcard_sets")
      .insert({
        user_id: opts.userId,
        topic,
        input_mode: "describe",
        generation_mode: "manual",
        cards: cards.map((c) => c.card),
        model_version: null,
        cache_hit: false,
        cache_key: null,
        prompt_version: PROMPT_VERSION,
      })
      .select("id")
      .single();
    if (setErr || !setRow) {
      console.warn("[mock-review-pack] set insert failed:", setErr?.message);
      return { created: false, card_count: 0 };
    }

    const cardRows = cards.map(({ card, question }, i) => ({
      set_id: setRow.id,
      user_id: opts.userId,
      position: i,
      format: card.format ?? "basic",
      type: card.type,
      context: card.context ?? null,
      front: card.front,
      back: card.back,
      reasoning: card.reasoning,
      mcq_options: null,
      source_question_id: question.id,
      source_mock_attempt_id: opts.attemptId,
    }));
    const { error: cardsErr } = await supabase.from("flashcards").insert(cardRows);
    if (cardsErr) {
      console.warn("[mock-review-pack] cards insert failed:", cardsErr.message);
    }

    return { created: true, set_id: setRow.id, card_count: cardRows.length };
  } catch (e) {
    console.warn("[mock-review-pack] failed:", e);
    return { created: false, card_count: 0 };
  }
}
