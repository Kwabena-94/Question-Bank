import Link from "next/link";
import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CLINICAL_SPECIALTY_LABELS, type ClinicalSpecialty } from "@/types";
import ReadinessViewTracker from "@/components/mocks/ReadinessViewTracker";

export const metadata: Metadata = { title: "Mocks — MedBuddy" };

export default async function MocksIndexPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: templates } = await supabase
    .from("mock_templates")
    .select("id, slug, title, description, type, question_count, duration_minutes")
    .eq("is_published", true)
    .order("question_count", { ascending: true });

  const { data: inProgress } = await supabase
    .from("mock_attempts")
    .select("id, mock_template_id")
    .eq("user_id", user.id)
    .eq("status", "in_progress");

  const { data: submitted } = await supabase
    .from("mock_attempts")
    .select("id, mock_template_id, title, submitted_at, score")
    .eq("user_id", user.id)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false })
    .limit(3);

  const { count: totalSubmitted } = await supabase
    .from("mock_attempts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "submitted");

  const { data: readinessRow } = await supabase
    .from("readiness_scores")
    .select("score, confidence_tier, domain_scores, mocks_completed, computed_at")
    .eq("user_id", user.id)
    .order("computed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const inProgressByTemplate = new Map(
    (inProgress ?? []).map((a) => [a.mock_template_id, a.id])
  );
  const customInProgress = (inProgress ?? []).find((a) => a.mock_template_id === null);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-poppins text-2xl font-semibold text-neutral-900">
            Mocks
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Timed, exam-mode simulations. Explanations unlock after you submit.
          </p>
        </div>
      </div>

      {readinessRow && (
        <>
          <ReadinessViewTracker tier={readinessRow.confidence_tier} />
          <ReadinessCard
            score={Number(readinessRow.score)}
            tier={readinessRow.confidence_tier as "early" | "developing" | "reliable"}
            mocks={readinessRow.mocks_completed}
            domainScores={
              (readinessRow.domain_scores ?? {}) as Record<string, number>
            }
          />
        </>
      )}

      <div className="grid grid-cols-1 gap-4">
        {(templates ?? []).map((t) => {
          const resumeId = inProgressByTemplate.get(t.id);
          return (
            <div key={t.id} className="card-surface p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-poppins font-semibold text-base text-neutral-900">
                    {t.title}
                  </h2>
                  {t.description && (
                    <p className="text-sm text-neutral-500 mt-1">
                      {t.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
                    <span>{t.question_count} questions</span>
                    <span>·</span>
                    <span>{t.duration_minutes} min</span>
                  </div>
                </div>
                {resumeId ? (
                  <Link
                    href={`/mocks/attempt/${resumeId}`}
                    className="flex-shrink-0 px-4 py-2.5 bg-accent text-white font-poppins font-medium text-sm rounded-md hover:opacity-90 transition-opacity"
                  >
                    Resume
                  </Link>
                ) : (
                  <Link
                    href={`/mocks/${t.id}/start`}
                    className="flex-shrink-0 px-4 py-2.5 bg-primary text-white font-poppins font-medium text-sm rounded-md hover:bg-primary-hover transition-colors"
                  >
                    Start mock
                  </Link>
                )}
              </div>
            </div>
          );
        })}

        <div className="card-surface p-6 border-dashed border-2 border-neutral-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-poppins font-semibold text-base text-neutral-900">
                Custom mock
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                Pick count and specialties. Time prorates at ~1.4 min/Q. Counts toward readiness.
              </p>
            </div>
            {customInProgress ? (
              <Link
                href={`/mocks/attempt/${customInProgress.id}`}
                className="flex-shrink-0 px-4 py-2.5 bg-accent text-white font-poppins font-medium text-sm rounded-md hover:opacity-90 transition-opacity"
              >
                Resume
              </Link>
            ) : (
              <Link
                href="/mocks/custom"
                className="flex-shrink-0 px-4 py-2.5 border border-neutral-300 text-neutral-800 font-poppins font-medium text-sm rounded-md hover:bg-neutral-50 transition-colors"
              >
                Build mock
              </Link>
            )}
          </div>
        </div>
      </div>

      {submitted && submitted.length > 0 && (
        <div className="card-surface p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-poppins font-semibold text-sm text-neutral-900">
              Recent results
            </h2>
            {(totalSubmitted ?? 0) > 3 && (
              <Link
                href="/mocks/history"
                className="text-xs text-primary hover:underline"
              >
                View all ({totalSubmitted}) →
              </Link>
            )}
          </div>
          <ul className="divide-y divide-neutral-100">
            {submitted.map((s) => {
              const label = s.mock_template_id
                ? templates?.find((x) => x.id === s.mock_template_id)?.title ?? "Mock"
                : s.title ?? "Custom mock";
              return (
                <li key={s.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-800">{label}</p>
                    <p className="text-xs text-neutral-400">
                      {new Date(s.submitted_at!).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-poppins font-semibold text-lg text-neutral-900">
                      {Math.round(Number(s.score ?? 0))}%
                    </span>
                    <Link
                      href={`/mocks/attempt/${s.id}/review`}
                      className="text-sm text-primary hover:underline"
                    >
                      Review
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function ReadinessCard({
  score,
  tier,
  mocks,
  domainScores,
}: {
  score: number;
  tier: "early" | "developing" | "reliable";
  mocks: number;
  domainScores: Record<string, number>;
}) {
  const pct = Math.round(score);
  const tierLabel =
    tier === "reliable"
      ? "Reliable"
      : tier === "developing"
      ? "Developing"
      : "Early signal";

  return (
    <div className="card-surface p-6 border-t-2 border-primary">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-neutral-500">Exam readiness</p>
          <div className="flex items-baseline gap-3 mt-1">
            <p className="font-poppins font-bold text-3xl text-neutral-900">{pct}%</p>
            <span className="text-xs text-neutral-500">
              {tierLabel} · {mocks} mock{mocks === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-3 h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
      </div>
      {Object.keys(domainScores).length > 0 && (
        <div className="mt-5 space-y-2">
          {Object.entries(domainScores)
            .filter(([k]) => k !== "unknown")
            .sort((a, b) => Number(a[1]) - Number(b[1]))
            .map(([k, v]) => {
              const p = Math.round(Number(v));
              return (
                <div key={k}>
                  <div className="flex justify-between text-xs text-neutral-600 mb-1">
                    <span>
                      {CLINICAL_SPECIALTY_LABELS[k as ClinicalSpecialty] ?? k}
                    </span>
                    <span>{p}%</span>
                  </div>
                  <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${p}%` }} />
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
