"use client";

import { useEffect, useMemo, useState } from "react";
import { track } from "@/lib/analytics/track";
import type { Flashcard } from "@/types";
import ClozeCard from "./cards/ClozeCard";

type Mode = "describe" | "paste";

export default function FlashcardFlow({ compact = false }: { compact?: boolean }) {
  const [mode, setMode] = useState<Mode>("describe");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [setId, setSetId] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [online, setOnline] = useState(true);

  const current = cards[index];
  const progress = useMemo(
    () => (cards.length ? Math.round(((index + 1) / cards.length) * 100) : 0),
    [cards.length, index]
  );

  useEffect(() => {
    setOnline(navigator.onLine);
    function handleOnline() {
      setOnline(true);
    }
    function handleOffline() {
      setOnline(false);
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  async function generate() {
    if (!topic.trim() || !online) return;
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
        cache_hit: !!json.cache_hit,
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
      {!compact && (
        <div>
          <h2 className="font-poppins font-semibold text-base text-neutral-900">
            Generate a new deck
          </h2>
          <p className="text-neutral-500 text-sm mt-1">
            Describe a topic or paste notes — we&apos;ll structure them into MCCQE-style cards.
          </p>
        </div>
      )}

      {compact && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {["Atrial fibrillation", "Prenatal screening", "Pediatric fever"].map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                setMode("describe");
                setTopic(suggestion);
              }}
              className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-left text-xs font-medium text-neutral-600 transition-colors hover:border-primary/30 hover:bg-primary/[0.04] hover:text-primary"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("describe")}
            className={`px-4 py-2 rounded-md text-sm font-medium border ${
              mode === "describe"
                ? "bg-primary/[0.08] border-primary text-primary"
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
                ? "bg-primary/[0.08] border-primary text-primary"
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

        {!online && (
          <div className="bg-info/[0.06] border border-info/15 text-neutral-700 text-sm rounded-lg px-4 py-3">
            Deck generation needs a connection. Review cards already loaded on this device
            can still be completed offline.
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-4 py-3">
            <div className="font-medium">Generation paused</div>
            <div className="mt-1">{error}</div>
          </div>
        )}

        <button
          type="button"
          onClick={generate}
          disabled={loading || !topic.trim() || !online}
          className="w-full py-3 bg-primary text-white font-poppins font-medium text-sm rounded-md hover:bg-primary-hover transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Generating flashcards…" : "Generate flashcards"}
        </button>
      </div>

      {loading && <GenerationTimeline />}

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
                <GeneratedCardFront card={current} />
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

function GenerationTimeline() {
  const steps = [
    "Reading the topic",
    "Checking Canadian guidance",
    "Choosing card formats",
    "Saving your deck",
  ];

  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-4">
      <div className="h-24 rounded-lg bg-white border border-neutral-100 p-4 space-y-3 animate-pulse">
        <div className="h-3 w-24 rounded bg-neutral-200" />
        <div className="h-4 w-4/5 rounded bg-neutral-200" />
        <div className="h-4 w-2/3 rounded bg-neutral-200" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        {steps.map((step, i) => (
          <div key={step} className="flex items-center gap-2 text-xs text-neutral-600">
            <span
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] ${
                i === 0
                  ? "bg-primary text-white"
                  : "bg-white border border-neutral-200 text-neutral-500"
              }`}
            >
              {i + 1}
            </span>
            <span>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GeneratedCardFront({ card }: { card: Flashcard }) {
  if (card.format === "cloze") {
    return <ClozeCard front={card.front} revealed={false} />;
  }
  if (card.format === "mcq" && card.mcq_options?.length) {
    return (
      <div className="space-y-3">
        <p className="text-base text-neutral-900 leading-relaxed whitespace-pre-wrap">
          {card.front}
        </p>
        <div className="space-y-2">
          {card.mcq_options.map((option) => (
            <div
              key={option.label}
              className="flex gap-3 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700"
            >
              <span className="font-medium text-neutral-500">{option.label}.</span>
              <span>{option.text}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <p className="text-base text-neutral-900 leading-relaxed whitespace-pre-wrap">
      {card.front}
    </p>
  );
}
