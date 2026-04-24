"use client";

import { useState, useEffect, useMemo, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { saveMockAnswer, submitMockAttempt } from "@/lib/mocks/actions";
import { track } from "@/lib/analytics/track";

type OptionKey = "a" | "b" | "c" | "d" | "e";

interface QuestionLite {
  id: string;
  content: string;
  options: { key: string; text: string }[];
}

interface InitialAnswer {
  questionId: string;
  selected: OptionKey | null;
  flagged: boolean;
}

interface Props {
  attemptId: string;
  title: string;
  startedAtIso: string;
  durationMinutes: number;
  questions: QuestionLite[];
  initialAnswers: InitialAnswer[];
}

export default function MockRunner({
  attemptId,
  title,
  startedAtIso,
  durationMinutes,
  questions,
  initialAnswers,
}: Props) {
  const router = useRouter();
  const deadlineMs = useMemo(
    () => new Date(startedAtIso).getTime() + durationMinutes * 60 * 1000,
    [startedAtIso, durationMinutes]
  );

  const initialMap = useMemo(() => {
    const m = new Map<string, { selected: OptionKey | null; flagged: boolean }>();
    for (const a of initialAnswers) {
      m.set(a.questionId, { selected: a.selected, flagged: a.flagged });
    }
    return m;
  }, [initialAnswers]);

  const [index, setIndex] = useState(0);
  const [selectedMap, setSelectedMap] = useState<Map<string, OptionKey | null>>(
    () => new Map(Array.from(initialMap).map(([k, v]) => [k, v.selected]))
  );
  const [flaggedMap, setFlaggedMap] = useState<Map<string, boolean>>(
    () => new Map(Array.from(initialMap).map(([k, v]) => [k, v.flagged]))
  );
  const [now, setNow] = useState(() => Date.now());
  const [showReview, setShowReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const question = questions[index];

  // Tick clock every second
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const msRemaining = Math.max(0, deadlineMs - now);
  const timeUp = msRemaining === 0;

  // Auto-submit when time expires
  useEffect(() => {
    if (timeUp && !submitting) {
      void handleSubmit(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeUp]);

  const persist = useCallback(
    async (
      questionId: string,
      patch: { selected?: OptionKey | null; flagged?: boolean }
    ) => {
      try {
        await saveMockAnswer({
          attemptId,
          questionId,
          selected: patch.selected ?? null,
          flagged: patch.flagged,
        });
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to save answer.");
      }
    },
    [attemptId]
  );

  function handleSelect(key: OptionKey) {
    if (!question || timeUp) return;
    const next = new Map(selectedMap);
    next.set(question.id, key);
    setSelectedMap(next);
    void persist(question.id, { selected: key });
  }

  function handleToggleFlag() {
    if (!question || timeUp) return;
    const nextVal = !flaggedMap.get(question.id);
    const next = new Map(flaggedMap);
    next.set(question.id, nextVal);
    setFlaggedMap(next);
    void persist(question.id, { flagged: nextVal });
  }

  async function handleSubmit(forced = false) {
    if (submitting) return;
    const answered = Array.from(selectedMap.values()).filter(Boolean).length;
    if (!forced) {
      const unanswered = questions.length - answered;
      const ok = window.confirm(
        unanswered === 0
          ? "Submit your mock for grading?"
          : `You have ${unanswered} unanswered question${
              unanswered === 1 ? "" : "s"
            }. Submit anyway?`
      );
      if (!ok) return;
    }
    setSubmitting(true);
    setError(null);
    startTransition(async () => {
      try {
        const result = await submitMockAttempt(attemptId);
        track.mockSubmitted({
          mock_id: attemptId,
          score: result.score,
          duration_seconds: result.time_spent_seconds,
        });
        router.push(`/mocks/attempt/${attemptId}/review`);
        router.refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to submit.");
        setSubmitting(false);
      }
    });
  }

  if (!question) return null;

  const answeredCount = Array.from(selectedMap.values()).filter(Boolean).length;
  const flaggedCount = Array.from(flaggedMap.values()).filter(Boolean).length;

  const mm = Math.floor(msRemaining / 60000);
  const ss = Math.floor((msRemaining % 60000) / 1000);
  const hh = Math.floor(mm / 60);
  const clock = hh > 0
    ? `${hh}:${String(mm % 60).padStart(2, "0")}:${String(ss).padStart(2, "0")}`
    : `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  const timerLow = msRemaining < 5 * 60 * 1000;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="card-surface p-4 flex items-center justify-between">
        <div>
          <p className="font-poppins font-semibold text-sm text-neutral-900">
            {title}
          </p>
          <p className="text-xs text-neutral-500">
            {answeredCount} / {questions.length} answered · {flaggedCount} flagged
          </p>
        </div>
        <div
          className={cn(
            "font-mono tabular-nums text-xl font-semibold px-3 py-1.5 rounded-md",
            timerLow
              ? "bg-red-50 text-red-700"
              : "bg-neutral-100 text-neutral-900"
          )}
        >
          {clock}
        </div>
      </div>

      {showReview ? (
        <ReviewGrid
          questions={questions}
          selectedMap={selectedMap}
          flaggedMap={flaggedMap}
          onJump={(i) => {
            setIndex(i);
            setShowReview(false);
          }}
          onSubmit={() => handleSubmit()}
          onClose={() => setShowReview(false)}
          submitting={pending || submitting}
        />
      ) : (
        <div className="card-surface p-6 space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-neutral-500">
              Question {index + 1} of {questions.length}
            </p>
            <button
              type="button"
              onClick={handleToggleFlag}
              className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-full border transition-colors",
                flaggedMap.get(question.id)
                  ? "border-amber-300 bg-amber-50 text-amber-700"
                  : "border-neutral-200 text-neutral-500 hover:border-neutral-300"
              )}
            >
              {flaggedMap.get(question.id) ? "★ Flagged" : "☆ Flag"}
            </button>
          </div>

          <p className="text-sm leading-relaxed text-neutral-800 whitespace-pre-wrap">
            {question.content}
          </p>

          <div className="space-y-2">
            {question.options.map((opt) => {
              const key = opt.key as OptionKey;
              const isSelected = selectedMap.get(question.id) === key;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={timeUp}
                  onClick={() => handleSelect(key)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-md border text-sm flex items-start gap-3 transition-colors",
                    isSelected
                      ? "border-primary bg-primary/8 text-primary"
                      : "border-neutral-200 hover:border-neutral-300 text-neutral-700",
                    timeUp && "opacity-60 cursor-not-allowed"
                  )}
                >
                  <span
                    className={cn(
                      "flex-shrink-0 w-6 h-6 rounded-full border text-xs font-medium flex items-center justify-center uppercase",
                      isSelected
                        ? "border-primary text-primary"
                        : "border-neutral-300 text-neutral-500"
                    )}
                  >
                    {key}
                  </span>
                  <span className="flex-1">{opt.text}</span>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setIndex(Math.max(0, index - 1))}
              disabled={index === 0}
              className="px-4 py-2 border border-neutral-200 rounded-md text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setShowReview(true)}
              className="text-sm text-neutral-600 hover:text-neutral-900"
            >
              Review & submit
            </button>
            <button
              type="button"
              onClick={() =>
                setIndex(Math.min(questions.length - 1, index + 1))
              }
              disabled={index === questions.length - 1}
              className="px-4 py-2 bg-neutral-900 text-white rounded-md text-sm hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewGrid({
  questions,
  selectedMap,
  flaggedMap,
  onJump,
  onSubmit,
  onClose,
  submitting,
}: {
  questions: QuestionLite[];
  selectedMap: Map<string, OptionKey | null>;
  flaggedMap: Map<string, boolean>;
  onJump: (i: number) => void;
  onSubmit: () => void;
  onClose: () => void;
  submitting: boolean;
}) {
  const answeredCount = Array.from(selectedMap.values()).filter(Boolean).length;
  const unanswered = questions.length - answeredCount;
  const flaggedCount = Array.from(flaggedMap.values()).filter(Boolean).length;

  return (
    <div className="card-surface p-6 space-y-5">
      <div>
        <h2 className="font-poppins font-semibold text-base text-neutral-900">
          Review answers
        </h2>
        <p className="text-sm text-neutral-500 mt-1">
          {answeredCount} answered · {unanswered} unanswered · {flaggedCount} flagged.
          Click any number to jump back.
        </p>
      </div>

      <div className="grid grid-cols-10 gap-2">
        {questions.map((q, i) => {
          const selected = selectedMap.get(q.id);
          const flagged = flaggedMap.get(q.id);
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onJump(i)}
              className={cn(
                "relative aspect-square rounded-md border text-xs font-medium transition-colors",
                selected
                  ? "border-primary bg-primary/8 text-primary"
                  : "border-neutral-200 text-neutral-500 hover:border-neutral-300"
              )}
            >
              {i + 1}
              {flagged && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-white" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-neutral-200 rounded-md text-sm text-neutral-700 hover:bg-neutral-50"
        >
          Back to question
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="px-5 py-2.5 bg-primary text-white font-poppins font-medium text-sm rounded-md hover:bg-primary-hover transition-colors disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit mock"}
        </button>
      </div>
    </div>
  );
}
