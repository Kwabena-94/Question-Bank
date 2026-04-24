"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { CLINICAL_SPECIALTY_LABELS, type ClinicalSpecialty } from "@/types";

type OptionKey = "a" | "b" | "c" | "d" | "e";

interface ReviewQuestion {
  id: string;
  content: string;
  options: { key: string; text: string }[];
  correct_option: OptionKey;
  explanation: string;
  clinical_specialty: ClinicalSpecialty | null;
}

interface ReviewAnswer {
  questionId: string;
  selected: OptionKey | null;
  isCorrect: boolean;
  flagged: boolean;
}

interface Props {
  questions: ReviewQuestion[];
  answers: ReviewAnswer[];
}

type Filter = "all" | "incorrect" | "flagged" | "unanswered";

export default function MockReview({ questions, answers }: Props) {
  const [filter, setFilter] = useState<Filter>("all");

  const byQ = useMemo(
    () => new Map(answers.map((a) => [a.questionId, a])),
    [answers]
  );

  const visible = useMemo(() => {
    return questions
      .map((q, i) => ({ q, a: byQ.get(q.id), i }))
      .filter(({ a }) => {
        if (filter === "all") return true;
        if (filter === "incorrect") return a && !a.isCorrect;
        if (filter === "flagged") return a?.flagged;
        if (filter === "unanswered") return !a?.selected;
        return true;
      });
  }, [questions, byQ, filter]);

  const counts = useMemo(() => {
    let incorrect = 0,
      flagged = 0,
      unanswered = 0;
    for (const q of questions) {
      const a = byQ.get(q.id);
      if (!a?.selected) unanswered += 1;
      else if (!a.isCorrect) incorrect += 1;
      if (a?.flagged) flagged += 1;
    }
    return { incorrect, flagged, unanswered, total: questions.length };
  }, [questions, byQ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", `All (${counts.total})`],
            ["incorrect", `Incorrect (${counts.incorrect})`],
            ["flagged", `Flagged (${counts.flagged})`],
            ["unanswered", `Unanswered (${counts.unanswered})`],
          ] as [Filter, string][]
        ).map(([f, label]) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-full border text-xs font-medium transition-colors",
              filter === f
                ? "border-primary bg-primary/8 text-primary"
                : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <div className="card-surface p-6 text-sm text-neutral-500 text-center">
          No questions match this filter.
        </div>
      )}

      <div className="space-y-3">
        {visible.map(({ q, a, i }) => (
          <ReviewCard key={q.id} index={i} question={q} answer={a ?? null} />
        ))}
      </div>
    </div>
  );
}

function ReviewCard({
  index,
  question,
  answer,
}: {
  index: number;
  question: ReviewQuestion;
  answer: ReviewAnswer | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const status: "correct" | "incorrect" | "unanswered" = !answer?.selected
    ? "unanswered"
    : answer.isCorrect
    ? "correct"
    : "incorrect";

  return (
    <div className="card-surface p-5">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start justify-between gap-4 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs mb-1">
            <span className="text-neutral-400">Q{index + 1}</span>
            {question.clinical_specialty && (
              <span className="text-neutral-400">
                · {CLINICAL_SPECIALTY_LABELS[question.clinical_specialty]}
              </span>
            )}
            {answer?.flagged && (
              <span className="text-amber-600">· ★ Flagged</span>
            )}
          </div>
          <p className="text-sm text-neutral-800 line-clamp-2">
            {question.content}
          </p>
        </div>
        <span
          className={cn(
            "flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full",
            status === "correct" && "bg-green-50 text-green-700",
            status === "incorrect" && "bg-red-50 text-red-700",
            status === "unanswered" && "bg-neutral-100 text-neutral-500"
          )}
        >
          {status === "correct"
            ? "Correct"
            : status === "incorrect"
            ? "Incorrect"
            : "Skipped"}
        </span>
      </button>

      {expanded && (
        <div className="mt-5 pt-5 border-t border-neutral-100 space-y-4">
          <p className="text-sm leading-relaxed text-neutral-800 whitespace-pre-wrap">
            {question.content}
          </p>
          <div className="space-y-2">
            {question.options.map((opt) => {
              const key = opt.key as OptionKey;
              const isCorrect = key === question.correct_option;
              const isChosen = answer?.selected === key;
              const isWrongChoice = isChosen && !isCorrect;
              return (
                <div
                  key={key}
                  className={cn(
                    "px-4 py-2.5 rounded-md border text-sm flex items-start gap-3",
                    isCorrect && "border-green-300 bg-green-50 text-green-900",
                    isWrongChoice && "border-red-300 bg-red-50 text-red-900",
                    !isCorrect && !isWrongChoice && "border-neutral-200 text-neutral-600"
                  )}
                >
                  <span
                    className={cn(
                      "flex-shrink-0 w-6 h-6 rounded-full border text-xs font-medium flex items-center justify-center uppercase bg-white",
                      isCorrect && "border-green-400 text-green-700",
                      isWrongChoice && "border-red-400 text-red-700",
                      !isCorrect && !isWrongChoice && "border-neutral-300 text-neutral-500"
                    )}
                  >
                    {key}
                  </span>
                  <span className="flex-1">{opt.text}</span>
                  {isChosen && (
                    <span className="text-xs text-neutral-500">your answer</span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="pt-3 border-t border-neutral-100">
            <p className="text-xs font-medium text-neutral-500 mb-2">Explanation</p>
            <div className="prose prose-sm max-w-none text-neutral-700 whitespace-pre-wrap">
              {question.explanation}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
