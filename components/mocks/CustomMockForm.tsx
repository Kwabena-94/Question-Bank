"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { startCustomMock } from "@/lib/mocks/actions";
import { track } from "@/lib/analytics/track";
import { CLINICAL_SPECIALTY_LABELS, type ClinicalSpecialty } from "@/types";

const COUNTS = [20, 40, 60, 80, 115, 230] as const;
const MIN_PER_Q = 1.4;
const DIFFICULTIES = ["easy", "medium", "hard", "mixed"] as const;
type Difficulty = (typeof DIFFICULTIES)[number];

const SPECS: ClinicalSpecialty[] = [
  "medicine",
  "surgery",
  "peds",
  "obgyn",
  "psych",
  "pop_health",
];

export default function CustomMockForm() {
  const [count, setCount] = useState<(typeof COUNTS)[number]>(40);
  const [difficulty, setDifficulty] = useState<Difficulty>("mixed");
  const [specialties, setSpecialties] = useState<ClinicalSpecialty[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const duration = Math.ceil(count * MIN_PER_Q);

  function toggleSpec(s: ClinicalSpecialty) {
    setSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function handleStart() {
    setError(null);
    track.mockStarted("custom", {
      count,
      difficulty,
      specialties: specialties.join(",") || "all",
    });
    startTransition(async () => {
      try {
        await startCustomMock({ count, specialties, difficulty });
      } catch (e: unknown) {
        const msg =
          e instanceof Error ? e.message : "Could not start custom mock.";
        if (msg.includes("NEXT_REDIRECT")) return;
        setError(msg);
      }
    });
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200/70 shadow-card hover:shadow-card-hover transition-shadow duration-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 flex items-center gap-2 border-b border-neutral-100">
        <SparkleIcon className="w-4 h-4 text-info" />
        <h3 className="font-poppins font-semibold text-sm text-neutral-900">
          Custom Quiz Builder
        </h3>
        <span className="ml-auto text-xs text-neutral-400">
          Tailor your own practice quiz
        </span>
      </div>

      {/* Body */}
      <div className="p-6 space-y-6">
        <ControlGroup
          label="Question count"
          hint={`${duration} min (~1.4 min/Q)`}
        >
          <div className="flex flex-wrap gap-2">
            {COUNTS.map((n) => (
              <ChipButton
                key={n}
                active={count === n}
                onClick={() => setCount(n)}
              >
                {n}
              </ChipButton>
            ))}
          </div>
        </ControlGroup>

        <ControlGroup label="Difficulty">
          <div className="flex flex-wrap gap-2">
            {DIFFICULTIES.map((d) => (
              <ChipButton
                key={d}
                active={difficulty === d}
                onClick={() => setDifficulty(d)}
              >
                <span className="capitalize">{d}</span>
              </ChipButton>
            ))}
          </div>
        </ControlGroup>

        <ControlGroup
          label="Specialty focus"
          hint={
            specialties.length
              ? `${specialties.length} selected`
              : "All specialties"
          }
        >
          <div className="flex flex-wrap gap-2">
            {SPECS.map((s) => {
              const on = specialties.includes(s);
              return (
                <ChipButton key={s} active={on} onClick={() => toggleSpec(s)}>
                  {CLINICAL_SPECIALTY_LABELS[s]}
                </ChipButton>
              );
            })}
          </div>
        </ControlGroup>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">
            {error}
          </div>
        )}

        <div className="pt-4 border-t border-neutral-100 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-xs text-neutral-500">
            <span className="font-medium text-neutral-700">{count}</span>{" "}
            questions ·{" "}
            <span className="font-medium text-neutral-700">{duration} min</span>{" "}
            · <span className="capitalize">{difficulty}</span>
            <span className="block sm:inline sm:ml-1 text-neutral-400">
              Explanations unlock after submit.
            </span>
          </p>
          <button
            type="button"
            onClick={handleStart}
            disabled={pending}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-poppins font-medium text-sm rounded-md shadow-sm hover:bg-primary-hover active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <SparkleIcon className="w-4 h-4" />
            {pending ? "Starting…" : "Build custom quiz"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────

function ControlGroup({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2.5">
        <p className="font-poppins font-medium text-xs uppercase tracking-wide text-neutral-500">
          {label}
        </p>
        {hint && <span className="text-xs text-neutral-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function ChipButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all duration-200 active:scale-[0.97]",
        active
          ? "border-primary bg-primary/[0.08] text-primary shadow-sm"
          : "border-neutral-200 text-neutral-600 bg-white hover:border-neutral-300 hover:bg-neutral-50"
      )}
    >
      {children}
    </button>
  );
}

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
