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
        if (msg.includes("NEXT_REDIRECT")) return;
        setError(msg);
      }
    });
  }

  const hasAttempts = attemptCount > 0;

  return (
    <div className="rounded-xl bg-white border border-neutral-200/70 shadow-card hover:shadow-card-hover transition-shadow duration-200 divide-y divide-neutral-100">
      {/* Session length */}
      <section className="p-6">
        <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
          Session length
        </p>
        <div className="grid grid-cols-4 gap-2 mt-3">
          {LENGTHS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setLength(n)}
              className={cn(
                "py-3 rounded-md border text-sm font-medium transition-all duration-200 active:scale-[0.98]",
                length === n
                  ? "border-primary bg-primary/[0.08] text-primary shadow-sm"
                  : "border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50"
              )}
            >
              {n} Qs
            </button>
          ))}
        </div>
      </section>

      {/* Specialty */}
      <section className="p-6">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
            Specialty
          </p>
          <p className="text-xs text-neutral-400">
            Leave empty to include all.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {SPECIALTIES.map((s) => {
            const active = specialties.includes(s);
            const count = specialtyCounts[s] ?? 0;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSpecialties(toggle(specialties, s))}
                className={cn(
                  "px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-200 active:scale-[0.98]",
                  active
                    ? "border-primary bg-primary/[0.08] text-primary"
                    : "border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50"
                )}
              >
                {CLINICAL_SPECIALTY_LABELS[s]}
                <span className={cn("ml-1.5", active ? "text-primary/60" : "text-neutral-400")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Difficulty */}
      <section className="p-6">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
            Difficulty
          </p>
          <p className="text-xs text-neutral-400">
            Unfiltered draws from all questions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {DIFFICULTIES.map((d) => {
            const active = difficulties.includes(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulties(toggle(difficulties, d))}
                className={cn(
                  "px-3 py-1.5 rounded-full border text-xs font-medium capitalize transition-all duration-200 active:scale-[0.98]",
                  active
                    ? "border-primary bg-primary/[0.08] text-primary"
                    : "border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50"
                )}
              >
                {d}
              </button>
            );
          })}
        </div>
      </section>

      {/* Focus */}
      <section className="p-6">
        <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
          Focus
        </p>
        <div className="space-y-2 mt-3">
          <label className="flex items-center gap-3 text-sm text-neutral-700 cursor-pointer rounded-md px-2 py-1.5 -mx-2 hover:bg-neutral-50 transition-colors">
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
              "flex items-center gap-3 text-sm rounded-md px-2 py-1.5 -mx-2 transition-colors",
              hasAttempts
                ? "text-neutral-700 cursor-pointer hover:bg-neutral-50"
                : "text-neutral-400 cursor-not-allowed"
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

      {/* Submit */}
      <section className="p-6 space-y-3">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">
            {error}
          </div>
        )}
        <button
          type="button"
          onClick={handleStart}
          disabled={pending}
          className="group w-full py-3 bg-primary text-white font-poppins font-medium text-sm rounded-md shadow-sm hover:bg-primary-hover active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
        >
          {pending ? (
            "Starting…"
          ) : (
            <>
              Start {length}-question session
              <span aria-hidden className="inline-block transition-transform duration-200 group-hover:translate-x-0.5">
                →
              </span>
            </>
          )}
        </button>
      </section>
    </div>
  );
}
