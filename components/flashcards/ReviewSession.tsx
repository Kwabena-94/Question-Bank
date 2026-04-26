"use client";

// components/flashcards/ReviewSession.tsx
//
// Mobile-first review session.
//
// Flow per card:
//   1. Show front (+ context for clinical scenes). User types recall.
//   2. Tap "Reveal" or hit Enter — back of card slides in.
//      Grader chip shows the AI's suggested grade (always visible if available).
//   3. User picks Again / Hard / Good / Easy. We POST /review and advance.
//
// Gestures (touch only):
//   swipe right → Good   (3)
//   swipe left  → Again  (1)
//   swipe up    → Hard   (2)
//   long-press  → Easy   (4)
//
// In-session re-queue: when grade=1 and the API returns in_session=true,
// we shuffle the card to the back of the local queue so the learner sees
// it again before the session ends.

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics/track";
import type { CardFormat, FlashcardMcqOption, Grade } from "@/types";

interface DueCard {
  id: string;
  set_id: string;
  format: CardFormat;
  type: string;
  context: string | null;
  front: string;
  back: string;
  reasoning: string | null;
  mcq_options: FlashcardMcqOption[] | null;
  is_new: boolean;
}

interface Props {
  cards: DueCard[];
}

const GRADE_LABEL: Record<Grade, string> = {
  1: "Again",
  2: "Hard",
  3: "Good",
  4: "Easy",
};

const GRADE_HINT: Record<Grade, string> = {
  1: "<10 min",
  2: "Sooner",
  3: "On track",
  4: "Later",
};

const GRADE_BTN: Record<Grade, string> = {
  1: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
  2: "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100",
  3: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  4: "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100",
};

export default function ReviewSession({ cards: initial }: Props) {
  const router = useRouter();
  const [queue, setQueue] = useState<DueCard[]>(initial);
  const [reveal, setReveal] = useState(false);
  const [answer, setAnswer] = useState("");
  const [grader, setGrader] = useState<{ grade: Grade; rationale: string } | null>(null);
  const [graderLoading, setGraderLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tally, setTally] = useState({ reviewed: 0, again: 0, hard: 0, good: 0, easy: 0 });
  const startedAt = useRef(Date.now());
  const reviewedAny = useRef(false);

  const current = queue[0];
  const remaining = queue.length;

  // Fire review_started once
  useEffect(() => {
    track.flashcardsReviewStarted({ due_count: initial.length });
  }, [initial.length]);

  // ── Grader ──────────────────────────────────────────────────────────────
  const requestGrade = useCallback(async () => {
    if (!current || !answer.trim()) return;
    setGraderLoading(true);
    try {
      const res = await fetch("/api/flashcards/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card_id: current.id, answer_text: answer.trim() }),
      });
      const json = await res.json();
      if (json?.available && json.grade) {
        setGrader({ grade: json.grade as Grade, rationale: json.rationale ?? "" });
      }
    } catch {
      // grader is optional — silently degrade
    } finally {
      setGraderLoading(false);
    }
  }, [current, answer]);

  function onReveal() {
    if (reveal || !current) return;
    setReveal(true);
    if (answer.trim()) void requestGrade();
  }

  // ── Submit grade ────────────────────────────────────────────────────────
  const submit = useCallback(
    async (grade: Grade) => {
      if (!current || submitting) return;
      setSubmitting(true);
      const accepted = grader?.grade === grade;
      try {
        const res = await fetch("/api/flashcards/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            card_id: current.id,
            grade,
            answer_text: answer.trim() || undefined,
            grader_suggestion: grader?.grade,
          }),
        });
        const json = await res.json();
        const inSession = !!json?.in_session;

        track.flashcardReviewed({
          card_id: current.id,
          grade,
          used_grader: !!grader,
          in_session: inSession,
        });
        if (grader) {
          track.flashcardGraderUsed({
            card_id: current.id,
            suggestion: grader.grade,
            accepted,
          });
        }

        setTally((t) => ({
          reviewed: t.reviewed + 1,
          again: t.again + (grade === 1 ? 1 : 0),
          hard: t.hard + (grade === 2 ? 1 : 0),
          good: t.good + (grade === 3 ? 1 : 0),
          easy: t.easy + (grade === 4 ? 1 : 0),
        }));
        reviewedAny.current = true;

        // Advance queue
        setQueue((q) => {
          const [head, ...rest] = q;
          if (inSession && head) return [...rest, head];
          return rest;
        });
        setReveal(false);
        setAnswer("");
        setGrader(null);
      } finally {
        setSubmitting(false);
      }
    },
    [current, answer, grader, submitting]
  );

  // Fire completion event when queue empties
  useEffect(() => {
    if (queue.length === 0 && reviewedAny.current) {
      const duration = Math.max(0, Math.round((Date.now() - startedAt.current) / 1000));
      track.flashcardsReviewCompleted({ ...tally, duration_seconds: duration });
    }
  }, [queue.length, tally]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!current) return;
      if (!reveal) {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          onReveal();
        }
        return;
      }
      if (e.key === "1") submit(1);
      else if (e.key === "2") submit(2);
      else if (e.key === "3" || e.key === " ") {
        e.preventDefault();
        submit(3);
      } else if (e.key === "4") submit(4);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reveal, current, answer, grader]);

  // ── Touch gestures ──────────────────────────────────────────────────────
  const touch = useRef<{ x: number; y: number; t: number; longPress?: number } | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    if (!reveal) return;
    const t = e.touches[0];
    const longPress = window.setTimeout(() => submit(4), 600);
    touch.current = { x: t.clientX, y: t.clientY, t: Date.now(), longPress };
  }
  function clearLongPress() {
    if (touch.current?.longPress) window.clearTimeout(touch.current.longPress);
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (!reveal || !touch.current) return;
    clearLongPress();
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.current.x;
    const dy = t.clientY - touch.current.y;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    touch.current = null;
    const THRESH = 60;
    if (adx < THRESH && ady < THRESH) return; // tap
    if (adx > ady) {
      if (dx > 0) submit(3);
      else submit(1);
    } else {
      if (dy < 0) submit(2);
      // swipe down does nothing
    }
  }
  function onTouchMove() {
    // any movement cancels long-press
    clearLongPress();
    if (touch.current) touch.current.longPress = undefined;
  }

  // ── Empty state ─────────────────────────────────────────────────────────
  if (!current) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-emerald-600 grid place-items-center text-3xl">
          ✓
        </div>
        <div>
          <h2 className="font-poppins text-2xl font-semibold text-neutral-900">
            {reviewedAny.current ? "Session complete" : "Nothing due"}
          </h2>
          <p className="text-neutral-500 mt-2 text-sm">
            {reviewedAny.current
              ? `You reviewed ${tally.reviewed} card${tally.reviewed === 1 ? "" : "s"}.`
              : "You're caught up. Generate a new deck or check back later."}
          </p>
        </div>
        {reviewedAny.current && (
          <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
            <Stat label="Again" value={tally.again} tone="rose" />
            <Stat label="Hard" value={tally.hard} tone="amber" />
            <Stat label="Good" value={tally.good} tone="emerald" />
            <Stat label="Easy" value={tally.easy} tone="sky" />
          </div>
        )}
        <div className="flex justify-center gap-3 pt-2">
          <Link
            href="/flashcards"
            className="px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Back to flashcards
          </Link>
          <button
            onClick={() => router.refresh()}
            className="px-5 py-2.5 rounded-lg border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Check for more
          </button>
        </div>
      </div>
    );
  }

  // ── Active card ─────────────────────────────────────────────────────────
  const totalAtStart = initial.length;
  const done = totalAtStart - remaining;
  const pct = totalAtStart ? Math.round((done / totalAtStart) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span>
          {done + 1} / {totalAtStart}
        </span>
        <Link href="/flashcards" className="hover:text-neutral-700">
          End session
        </Link>
      </div>
      <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Card */}
      <div
        className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 shadow-sm select-none"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchMove={onTouchMove}
        onTouchCancel={clearLongPress}
      >
        {current.context && (
          <div className="mb-4 text-xs uppercase tracking-wide text-neutral-400">
            Scenario
          </div>
        )}
        {current.context && (
          <p className="text-sm text-neutral-600 mb-4 leading-relaxed">{current.context}</p>
        )}

        <CardFront card={current} />

        {/* Recall input */}
        {!reveal && (
          <div className="mt-6 space-y-3">
            <label className="text-xs uppercase tracking-wide text-neutral-400">
              Your recall
            </label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={3}
              placeholder="Type what you remember… (optional)"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 resize-none"
            />
            <button
              onClick={onReveal}
              className="w-full py-3 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Reveal answer
            </button>
          </div>
        )}

        {/* Reveal */}
        {reveal && (
          <div className="mt-6 pt-6 border-t border-neutral-100 space-y-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-neutral-400 mb-2">
                Answer
              </div>
              <p className="text-base text-neutral-900 leading-relaxed whitespace-pre-wrap">
                {current.back}
              </p>
            </div>
            {current.reasoning && (
              <div className="rounded-lg bg-info/[0.06] border border-info/15 p-3">
                <div className="text-xs uppercase tracking-wide text-info/80 mb-1">
                  Why
                </div>
                <p className="text-sm text-neutral-700 leading-relaxed">
                  {current.reasoning}
                </p>
              </div>
            )}

            {/* Grader chip */}
            {(graderLoading || grader) && (
              <div className="rounded-lg bg-info/[0.06] border border-info/15 p-3 text-sm">
                {graderLoading ? (
                  <span className="text-info/80">Grading your recall…</span>
                ) : grader ? (
                  <div>
                    <div className="text-info/90 font-medium mb-1">
                      Suggested: {GRADE_LABEL[grader.grade]}
                    </div>
                    {grader.rationale && (
                      <p className="text-neutral-600 text-xs leading-relaxed">
                        {grader.rationale}
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grade buttons */}
      {reveal && (
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {([1, 2, 3, 4] as Grade[]).map((g) => (
            <button
              key={g}
              onClick={() => submit(g)}
              disabled={submitting}
              className={`py-3 rounded-lg border text-sm font-medium transition-colors disabled:opacity-50 ${GRADE_BTN[g]}`}
            >
              <div>{GRADE_LABEL[g]}</div>
              <div className="text-[10px] opacity-70 mt-0.5">{GRADE_HINT[g]}</div>
            </button>
          ))}
        </div>
      )}

      {reveal && (
        <p className="text-[11px] text-neutral-400 text-center hidden sm:block">
          1 Again · 2 Hard · 3/Space Good · 4 Easy
        </p>
      )}
      {reveal && (
        <p className="text-[11px] text-neutral-400 text-center sm:hidden">
          Swipe right Good · left Again · up Hard · hold Easy
        </p>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────

function CardFront({ card }: { card: DueCard }) {
  if (card.format === "cloze") {
    // Render {{c1::hidden}} as a blank in the front view.
    const masked = card.front.replace(/\{\{c\d+::([^}]*)\}\}/g, "[ … ]");
    return (
      <p className="text-lg sm:text-xl text-neutral-900 leading-relaxed font-medium">
        {masked}
      </p>
    );
  }
  if (card.format === "mcq" && card.mcq_options?.length) {
    return (
      <div className="space-y-3">
        <p className="text-base sm:text-lg text-neutral-900 leading-relaxed font-medium">
          {card.front}
        </p>
        <ul className="space-y-2">
          {card.mcq_options.map((opt) => (
            <li
              key={opt.label}
              className="flex gap-3 px-3 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-700"
            >
              <span className="font-medium text-neutral-500">{opt.label}.</span>
              <span>{opt.text}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <p className="text-lg sm:text-xl text-neutral-900 leading-relaxed font-medium">
      {card.front}
    </p>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "rose" | "amber" | "emerald" | "sky";
}) {
  const toneClass = {
    rose: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-800",
    emerald: "bg-emerald-50 text-emerald-700",
    sky: "bg-sky-50 text-sky-700",
  }[tone];
  return (
    <div className={`rounded-lg ${toneClass} py-2 px-1 text-center`}>
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-[10px] uppercase tracking-wide opacity-80">{label}</div>
    </div>
  );
}
