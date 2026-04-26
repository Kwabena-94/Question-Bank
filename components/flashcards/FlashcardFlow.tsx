"use client";

import { useMemo, useState } from "react";
import { track } from "@/lib/analytics/track";
import type { Flashcard } from "@/types";

type Mode = "describe" | "paste";

export default function FlashcardFlow() {
  const [mode, setMode] = useState<Mode>("describe");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [setId, setSetId] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const current = cards[index];
  const progress = useMemo(
    () => (cards.length ? Math.round(((index + 1) / cards.length) * 100) : 0),
    [cards.length, index]
  );

  async function generate() {
    if (!topic.trim()) return;
    setError(null);
    setLoading(true);
    setCards([]);
    setSetId(null);
    setIndex(0);
    setFlipped(false);

    try {
      const res = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          mode,
          generation_mode: "manual",
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Could not generate flashcards.");
      }

      const nextCards = (json.cards ?? []) as Flashcard[];
      setCards(nextCards);
      setSetId(json.set_id ?? null);

      track.flashcardsGenerated({
        topic: topic.trim(),
        card_count: nextCards.length,
        cache_hit: false,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not generate flashcards.");
    } finally {
      setLoading(false);
    }
  }

  function flipCard() {
    if (!cards.length || !setId) return;
    const next = !flipped;
    setFlipped(next);
    if (next) {
      track.flashcardFlipped({
        set_id: setId,
        card_index: index,
      });
    }
  }

  function nextCard() {
    if (!cards.length) return;
    setIndex((i) => Math.min(cards.length - 1, i + 1));
    setFlipped(false);
  }

  function prevCard() {
    if (!cards.length) return;
    setIndex((i) => Math.max(0, i - 1));
    setFlipped(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-poppins font-semibold text-base text-neutral-900">
          Generate a new deck
        </h2>
        <p className="text-neutral-500 text-sm mt-1">
          Describe a topic or paste notes — we&apos;ll structure them into MCCQE-style cards.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("describe")}
            className={`px-4 py-2 rounded-md text-sm font-medium border ${
              mode === "describe"
                ? "bg-primary/8 border-primary text-primary"
                : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
            }`}
          >
            Describe topic
          </button>
          <button
            type="button"
            onClick={() => setMode("paste")}
            className={`px-4 py-2 rounded-md text-sm font-medium border ${
              mode === "paste"
                ? "bg-primary/8 border-primary text-primary"
                : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
            }`}
          >
            Paste notes
          </button>
        </div>

        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full min-h-32 px-4 py-3 border border-neutral-300 rounded-md text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
          placeholder={
            mode === "describe"
              ? "e.g. Atrial fibrillation management in older adults"
              : "Paste lecture notes, guideline summary, or high-yield bullets..."
          }
          maxLength={5000}
        />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={generate}
          disabled={loading || !topic.trim()}
          className="w-full py-3 bg-primary text-white font-poppins font-medium text-sm rounded-md hover:bg-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Generating flashcards…" : "Generate flashcards"}
        </button>
      </div>

      {cards.length > 0 && current && (
        <div className="card-surface p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-neutral-500">
              Card {index + 1} of {cards.length} · {current.type}
            </p>
            <p className="text-xs text-neutral-500">{progress}%</p>
          </div>

          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <button
            type="button"
            onClick={flipCard}
            className="w-full text-left min-h-64 rounded-md border border-neutral-200 bg-white p-6 hover:border-neutral-300 transition-colors"
          >
            {!flipped ? (
              <div>
                <p className="text-xs text-neutral-500 mb-2 uppercase tracking-wide">Front</p>
                <p className="text-base text-neutral-900 leading-relaxed whitespace-pre-wrap">
                  {current.front}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs text-neutral-500 mb-2 uppercase tracking-wide">Back</p>
                <p className="text-base text-neutral-900 leading-relaxed whitespace-pre-wrap">
                  {current.back}
                </p>
                {current.reasoning && (
                  <p className="text-xs text-neutral-500 mt-4 whitespace-pre-wrap">
                    Why this matters: {current.reasoning}
                  </p>
                )}
              </div>
            )}
          </button>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={prevCard}
              disabled={index === 0}
              className="flex-1 py-2.5 border border-neutral-200 text-neutral-700 text-sm rounded-md hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={flipCard}
              className="flex-1 py-2.5 bg-neutral-900 text-white text-sm rounded-md hover:bg-neutral-800"
            >
              {flipped ? "Show front" : "Flip card"}
            </button>
            <button
              type="button"
              onClick={nextCard}
              disabled={index === cards.length - 1}
              className="flex-1 py-2.5 border border-neutral-200 text-neutral-700 text-sm rounded-md hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
