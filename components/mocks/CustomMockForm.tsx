"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { startCustomMock } from "@/lib/mocks/actions";
import { track } from "@/lib/analytics/track";
import { CLINICAL_SPECIALTY_LABELS, type ClinicalSpecialty } from "@/types";

const COUNTS = [20, 40, 60, 80, 115, 230] as const;
const MIN_PER_Q = 1.4;

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
    track.mockStarted("custom", { count, specialties: specialties.join(",") });
    startTransition(async () => {
      try {
        await startCustomMock({ count, specialties });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Could not start custom mock.";
        if (msg.includes("NEXT_REDIRECT")) return;
        setError(msg);
      }
    });
  }

  return (
    <div className="card-surface p-6 space-y-6">
      <div>
        <h2 className="font-poppins font-semibold text-sm text-neutral-900 mb-2">
          Question count
        </h2>
        <div className="flex flex-wrap gap-2">
          {COUNTS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setCount(n)}
              className={cn(
                "px-3 py-1.5 rounded-full border text-xs font-medium transition-colors",
                count === n
                  ? "border-primary bg-primary/8 text-primary"
                  : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-poppins font-semibold text-sm text-neutral-900 mb-1">
          Specialties
        </h2>
        <p className="text-xs text-neutral-500 mb-2">
          Leave empty to draw from all specialties.
        </p>
        <div className="flex flex-wrap gap-2">
          {SPECS.map((s) => {
            const on = specialties.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleSpec(s)}
                className={cn(
                  "px-3 py-1.5 rounded-full border text-xs font-medium transition-colors",
                  on
                    ? "border-primary bg-primary/8 text-primary"
                    : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                )}
              >
                {CLINICAL_SPECIALTY_LABELS[s]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-md bg-neutral-50 p-4 text-xs text-neutral-600 space-y-1">
        <p>
          <span className="font-medium text-neutral-700">{count}</span> questions ·{" "}
          <span className="font-medium text-neutral-700">{duration} min</span> (≈ 1.4 min/Q)
        </p>
        <p>Exam mode — explanations unlock after submit. Counts toward your readiness.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleStart}
        disabled={pending}
        className="w-full py-3 bg-primary text-white font-poppins font-medium text-sm rounded-md hover:bg-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? "Starting…" : "Start custom mock"}
      </button>
    </div>
  );
}
