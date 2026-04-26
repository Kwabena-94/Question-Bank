"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import FlashcardFlow from "./FlashcardFlow";

interface Props {
  variant?: "primary" | "subtle";
}

export default function NewDeckModal({ variant = "subtle" }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const buttonClass =
    variant === "primary"
      ? "inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]"
      : "inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-all duration-200 hover:bg-neutral-50 active:scale-[0.98]";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClass}>
        <Plus className="h-4 w-4" />
        New deck
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-neutral-950/30 px-4 py-6 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close new deck modal"
            className="absolute inset-0 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_24px_90px_rgba(15,23,42,0.22)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                  Smart Deck Builder
                </p>
                <h2 className="mt-1 font-poppins text-xl font-semibold text-neutral-900">
                  Create a focused deck
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-full border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <FlashcardFlow compact />
          </div>
        </div>
      )}
    </>
  );
}
