"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  recordQBAttempt,
  completeQBSession,
} from "@/lib/question-bank/actions";
import {
  CLINICAL_SPECIALTY_LABELS,
  type Question,
} from "@/types";
import { track } from "@/lib/analytics/track";
import RememberThisPrompt from "./RememberThisPrompt";

type OptionKey = "a" | "b" | "c" | "d" | "e";

interface Result {
  selected: OptionKey;
  correct: OptionKey;
  isCorrect: boolean;
}

interface Props {
  sessionId: string;
  questions: Question[];
}

export default function SessionRunner({ sessionId, questions }: Props) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<OptionKey | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [results, setResults] = useState<Record<string, Result>>({});
  const [pending, startTransition] = useTransition();
  const [startedAt, setStartedAt] = useState<number>(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [coverageByQ, setCoverageByQ] = useState<Record<string, boolean>>({});

  const question = questions[index];
  const isLast = index === questions.length - 1;

  // Reset per-question state when advancing
  useEffect(() => {
    setSelected(null);
    setResult(null);
    setError(null);
    setStartedAt(Date.now());
  }, [index]);

  const correctCount = useMemo(
    () => Object.values(results).filter((r) => r.isCorrect).length,
    [results]
  );

  if (!question) {
    return (
      <div className="max-w-5xl mx-auto card-surface p-6">
        <p className="text-neutral-500 text-sm">No questions in this session.</p>
      </div>
    );
  }

  function handleSubmit() {
    if (!selected || result) return;
    setError(null);
    const timeSpent = Math.round((Date.now() - startedAt) / 1000);
    startTransition(async () => {
      try {
        const r = await recordQBAttempt({
          sessionId,
          questionId: question.id,
          selected,
          timeSpentSeconds: timeSpent,
        });
        const next: Result = {
          selected,
          correct: r.correct,
          isCorrect: r.isCorrect,
        };
        setResult(next);
        setResults((prev) => ({ ...prev, [question.id]: next }));
        track.questionAnswered({
          question_id: question.id,
          is_correct: r.isCorrect,
          domain: question.domain ?? undefined,
          session_id: sessionId,
          source: "manual",
        });
        // Wrong-streak tracker for "Remember this?" escalation.
        if (r.isCorrect) {
          setWrongStreak(0);
        } else {
          setWrongStreak((s) => s + 1);
          // Lazy coverage check (only on wrong answers)
          const topicHint = [
            question.clinical_specialty ?? null,
            question.content.slice(0, 60),
          ]
            .filter(Boolean)
            .join(" ");
          fetch("/api/flashcards/coverage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question_id: question.id, topic_hint: topicHint }),
          })
            .then((r2) => (r2.ok ? r2.json() : null))
            .then((j) => {
              if (j && typeof j.covered === "boolean") {
                setCoverageByQ((prev) => ({ ...prev, [question.id]: j.covered }));
              }
            })
            .catch(() => {
              /* silent */
            });
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to record answer.");
      }
    });
  }

  function handleNext() {
    if (!isLast) {
      setIndex(index + 1);
      return;
    }
    startTransition(async () => {
      await completeQBSession(sessionId);
      router.push(`/question-bank/session/${sessionId}/summary`);
      router.refresh();
    });
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-neutral-500">
            Question {index + 1} of {questions.length}
          </p>
          {question.clinical_specialty && (
            <p className="text-xs text-neutral-400 mt-0.5">
              {CLINICAL_SPECIALTY_LABELS[question.clinical_specialty]}
              {question.difficulty && ` · ${question.difficulty}`}
            </p>
          )}
        </div>
        <p className="text-xs text-neutral-500">
          <span className="text-primary font-medium">{correctCount}</span>
          <span className="text-neutral-300"> / </span>
          {Object.keys(results).length} correct
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{
            width: `${((index + (result ? 1 : 0)) / questions.length) * 100}%`,
          }}
        />
      </div>

      {/* Stem */}
      <div className="card-surface p-6">
        <p className="text-sm leading-relaxed text-neutral-800 whitespace-pre-wrap">
          {question.content}
        </p>

        <div className="mt-5 space-y-2">
          {question.options.map((opt) => {
            const key = opt.key as OptionKey;
            const isSelected = selected === key;
            const isCorrect = result && key === result.correct;
            const isWrongChoice =
              result && key === result.selected && !result.isCorrect;

            return (
              <button
                key={key}
                type="button"
                disabled={!!result}
                onClick={() => setSelected(key)}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-md border text-sm transition-colors flex items-start gap-3",
                  !result &&
                    isSelected &&
                    "border-primary bg-primary/8 text-primary",
                  !result &&
                    !isSelected &&
                    "border-neutral-200 hover:border-neutral-300 text-neutral-700",
                  isCorrect && "border-green-300 bg-green-50 text-green-900",
                  isWrongChoice && "border-red-300 bg-red-50 text-red-900",
                  result && !isCorrect && !isWrongChoice && "border-neutral-200 text-neutral-500"
                )}
              >
                <span
                  className={cn(
                    "flex-shrink-0 w-6 h-6 rounded-full border text-xs font-medium flex items-center justify-center uppercase",
                    isSelected && !result && "border-primary text-primary",
                    isCorrect && "border-green-400 text-green-700 bg-white",
                    isWrongChoice && "border-red-400 text-red-700 bg-white",
                    !isSelected && !result && "border-neutral-300 text-neutral-500"
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
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">
            {error}
          </div>
        )}

        {/* Explanation (tutor mode) */}
        {result && (
          <div className="mt-6 pt-6 border-t border-neutral-100">
            <div
              className={cn(
                "inline-flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-full mb-3",
                result.isCorrect
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              )}
            >
              {result.isCorrect
                ? "Correct"
                : `Incorrect — answer: ${result.correct.toUpperCase()}`}
            </div>
            <div className="prose prose-sm max-w-none text-neutral-700 whitespace-pre-wrap">
              {question.explanation}
            </div>

            {/* Remember this? — only on wrong answers, only when not already covered.
                Escalated copy after 3 consecutive wrong answers. */}
            {!result.isCorrect && coverageByQ[question.id] === false && (
              <RememberThisPrompt
                questionId={question.id}
                escalated={wrongStreak >= 3}
              />
            )}
          </div>
        )}

        {/* Action */}
        <div className="mt-6 flex justify-end">
          {!result ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!selected || pending}
              className="px-5 py-2.5 bg-primary text-white font-poppins font-medium text-sm rounded-md hover:bg-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {pending ? "Checking…" : "Submit"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              disabled={pending}
              className="px-5 py-2.5 bg-neutral-900 text-white font-poppins font-medium text-sm rounded-md hover:bg-neutral-800 transition-colors disabled:opacity-60"
            >
              {isLast ? "Finish" : "Next question"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
