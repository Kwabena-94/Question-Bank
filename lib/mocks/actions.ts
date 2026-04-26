"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ClinicalSpecialty } from "@/types";
import { recomputeReadiness } from "./readiness";
import { generateMockReviewPack } from "@/lib/flashcards/mock-review-pack";

/**
 * Start or resume an attempt for the given template.
 * Redirects to the runner.
 */
export async function startOrResumeMock(templateId: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("mock_attempts")
    .select("id")
    .eq("user_id", user.id)
    .eq("mock_template_id", templateId)
    .eq("status", "in_progress")
    .maybeSingle();

  if (existing) redirect(`/mocks/attempt/${existing.id}`);

  const { data: template, error: tErr } = await supabase
    .from("mock_templates")
    .select("id, question_ids, is_published")
    .eq("id", templateId)
    .single();
  if (tErr || !template) throw new Error("Template not found.");
  if (!template.is_published) throw new Error("Mock is not available.");
  if (!Array.isArray(template.question_ids) || !template.question_ids.length) {
    throw new Error("Mock has no questions.");
  }

  const { data: attempt, error: aErr } = await supabase
    .from("mock_attempts")
    .insert({
      user_id: user.id,
      mock_template_id: template.id,
      status: "in_progress",
    })
    .select("id")
    .single();
  if (aErr || !attempt) throw new Error(aErr?.message ?? "Could not start mock.");

  await prefillAnswers(supabase, attempt.id, template.question_ids as string[]);

  redirect(`/mocks/attempt/${attempt.id}`);
}

const CUSTOM_COUNT_CHOICES = [20, 40, 60, 80, 115, 230] as const;
const MIN_PER_QUESTION = 1.4;

const customSchema = z.object({
  count: z.number().int().refine((n) => (CUSTOM_COUNT_CHOICES as readonly number[]).includes(n), {
    message: "Invalid question count.",
  }),
  specialties: z
    .array(z.enum(["medicine", "obgyn", "peds", "pop_health", "psych", "surgery"]))
    .default([]),
  difficulty: z.enum(["easy", "medium", "hard", "mixed"]).default("mixed"),
});

/**
 * Build a custom mock from the user's filters and start it.
 * Timer = ceil(count × 1.4 min).
 */
export async function startCustomMock(input: z.input<typeof customSchema>) {
  const user = await requireAuth();
  const parsed = customSchema.parse(input);
  const supabase = await createClient();

  // Block if user already has a custom attempt in flight.
  const { data: existing } = await supabase
    .from("mock_attempts")
    .select("id")
    .eq("user_id", user.id)
    .is("mock_template_id", null)
    .eq("status", "in_progress")
    .maybeSingle();
  if (existing) redirect(`/mocks/attempt/${existing.id}`);

  let q = supabase
    .from("questions")
    .select("id")
    .eq("is_published", true);
  if (parsed.specialties.length) {
    q = q.in("clinical_specialty", parsed.specialties);
  }
  if (parsed.difficulty !== "mixed") {
    q = q.eq("difficulty", parsed.difficulty);
  }
  // Pull a generous candidate pool, then random-sample client-side.
  const { data: pool, error: pErr } = await q.limit(2000);
  if (pErr) throw new Error(pErr.message);
  if (!pool || pool.length < parsed.count) {
    throw new Error(
      `Only ${pool?.length ?? 0} questions match those filters — choose fewer or broaden specialties.`
    );
  }

  const ids = pool.map((r) => r.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  const questionIds = ids.slice(0, parsed.count);
  const durationMinutes = Math.ceil(parsed.count * MIN_PER_QUESTION);
  const title = parsed.specialties.length
    ? `Custom · ${parsed.count} Q · ${parsed.specialties.length === 1 ? parsed.specialties[0] : "multi-specialty"}`
    : `Custom · ${parsed.count} Q`;

  const { data: attempt, error: aErr } = await supabase
    .from("mock_attempts")
    .insert({
      user_id: user.id,
      mock_template_id: null,
      status: "in_progress",
      question_ids: questionIds,
      duration_minutes: durationMinutes,
      title,
      custom_config: {
        count: parsed.count,
        specialties: parsed.specialties,
        difficulty: parsed.difficulty,
        duration_minutes: durationMinutes,
      },
    })
    .select("id")
    .single();
  if (aErr || !attempt) throw new Error(aErr?.message ?? "Could not start custom mock.");

  await prefillAnswers(supabase, attempt.id, questionIds);
  redirect(`/mocks/attempt/${attempt.id}`);
}

async function prefillAnswers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  attemptId: string,
  questionIds: string[]
) {
  const rows = questionIds.map((qid, idx) => ({
    mock_attempt_id: attemptId,
    question_id: qid,
    position: idx,
  }));
  const BATCH = 200;
  for (let i = 0; i < rows.length; i += BATCH) {
    const { error } = await supabase
      .from("mock_attempt_answers")
      .insert(rows.slice(i, i + BATCH));
    if (error) throw new Error(error.message);
  }
}

const saveSchema = z.object({
  attemptId: z.string().uuid(),
  questionId: z.string().uuid(),
  selected: z.enum(["a", "b", "c", "d", "e"]).nullable(),
  flagged: z.boolean().optional(),
  timeSpentDelta: z.number().int().nonnegative().optional(),
});

export async function saveMockAnswer(input: z.input<typeof saveSchema>) {
  const user = await requireAuth();
  const parsed = saveSchema.parse(input);
  const supabase = await createClient();

  const { data: attempt, error } = await supabase
    .from("mock_attempts")
    .select("id, user_id, status")
    .eq("id", parsed.attemptId)
    .single();
  if (error || !attempt) throw new Error("Attempt not found.");
  if (attempt.user_id !== user.id) throw new Error("Not your attempt.");
  if (attempt.status !== "in_progress") {
    throw new Error("Attempt is no longer in progress.");
  }

  const update: Record<string, unknown> = {};
  if (parsed.selected !== undefined) update.selected_option = parsed.selected;
  if (parsed.flagged !== undefined) update.is_flagged = parsed.flagged;

  if (Object.keys(update).length) {
    const { error: uErr } = await supabase
      .from("mock_attempt_answers")
      .update(update)
      .eq("mock_attempt_id", parsed.attemptId)
      .eq("question_id", parsed.questionId);
    if (uErr) throw new Error(uErr.message);
  }

  return { ok: true };
}

/**
 * Grade and finalize the attempt. Idempotent: calling on a submitted
 * attempt returns the existing score without re-grading.
 */
export async function submitMockAttempt(attemptId: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: attempt, error } = await supabase
    .from("mock_attempts")
    .select(
      "id, user_id, mock_template_id, status, started_at, score, domain_scores, title"
    )
    .eq("id", attemptId)
    .single();
  if (error || !attempt) throw new Error("Attempt not found.");
  if (attempt.user_id !== user.id) throw new Error("Not your attempt.");
  if (attempt.status !== "in_progress") {
    return {
      id: attempt.id,
      score: Number(attempt.score ?? 0),
      status: attempt.status,
      time_spent_seconds: 0,
    };
  }

  const { data: answers, error: aErr } = await supabase
    .from("mock_attempt_answers")
    .select("id, question_id, selected_option, position")
    .eq("mock_attempt_id", attemptId);
  if (aErr) throw new Error(aErr.message);
  if (!answers?.length) throw new Error("No answers to grade.");

  const qIds = answers.map((a) => a.question_id);
  const { data: questions, error: qErr } = await supabase
    .from("questions")
    .select("id, correct_option, clinical_specialty")
    .in("id", qIds);
  if (qErr) throw new Error(qErr.message);

  const byId = new Map(questions!.map((q) => [q.id, q]));
  let correct = 0;
  const perSpecialty: Record<string, { total: number; correct: number }> = {};
  const updates: { id: string; is_correct: boolean }[] = [];

  for (const ans of answers) {
    const q = byId.get(ans.question_id);
    if (!q) continue;
    const isCorrect =
      !!ans.selected_option && ans.selected_option === q.correct_option;
    updates.push({ id: ans.id, is_correct: isCorrect });
    if (isCorrect) correct += 1;
    const s = (q.clinical_specialty as ClinicalSpecialty | null) ?? "unknown";
    perSpecialty[s] ??= { total: 0, correct: 0 };
    perSpecialty[s].total += 1;
    if (isCorrect) perSpecialty[s].correct += 1;
  }

  for (const u of updates) {
    await supabase
      .from("mock_attempt_answers")
      .update({ is_correct: u.is_correct })
      .eq("id", u.id);
  }

  const scorePct = (correct / answers.length) * 100;
  const started = new Date(attempt.started_at).getTime();
  const submittedAt = new Date();
  const timeSpent = Math.round((submittedAt.getTime() - started) / 1000);

  const domainScores: Record<string, number> = {};
  for (const [k, v] of Object.entries(perSpecialty)) {
    domainScores[k] = Math.round((v.correct / v.total) * 10000) / 100;
  }

  const { error: updErr } = await supabase
    .from("mock_attempts")
    .update({
      status: "submitted",
      submitted_at: submittedAt.toISOString(),
      time_spent_seconds: timeSpent,
      score: scorePct,
      domain_scores: domainScores,
    })
    .eq("id", attempt.id);
  if (updErr) throw new Error(updErr.message);

  // Refresh readiness snapshot; failures here shouldn't block the submit.
  try {
    await recomputeReadiness(supabase, user.id);
  } catch (e) {
    console.error("readiness recompute failed", e);
  }

  // Materialize the mock-review flashcard pack (one card per missed
  // question). Best-effort, idempotent — never blocks the submit.
  try {
    await generateMockReviewPack(supabase, {
      userId: user.id,
      attemptId: attempt.id,
      attemptTitle: (attempt as { title?: string | null }).title ?? null,
    });
  } catch (e) {
    console.error("mock review pack failed", e);
  }

  return {
    id: attempt.id,
    score: scorePct,
    status: "submitted" as const,
    time_spent_seconds: timeSpent,
  };
}
