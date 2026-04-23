"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { startQBSession } from "@/lib/question-bank/actions";
import {
  CLINICAL_SPECIALTY_LABELS,
  type ClinicalSpecialty,
  type Difficulty,
  type SessionLength,
} from "@/types";

const LENGTHS: SessionLength[] = [5, 10, 20, 40];
const SPECIALTIES = Object.keys(CLINICAL_SPECIALTY_LABELS) as ClinicalSpecialty[];
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

interface Props {
  specialtyCounts: Record<string, number>;
  attemptCount: number;
}

export default function StartSessionForm({
  specialtyCounts,
  attemptCount,
}: Props) {
  const [length, setLength] = useState<SessionLength>(10);
  const [specialties, setSpecialties] = useState<ClinicalSpecialty[]>([]);
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [unseenOnly, setUnseenOnly] = useState(false);
  const [incorrectOnly, setIncorrectOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
  }

  function handleStart() {
    setError(null);
    startTransition(async () => {
      try {
        await startQBSession({
          length,
          specialties,
          difficulties,
          unseenOnly,
          incorrectOnly,
        });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Something went wrong.";
        // Next.js redirect throws — don't surface that
        if (msg.includes("NEXT_REDIRECT")) return;
        setError(msg);
      }
    });
  }

  const hasAttempts = attemptCount > 0;

  return (
    <div className="card-surface p-6 space-y-6">
      {/* Session length */}
      <section>
        <h2 className="font-poppins font-semibold text-sm text-neutral-900 mb-3">
          Session length
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {LENGTHS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setLength(n)}
              className={cn(
                "py-3 rounded-md border text-sm font-medium transition-colors",
                length === n
                  ? "border-primary bg-primary/8 text-primary"
                  : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
              )}
            >
              {n} Qs
            </button>
          ))}
        </div>
      </section>

      {/* Specialty */}
      <section>
        <h2 className="font-poppins font-semibold text-sm text-neutral-900 mb-1">
          Specialty
        </h2>
        <p className="text-xs text-neutral-500 mb-3">
          Leave empty to include all.
        </p>
        <div className="flex flex-wrap gap-2">
          {SPECIALTIES.map((s) => {
            const active = specialties.includes(s);
            const count = specialtyCounts[s] ?? 0;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSpecialties(toggle(specialties, s))}
                className={cn(
                  "px-3 py-1.5 rounded-full border text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary/8 text-primary"
                    : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                )}
              >
                {CLINICAL_SPECIALTY_LABELS[s]}
                <span className="ml-1.5 text-neutral-400">{count}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Difficulty */}
      <section>
        <h2 className="font-poppins font-semibold text-sm text-neutral-900 mb-1">
          Difficulty
        </h2>
        <p className="text-xs text-neutral-500 mb-3">
          Tags roll out progressively — unfiltered draws from all questions.
        </p>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map((d) => {
            const active = difficulties.includes(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulties(toggle(difficulties, d))}
                className={cn(
                  "px-3 py-1.5 rounded-full border text-xs font-medium capitalize transition-colors",
                  active
                    ? "border-primary bg-primary/8 text-primary"
                    : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                )}
              >
                {d}
              </button>
            );
          })}
        </div>
      </section>

      {/* Attempt-based filters */}
      <section>
        <h2 className="font-poppins font-semibold text-sm text-neutral-900 mb-3">
          Focus
        </h2>
        <div className="space-y-2">
          <label className="flex items-center gap-3 text-sm text-neutral-700 cursor-pointer">
            <input
              type="checkbox"
              checked={unseenOnly}
              onChange={(e) => {
                setUnseenOnly(e.target.checked);
                if (e.target.checked) setIncorrectOnly(false);
              }}
              className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary/40"
            />
            Unseen questions only
          </label>
          <label
            className={cn(
              "flex items-center gap-3 text-sm cursor-pointer",
              hasAttempts ? "text-neutral-700" : "text-neutral-400 cursor-not-allowed"
            )}
          >
            <input
              type="checkbox"
              checked={incorrectOnly}
              disabled={!hasAttempts}
              onChange={(e) => {
                setIncorrectOnly(e.target.checked);
                if (e.target.checked) setUnseenOnly(false);
              }}
              className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary/40"
            />
            Previously incorrect only
            {!hasAttempts && (
              <span className="text-xs text-neutral-400">
                (answer some questions first)
              </span>
            )}
          </label>
        </div>
      </section>

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
        {pending ? "Starting…" : `Start ${length}-question session`}
      </button>
    </div>
  );
}
