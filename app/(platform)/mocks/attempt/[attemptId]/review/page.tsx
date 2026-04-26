import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import MockReview from "@/components/mocks/MockReview";
import { CLINICAL_SPECIALTY_LABELS, type ClinicalSpecialty } from "@/types";

export const metadata: Metadata = { title: "Mock review — MedBuddy" };

interface PageProps {
  params: { attemptId: string };
}

export default async function MockReviewPage({ params }: PageProps) {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: attempt, error } = await supabase
    .from("mock_attempts")
    .select(
      "id, user_id, mock_template_id, status, started_at, submitted_at, time_spent_seconds, score, domain_scores, question_ids, duration_minutes, title"
    )
    .eq("id", params.attemptId)
    .single();

  if (error || !attempt) notFound();
  if (attempt.user_id !== user.id) notFound();
  if (attempt.status === "in_progress") {
    redirect(`/mocks/attempt/${attempt.id}`);
  }

  let template: { title: string; question_ids: string[]; duration_minutes: number };
  if (attempt.mock_template_id) {
    const { data: tpl } = await supabase
      .from("mock_templates")
      .select("id, title, question_ids, duration_minutes")
      .eq("id", attempt.mock_template_id)
      .single();
    if (!tpl) notFound();
    template = {
      title: tpl.title,
      question_ids: tpl.question_ids as string[],
      duration_minutes: tpl.duration_minutes,
    };
  } else {
    if (!attempt.question_ids?.length || !attempt.duration_minutes) notFound();
    template = {
      title: attempt.title ?? "Custom mock",
      question_ids: attempt.question_ids as string[],
      duration_minutes: attempt.duration_minutes,
    };
  }

  const { data: answers } = await supabase
    .from("mock_attempt_answers")
    .select("question_id, selected_option, is_correct, is_flagged, position")
    .eq("mock_attempt_id", attempt.id)
    .order("position");

  const { data: questions } = await supabase
    .from("questions")
    .select("id, content, options, correct_option, explanation, clinical_specialty")
    .in("id", template.question_ids);

  const byId = new Map((questions ?? []).map((q) => [q.id, q]));
  const ordered = (template.question_ids as string[])
    .map((id) => byId.get(id))
    .filter(Boolean);

  const domainScores = (attempt.domain_scores ?? {}) as Record<string, number>;
  const score = Math.round(Number(attempt.score ?? 0));
  const timeMin = Math.round((attempt.time_spent_seconds ?? 0) / 60);

  // Pull the auto-generated mock review pack (if any) so we can show a banner.
  const { data: reviewPackCards } = await supabase
    .from("flashcards")
    .select("id, set_id")
    .eq("user_id", user.id)
    .eq("source_mock_attempt_id", attempt.id);
  const reviewPackCount = reviewPackCards?.length ?? 0;
  const reviewPackSetId = reviewPackCards?.[0]?.set_id ?? null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/mocks"
          className="text-sm text-neutral-500 hover:text-neutral-700"
        >
          ← Back to mocks
        </Link>
        <p className="text-xs text-neutral-400">
          Submitted {new Date(attempt.submitted_at!).toLocaleString()}
        </p>
      </div>

      {/* Score summary */}
      <div className="card-surface p-6 border-t-2 border-primary">
        <p className="text-xs text-neutral-500 mb-1">{template.title}</p>
        <div className="flex items-baseline gap-3">
          <p className="font-poppins font-bold text-4xl text-neutral-900">
            {score}%
          </p>
          <p className="text-sm text-neutral-500">
            in {timeMin} min of {template.duration_minutes}
          </p>
        </div>
        <div className="mt-3 h-2 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full"
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Mock review deck banner — auto-generated from missed questions */}
      {reviewPackCount > 0 && (
        <div className="rounded-xl border border-info/20 bg-info/[0.06] p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-info/80 mb-1">
              Review deck ready
            </p>
            <p className="text-sm text-neutral-700">
              We turned your {reviewPackCount} missed question
              {reviewPackCount === 1 ? "" : "s"} into flashcards. Start spacing
              them now while it&apos;s fresh.
            </p>
          </div>
          <Link
            href="/flashcards/review"
            className="shrink-0 px-4 py-2 rounded-lg bg-info text-white text-sm font-medium hover:bg-info/90 transition-colors"
          >
            Review {reviewPackCount} card{reviewPackCount === 1 ? "" : "s"} →
          </Link>
          {/* keep set id for traceability without rendering it */}
          <span className="hidden" aria-hidden data-set-id={reviewPackSetId ?? ""} />
        </div>
      )}

      {/* Per-specialty breakdown */}
      {Object.keys(domainScores).length > 0 && (
        <div className="card-surface p-6">
          <h2 className="font-poppins font-semibold text-sm text-neutral-900 mb-4">
            By specialty
          </h2>
          <div className="space-y-3">
            {Object.entries(domainScores).map(([k, v]) => {
              const pct = Math.round(Number(v));
              return (
                <div key={k}>
                  <div className="flex justify-between text-xs text-neutral-600 mb-1">
                    <span>
                      {CLINICAL_SPECIALTY_LABELS[k as ClinicalSpecialty] ?? k}
                    </span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Per-question review (client-side filters) */}
      <MockReview
        // @ts-expect-error — jsonb options typed as unknown from postgrest
        questions={ordered}
        answers={(answers ?? []).map((a) => ({
          questionId: a.question_id,
          selected: a.selected_option as "a" | "b" | "c" | "d" | "e" | null,
          isCorrect: !!a.is_correct,
          flagged: !!a.is_flagged,
        }))}
      />
    </div>
  );
}
