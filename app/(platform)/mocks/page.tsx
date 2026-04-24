import Link from "next/link";
import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import ReadinessViewTracker from "@/components/mocks/ReadinessViewTracker";
import ExamReadinessCard from "@/components/mocks/ExamReadinessCard";
import SmartWarmupButton from "@/components/mocks/SmartWarmupButton";
import CustomMockForm from "@/components/mocks/CustomMockForm";
import InProgressBanner from "@/components/mocks/InProgressBanner";
import { getMockRecommendations } from "@/lib/mocks/recommend";

export const metadata: Metadata = { title: "Mocks — MedBuddy" };

const READINESS_GOAL = 80;

export default async function MocksIndexPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const [
    { data: templates },
    { data: inProgress },
    { data: submitted },
    { count: totalSubmitted },
    { data: readinessRow },
    { data: readinessHistory },
    recommendations,
  ] = await Promise.all([
    supabase
      .from("mock_templates")
      .select("id, slug, title, description, question_count, duration_minutes")
      .eq("is_published", true)
      .order("question_count", { ascending: true }),
    supabase
      .from("mock_attempts")
      .select("id, mock_template_id")
      .eq("user_id", user.id)
      .eq("status", "in_progress"),
    supabase
      .from("mock_attempts")
      .select("id, mock_template_id, title, submitted_at, score")
      .eq("user_id", user.id)
      .eq("status", "submitted")
      .order("submitted_at", { ascending: false })
      .limit(4),
    supabase
      .from("mock_attempts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "submitted"),
    supabase
      .from("readiness_scores")
      .select("score, confidence_tier, mocks_completed, computed_at")
      .eq("user_id", user.id)
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("readiness_scores")
      .select("score, computed_at")
      .eq("user_id", user.id)
      .order("computed_at", { ascending: false })
      .limit(8),
    getMockRecommendations(supabase, user.id),
  ]);

  const inProgressByTemplate = new Map(
    (inProgress ?? []).map((a) => [a.mock_template_id, a.id])
  );
  const customInProgress = (inProgress ?? []).find(
    (a) => !a.mock_template_id
  );

  const recommendedTemplate =
    recommendations.nextMock &&
    (templates ?? []).find((t) => t.id === recommendations.nextMock!.templateId);

  const startMockHref = recommendedTemplate
    ? `/mocks/${recommendedTemplate.id}/start`
    : templates?.[0]
    ? `/mocks/${templates[0].id}/start`
    : "#custom-builder";

  const sparklinePoints = [...(readinessHistory ?? [])]
    .reverse()
    .map((r) => ({ score: Number(r.score), at: r.computed_at }));

  const pct = readinessRow ? Math.round(Number(readinessRow.score)) : 0;
  const goalPct = Math.min(100, Math.round((pct / READINESS_GOAL) * 100));
  const mocksCompleted = readinessRow?.mocks_completed ?? 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {readinessRow && (
        <ReadinessViewTracker tier={readinessRow.confidence_tier} />
      )}

      {/* Header */}
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-poppins text-2xl font-semibold text-neutral-900 tracking-tight">
            Mocks
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Timed, exam-mode simulations. Track readiness, learn, and improve.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/mocks/library"
            className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <LibraryIcon />
            Mock library
          </Link>
          <Link
            href="#custom-builder"
            scroll
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-poppins font-medium text-info border border-info/25 bg-info/[0.04] hover:bg-info/[0.08] hover:border-info/40 active:scale-[0.98] transition-all duration-200"
          >
            <SparkleIcon className="w-4 h-4" />
            Custom Quiz
          </Link>
          <Link
            href={startMockHref}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-poppins font-medium text-white bg-primary shadow-sm hover:bg-primary-hover active:scale-[0.98] transition-all duration-200"
          >
            <PlayIcon />
            Start mock
          </Link>
        </div>
      </header>

      {customInProgress && (
        <InProgressBanner attemptId={customInProgress.id} />
      )}

      {/* Row 1 — Recommended Next Mock + Exam Readiness */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recommended Next Mock — hero */}
        <div className="relative overflow-hidden rounded-xl bg-white border border-neutral-200/70 shadow-card hover:shadow-card-hover transition-shadow duration-200 p-6 group">
          {/* subtle brand wash */}
          <div
            aria-hidden
            className="absolute top-0 right-0 w-56 h-56 -mr-10 -mt-10 rounded-full bg-primary/[0.04] blur-2xl pointer-events-none"
          />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-primary bg-primary/[0.08] rounded-full px-2.5 py-1">
              <SparkleIcon className="w-3 h-3" />
              Recommended next mock
            </span>

            {recommendedTemplate ? (
              <>
                <h2 className="font-poppins font-semibold text-xl text-neutral-900 mt-4 tracking-tight">
                  {recommendedTemplate.title}
                </h2>
                {recommendations.nextMock?.reason && (
                  <p className="text-sm text-neutral-500 mt-1.5 max-w-xl leading-relaxed">
                    {recommendations.nextMock.reason}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-5">
                  <Chip
                    icon={<ListIcon />}
                    label={`${recommendedTemplate.question_count} Questions`}
                  />
                  <Chip
                    icon={<ClockIcon />}
                    label={`${recommendedTemplate.duration_minutes} Minutes`}
                  />
                  <Chip icon={<BarsIcon />} label="Timed · Exam mode" />
                </div>

                <div className="mt-6">
                  {inProgressByTemplate.get(recommendedTemplate.id) ? (
                    <Link
                      href={`/mocks/attempt/${inProgressByTemplate.get(recommendedTemplate.id)}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-accent text-white font-poppins font-medium text-sm shadow-sm hover:opacity-95 active:scale-[0.98] transition-all duration-200 group-hover:translate-x-0.5"
                    >
                      <PlayIcon /> Resume this mock
                    </Link>
                  ) : (
                    <Link
                      href={`/mocks/${recommendedTemplate.id}/start`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-white font-poppins font-medium text-sm shadow-sm hover:bg-primary-hover active:scale-[0.98] transition-all duration-200 group-hover:translate-x-0.5"
                    >
                      <PlayIcon /> Start this mock
                    </Link>
                  )}
                </div>
              </>
            ) : (
              <>
                <h2 className="font-poppins font-semibold text-xl text-neutral-900 mt-4 tracking-tight">
                  You&apos;re all caught up
                </h2>
                <p className="text-sm text-neutral-500 mt-1.5 max-w-xl">
                  No recommended mock right now. Build a custom quiz to keep
                  sharpening weak areas.
                </p>
                <Link
                  href="#custom-builder"
                  className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 border border-neutral-300 text-neutral-800 font-poppins font-medium text-sm rounded-md hover:bg-neutral-50 transition-colors"
                >
                  Build a custom quiz
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Exam Readiness — matches screenshot */}
        <div>
          <ExamReadinessCard
            pct={pct}
            mocksCompleted={mocksCompleted}
            goalPct={goalPct}
            goalTarget={READINESS_GOAL}
            trendPoints={sparklinePoints}
          />
        </div>
      </section>

      {/* Row 2 — Smart Recommendation strip */}
      {recommendations.smartWarmup && (
        <section
          className="rounded-xl p-5 text-white shadow-card flex items-center gap-5 flex-wrap transition-shadow duration-200 hover:shadow-card-hover"
          style={{
            background:
              "linear-gradient(135deg, #145A79 0%, #0F445C 60%, #0C3A4F 100%)",
          }}
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 flex-shrink-0 border border-white/15">
            <SparkleIcon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-[240px]">
            <p className="text-[11px] font-medium uppercase tracking-wider text-white/70">
              Smart Recommendation
            </p>
            <p className="font-poppins font-semibold text-sm mt-0.5 leading-snug">
              {recommendations.smartWarmup.reason}
            </p>
          </div>
          <SmartWarmupButton
            specialty={recommendations.smartWarmup.specialty}
            count={recommendations.smartWarmup.count}
            durationMinutes={recommendations.smartWarmup.durationMinutes}
            label={`Build ${recommendations.smartWarmup.count}-question warm-up`}
          />
        </section>
      )}

      {/* Row 3 — Recent Results + Custom Quiz Builder */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-5" id="custom-builder">
        {/* Recent Results */}
        <div className="lg:col-span-2 rounded-xl bg-white border border-neutral-200/70 shadow-card hover:shadow-card-hover transition-shadow duration-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-poppins font-semibold text-sm text-neutral-900">
              Recent Results
            </h2>
            {(totalSubmitted ?? 0) > 0 && (
              <Link
                href="/mocks/history"
                className="text-xs text-neutral-500 hover:text-info hover:underline font-medium transition-colors"
              >
                View all{totalSubmitted ? ` (${totalSubmitted})` : ""} →
              </Link>
            )}
          </div>

          {submitted && submitted.length > 0 ? (
            <ul className="-mx-2">
              {submitted.map((s, i) => {
                const label = s.mock_template_id
                  ? templates?.find((x) => x.id === s.mock_template_id)
                      ?.title ?? "Mock"
                  : s.title ?? "Custom mock";
                const score = Math.round(Number(s.score ?? 0));
                return (
                  <li
                    key={s.id}
                    className={
                      i > 0 ? "border-t border-neutral-100/80" : undefined
                    }
                  >
                    <Link
                      href={`/mocks/attempt/${s.id}/review`}
                      className="flex items-center justify-between gap-3 px-2 py-3 rounded-md hover:bg-neutral-50/80 transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-800 truncate group-hover:text-neutral-900">
                          {label}
                        </p>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {new Date(s.submitted_at!).toLocaleDateString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </div>
                      <ScoreBadge score={score} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-neutral-500">
                No mocks submitted yet.
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Your results will appear here.
              </p>
            </div>
          )}
        </div>

        {/* Custom Quiz Builder */}
        <div className="lg:col-span-3">
          <CustomMockForm />
        </div>
      </section>
    </div>
  );
}

// ── Presentational helpers ────────────────────────────────────────────────

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-neutral-700 bg-neutral-50 border border-neutral-200/70">
      <span className="text-neutral-400">{icon}</span>
      {label}
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 70
      ? "bg-green-50 text-green-700 border-green-100"
      : score >= 55
      ? "bg-amber-50 text-amber-700 border-amber-100"
      : "bg-red-50 text-red-700 border-red-100";
  const label = score >= 70 ? "Pass" : score >= 55 ? "Borderline" : "Below";
  return (
    <div className="flex flex-col items-end gap-1 flex-shrink-0">
      <span className="font-poppins font-semibold text-base text-neutral-900 leading-none">
        {score}%
      </span>
      <span
        className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${tone}`}
      >
        {label}
      </span>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────

function SparkleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
      <path d="M19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="6 4 20 12 6 20 6 4" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function BarsIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" y1="20" x2="4" y2="12" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="20" y1="20" x2="20" y2="8" />
    </svg>
  );
}

function LibraryIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
