// lib/flashcards/coverage.ts
//
// "Is this topic already covered?" gate for the QBank "Remember this?"
// inline prompt. Per design decision, we use Policy A: only suggest when
// the user has no flashcards already linked to this question/topic.
//
// Cheap check — small index hits on flashcards.source_question_id and a
// topic-substring scan over the user's recent set topics.

import type { SupabaseClient } from "@supabase/supabase-js";

export interface CoverageInput {
  userId: string;
  questionId: string;
  /** Optional topic hint (clinical_specialty + stem head). Used for fuzzy match. */
  topicHint?: string;
}

export async function isTopicCovered(
  supabase: SupabaseClient,
  input: CoverageInput
): Promise<boolean> {
  // 1. Direct: flashcard already sourced from this question.
  const direct = await supabase
    .from("flashcards")
    .select("id", { head: true, count: "exact" })
    .eq("user_id", input.userId)
    .eq("source_question_id", input.questionId)
    .limit(1);
  if ((direct.count ?? 0) > 0) return true;

  // 2. Fuzzy: user has a recent set whose topic substring-matches the hint.
  if (input.topicHint && input.topicHint.length >= 6) {
    const needle = input.topicHint.toLowerCase().slice(0, 60);
    const { data } = await supabase
      .from("flashcard_sets")
      .select("topic")
      .eq("user_id", input.userId)
      .ilike("topic", `%${needle}%`)
      .limit(1);
    if (data && data.length > 0) return true;
  }
  return false;
}
