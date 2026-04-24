import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClinicalSpecialty } from "@/types";

/**
 * Recompute a user's readiness snapshot across all submitted mock attempts
 * (template + custom). Per-attempt scores decay by half every 30 days so
 * recent performance dominates.
 */
export async function recomputeReadiness(
  supabase: SupabaseClient,
  userId: string
) {
  const { data: attempts } = await supabase
    .from("mock_attempts")
    .select("id, score, domain_scores, submitted_at")
    .eq("user_id", userId)
    .eq("status", "submitted");

  if (!attempts?.length) return;

  const now = Date.now();
  const HALF_LIFE_DAYS = 30;

  let wSum = 0;
  let scoreWSum = 0;
  const perSpec: Record<string, { w: number; s: number }> = {};

  for (const a of attempts) {
    if (!a.submitted_at || a.score == null) continue;
    const ageDays = (now - new Date(a.submitted_at).getTime()) / 86_400_000;
    const w = Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
    const score = Number(a.score);
    wSum += w;
    scoreWSum += score * w;

    const dom = (a.domain_scores ?? {}) as Record<string, number>;
    for (const [k, v] of Object.entries(dom)) {
      perSpec[k] ??= { w: 0, s: 0 };
      perSpec[k].w += w;
      perSpec[k].s += Number(v) * w;
    }
  }

  if (wSum === 0) return;

  const overall = Math.round((scoreWSum / wSum) * 100) / 100;
  const domainScores: Record<string, number> = {};
  for (const [k, v] of Object.entries(perSpec)) {
    if (v.w > 0) domainScores[k] = Math.round((v.s / v.w) * 100) / 100;
  }

  const mocksCompleted = attempts.length;
  const domainsCovered = Object.keys(domainScores).filter(
    (k) => k !== "unknown"
  ).length;

  // Confidence: mocks_completed drives the tier (exam needs ≥ 2 full mocks
  // before we can call a score "reliable").
  const confidence_tier: "early" | "developing" | "reliable" =
    mocksCompleted >= 3 ? "reliable" : mocksCompleted >= 1 ? "developing" : "early";

  await supabase.from("readiness_scores").insert({
    user_id: userId,
    score: overall,
    confidence_tier,
    domain_scores: domainScores,
    questions_answered: 0,
    domains_covered: domainsCovered,
    mocks_completed: mocksCompleted,
  });
}

export const READINESS_SPEC_ORDER: ClinicalSpecialty[] = [
  "medicine",
  "surgery",
  "peds",
  "obgyn",
  "psych",
  "pop_health",
];
