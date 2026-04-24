"use client";

import { useState, useTransition } from "react";
import { startCustomMock } from "@/lib/mocks/actions";
import { track } from "@/lib/analytics/track";
import type { ClinicalSpecialty } from "@/types";

interface Props {
  specialty: ClinicalSpecialty;
  count: number;
  durationMinutes: number;
  label: string;
}

export default function SmartWarmupButton({
  specialty,
  count,
  durationMinutes,
  label,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    track.mockStarted("custom", {
      count,
      specialties: specialty,
      source: "recommendation",
    });
    startTransition(async () => {
      try {
        await startCustomMock({ count, specialties: [specialty] });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Could not start warm-up.";
        if (msg.includes("NEXT_REDIRECT")) return;
        setError(msg);
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/25 text-white font-poppins font-medium text-sm rounded-md transition-colors disabled:opacity-60"
      >
        {pending ? "Starting…" : label}
      </button>
      <span className="text-xs text-white/70 inline-flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        ~{durationMinutes} min
      </span>
      {error && <span className="text-xs text-red-200">{error}</span>}
    </div>
  );
}
