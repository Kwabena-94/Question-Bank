import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClinicalSpecialty } from "@/types";
import { CLINICAL_SPECIALTY_LABELS } from "@/types";

export interface NextMockRecommendation {
  templateId: string;
  templateTitle: string;
  reason: string;
}

export interface SmartWarmupRecommendation {
  specialty: ClinicalSpecialty;
  specialtyLabel: string;
  count: number;
  durationMinutes: number;
  reason: string;
}

export interface MockRecommendations {
  nextMock: NextMockRecommendation | null;
  smartWarmup: SmartWarmupRecommendation | null;
}

/**
 * v1: rule-based. Pick the lowest-scoring specialty from the latest readiness
 * snapshot and (a) route to the shortest unfinished template whose title
 * mentions that specialty, (b) propose a 25-question warm-up in that specialty.
 *
 * The return shape is deliberately stable so a v2 LLM-backed generator can be
 * swapped in without touching any caller. Consumers read only {templateId,
 * reason} for nextMock and {specialty, count, reason} for smartWarmup.
 */
export async function getMockRecommendations(
  supabase: SupabaseClient,
  userId: string
): Promise<MockRecommendations> {
  const { data: readiness } = await supabase
    .from("readiness_scores")
    .select("domain_scores")
    .eq("user_id", userId)
    .order("computed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const domainScores = (readiness?.domain_scores ?? {}) as Record<string, number>;
  const ranked = Object.entries(domainScores)
    .filter(([k]) => k !== "unknown")
    .sort((a, b) => Number(a[1]) - Number(b[1]));
  const weakest = ranked[0]?.[0] as ClinicalSpecialty | undefined;

  const { data: templates } = await supabase
    .from("mock_templates")
    .select("id, title, question_count, duration_minutes")
    .eq("is_published", true)
    .order("question_count", { ascending: true });

  const { data: doneAttempts } = await supabase
    .from("mock_attempts")
    .select("mock_template_id")
    .eq("user_id", userId)
    .eq("status", "submitted");
  const doneTemplates = new Set(
    (doneAttempts ?? [])
      .map((a) => a.mock_template_id)
      .filter((x): x is string => !!x)
  );

  const unfinished = (templates ?? []).filter((t) => !doneTemplates.has(t.id));

  let nextMock: NextMockRecommendation | null = null;
  if (weakest && unfinished.length > 0) {
    const label = CLINICAL_SPECIALTY_LABELS[weakest];
    const match = unfinished.find((t) =>
      t.title.toLowerCase().includes(label.toLowerCase())
    );
    const pick = match ?? unfinished[0];
    nextMock = {
      templateId: pick.id,
      templateTitle: pick.title,
      reason: match
        ? `Your ${label} score is lowest (${Math.round(
            Number(domainScores[weakest])
          )}%). This mock targets that area.`
        : `Recommended as your next step.`,
    };
  } else if (unfinished.length > 0) {
    const pick = unfinished[0];
    nextMock = {
      templateId: pick.id,
      templateTitle: pick.title,
      reason: "A short timed mock to establish your baseline.",
    };
  }

  let smartWarmup: SmartWarmupRecommendation | null = null;
  if (weakest) {
    const label = CLINICAL_SPECIALTY_LABELS[weakest];
    const count = 25;
    smartWarmup = {
      specialty: weakest,
      specialtyLabel: label,
      count,
      durationMinutes: Math.ceil(count * 1.4),
      reason: `Focus on ${label}. Build a ${count}-question warm-up to strengthen weak areas.`,
    };
  }

  const result: MockRecommendations = { nextMock, smartWarmup };

  // Cache the recommendation. Best-effort: a failure here shouldn't break
  // the page load. Upsert keeps only one row per (user_id, kind).
  try {
    await supabase.from("user_insights").upsert(
      {
        user_id: userId,
        kind: "mock_recommendations",
        payload: result,
        computed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,kind" }
    );
  } catch {
    // swallow — cache is non-essential
  }

  return result;
}
