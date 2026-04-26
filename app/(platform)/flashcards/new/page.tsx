import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import FlashcardFlow from "@/components/flashcards/FlashcardFlow";

export const metadata: Metadata = { title: "New flashcard deck — MedBuddy" };

export default async function NewFlashcardDeckPage() {
  await requireAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
            Flashcards
          </p>
          <h1 className="font-poppins text-2xl font-semibold text-neutral-900 mt-2">
            Make a deck
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Generate a focused set from a topic or your own notes.
          </p>
        </div>
        <Link
          href="/flashcards"
          className="shrink-0 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          Back
        </Link>
      </div>

      <div className="rounded-xl bg-white border border-neutral-200/70 p-6 shadow-card">
        <FlashcardFlow />
      </div>
    </div>
  );
}
