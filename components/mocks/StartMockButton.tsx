"use client";

import { useState, useTransition } from "react";
import { startOrResumeMock } from "@/lib/mocks/actions";
import { track } from "@/lib/analytics/track";

export default function StartMockButton({ templateId }: { templateId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleStart() {
    setError(null);
    track.mockStarted(templateId);
    startTransition(async () => {
      try {
        await startOrResumeMock(templateId);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Could not start mock.";
        if (msg.includes("NEXT_REDIRECT")) return;
        setError(msg);
      }
    });
  }

  return (
    <div className="space-y-3">
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
        {pending ? "Starting…" : "Start timed mock"}
      </button>
    </div>
  );
}
