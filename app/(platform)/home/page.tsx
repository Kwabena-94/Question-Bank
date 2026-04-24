import Link from "next/link";
import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Home — MedBuddy" };

const READINESS_GOAL = 80;

export default async function HomePage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const [
    { data: readinessRow },
    { count: mocksCompleted },
    { data: attempts },
    { data: inProgressMock },
  ] = await Promise.all([
    supabase
      .from("readiness_scores")
      .select("score, confidence_tier, mocks_completed")
      .eq("user_id", user.id)
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("mock_attempts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "submitted"),
    supabase
      .from("question_attempts")
      .select("is_correct")
      .eq("user_id", user.id)
      .eq("source", "question_bank"),
    supabase
      .from("mock_attempts")
      .select("id, mock_template_id, title")
      .eq("user_id", user.id)
      .eq("status", "in_progress")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const qbCount = attempts?.length ?? 0;
  const correctCount = (attempts ?? []).filter((a) => a.is_correct).length;
  const accuracy = qbCount > 0 ? Math.round((correctCount / qbCount) * 100) : null;
  const pct = readinessRow ? Math.round(Number(readinessRow.score)) : null;
  const goalPct = pct != null ? Math.min(100, Math.round((pct / READINESS_GOAL) * 100)) : 0;

  const hour = new Date().getHours();
  const greeting =
    hour < 5 ? "Good evening" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-poppins text-2xl font-semibold text-neutral-900 tracking-tight">
          {greeting}
        </h1>
        <p className="text-neutral-500 text-sm mt-1">
          Ready to continue your MCCQE1 prep? Here&apos;s where you left off.
        </p>
      </div>

      {/* Resume banner — only if an in-progress mock exists */}
      {inProgressMock && (
        <div className="rounded-lg bg-accent-light border border-accent/25 px-4 py-3 flex items-center gap-3 flex-wrap">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-accent/20 text-accent flex-shrink-0">
            <ClockIcon />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900">
              You have an in-progress mock
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Pick up where you left off before starting something new.
            </p>
          </div>
          <Link
            href={`/mocks/attempt/${inProgressMock.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-accent text-white font-poppins font-medium text-xs shadow-sm hover:opacity-95 active:scale-[0.98] transition-all duration-200"
          >
            Resume
            <ArrowRightIcon />
          </Link>
        </div>
      )}

      {/* Row 1 — Bento quick actions (hero + 2 stacked) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Continue Learning — hero */}
        <Link
          href="/question-bank"
          className="lg:col-span-2 relative overflow-hidden rounded-xl bg-white border border-neutral-200/70 shadow-card hover:shadow-card-hover transition-all duration-200 p-6 group active:scale-[0.995]"
        >
          <div
            aria-hidden
            className="absolute top-0 right-0 w-56 h-56 -mr-10 -mt-10 rounded-full bg-primary/[0.04] blur-2xl pointer-events-none"
          />
          <div className="relative flex items-start gap-4">
            <div className="flex items-center justify-center w-11 h-11 rounded-md bg-primary/[0.08] text-primary flex-shrink-0">
              <BookIcon />
            </div>
            <div className="flex-1 min-w-0">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-primary bg-primary/[0.08] rounded-full px-2.5 py-1">
                Tutor mode
              </span>
              <h2 className="font-poppins font-semibold text-lg text-neutral-900 mt-3 tracking-tight">
                Continue learning
              </h2>
              <p className="text-sm text-neutral-500 mt-1.5 leading-relaxed">
                Build a session from specialty, difficulty, and focus filters. Explanations after each answer.
              </p>
              <span className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-primary">
                Start a session
                <span aria-hidden className="inline-block transition-transform duration-200 group-hover:translate-x-0.5">
                  →
                </span>
              </span>
            </div>
          </div>
        </Link>

        {/* Stacked secondary actions */}
        <div className="grid grid-cols-1 gap-5">
          <Link
            href="/mocks"
            className="rounded-xl bg-white border border-neutral-200/70 shadow-card hover:shadow-card-hover transition-all duration-200 p-5 group active:scale-[0.995] flex items-start gap-3"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-info/[0.08] text-info flex-shrink-0">
              <BarsIcon />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-poppins font-semibold text-sm text-neutral-900">
                Start a mock
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Timed, exam-mode simulation
              </p>
            </div>
            <span aria-hidden className="text-neutral-400 transition-transform duration-200 group-hover:translate-x-0.5 self-center">
              →
            </span>
          </Link>
          <Link
            href="/flashcards"
            className="rounded-xl bg-white border border-neutral-200/70 shadow-card hover:shadow-card-hover transition-all duration-200 p-5 group active:scale-[0.995] flex items-start gap-3"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-accent-light text-accent flex-shrink-0">
              <SparkleIcon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-poppins font-semibold text-sm text-neutral-900">
                Smart flashcards
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Auto-generated from your gaps
              </p>
            </div>
            <span aria-hidden className="text-neutral-400 transition-transform duration-200 group-hover:translate-x-0.5 self-center">
              →
            </span>
          </Link>
        </div>
      </section>

      {/* Row 2 — Readiness + Stats bento */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Readiness card */}
        <div className="lg:col-span-2 rounded-xl bg-white border border-neutral-200/70 shadow-card hover:shadow-card-hover transition-shadow duration-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-poppins font-semibold text-base text-neutral-900 tracking-tight">
              MCCQE1 Readiness
            </h2>
            {pct != null ? (
              <Link
                href="/mocks"
                className="group text-sm font-medium text-info hover:underline inline-flex items-center gap-1"
              >
                View trend
                <span aria-hidden className="inline-block transition-transform duration-200 group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            ) : (
              <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 bg-neutral-100 rounded-full px-2.5 py-1">
                Not enough data
              </span>
            )}
          </div>

          {pct != null ? (
            <div className="mt-5 flex items-center gap-6 flex-wrap">
              <ReadinessDonut pct={pct} />
              <div className="flex-1 min-w-[180px]">
                <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                  Progress toward goal
                </p>
                <p className="font-poppins font-semibold text-2xl text-neutral-900 mt-1 tracking-tight">
                  {goalPct}
                  <span className="text-base font-medium text-neutral-500">% of goal</span>
                </p>
                <div className="mt-3 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${goalPct}%` }}
                  />
                </div>
                <p className="text-xs text-neutral-400 mt-2">
                  Target: {READINESS_GOAL}% readiness
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-500 mt-3 leading-relaxed">
              Answer 50 questions across 2+ specialties to unlock your readiness score.
            </p>
          )}
        </div>

        {/* Stats bento */}
        <div className="grid grid-cols-2 gap-5">
          <StatTile
            kicker="Mocks"
            value={mocksCompleted ?? 0}
            unit="completed"
          />
          <StatTile
            kicker="Accuracy"
            value={accuracy != null ? `${accuracy}%` : "—"}
            unit={qbCount > 0 ? `across ${qbCount}` : "no attempts"}
          />
          <StatTile
            kicker="Questions"
            value={qbCount}
            unit="answered"
          />
          <StatTile
            kicker="Confidence"
            value={
              readinessRow?.confidence_tier
                ? readinessRow.confidence_tier.toString().charAt(0).toUpperCase() +
                  readinessRow.confidence_tier.toString().slice(1)
                : "—"
            }
            unit="tier"
          />
        </div>
      </section>
    </div>
  );
}

// ── Presentational ────────────────────────────────────────────────────────

function StatTile({
  kicker,
  value,
  unit,
}: {
  kicker: string;
  value: string | number;
  unit: string;
}) {
  return (
    <div className="rounded-xl bg-white border border-neutral-200/70 shadow-card hover:shadow-card-hover transition-shadow duration-200 p-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
        {kicker}
      </p>
      <p className="font-poppins font-bold text-2xl text-neutral-900 mt-1 tracking-tight leading-none">
        {value}
      </p>
      <p className="text-xs text-neutral-400 mt-1.5">{unit}</p>
    </div>
  );
}

function ReadinessDonut({ pct }: { pct: number }) {
  const size = 96;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(100, Math.max(0, pct)) / 100);
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#F3F4F6" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#9E0E27"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.2, 0.8, 0.2, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-poppins font-bold text-xl text-neutral-900 leading-none tracking-tight">
          {pct}
        </span>
        <span className="text-[10px] text-neutral-500 mt-0.5">readiness</span>
      </div>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────

function BookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function BarsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="20" x2="4" y2="12" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="20" y1="20" x2="20" y2="8" />
    </svg>
  );
}

function SparkleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
      <path d="M19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
