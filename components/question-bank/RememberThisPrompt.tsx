"use client";

// components/question-bank/RememberThisPrompt.tsx
//
// Inline "Remember this?" chip shown in the QBank tutor view after the
// learner submits a wrong answer (or hits a wrong-streak of 3).
//
// One tap calls /api/flashcards/quick-add. Coverage is checked at fetch
// time on the server side; this component only renders when the parent
// has decided to show it.

import { useState } from "react";

interface Props {
  questionId: string;
  /** When true, render the "you keep missing this — let's lock it in" copy. */
  escalated?: boolean;
}

type Status = "idle" | "saving" | "saved" | "error";

export default function RememberThisPrompt({ questionId, escalated }: Props) {
  const [status, setStatus] = useState<Status>("idle");

  async function add() {
    if (status === "saving" || status === "saved") return;
    setStatus("saving");
    try {
      const res = await fetch("/api/flashcards/quick-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question_id: questionId }),
      });
      if (!res.ok) throw new Error("save failed");
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-info/15 bg-info/[0.06] px-3 py-2.5">
      <div className="flex-1 text-sm text-neutral-700">
        {escalated ? (
          <span>
            <span className="font-medium text-info">You&apos;ve missed this concept a few times.</span>{" "}
            Add it to your flashcards so it sticks.
          </span>
        ) : (
          <span>Want to remember this? Add it to your flashcards.</span>
        )}
      </div>
      <button
        onClick={add}
        disabled={status === "saving" || status === "saved"}
        className="shrink-0 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors disabled:opacity-60 bg-white border-info/30 text-info hover:bg-info/[0.08]"
      >
        {status === "saved"
          ? "Added ✓"
          : status === "saving"
          ? "Adding…"
          : status === "error"
          ? "Try again"
          : "Add card"}
      </button>
    </div>
  );
}
