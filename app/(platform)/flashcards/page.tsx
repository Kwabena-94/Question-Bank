import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import FlashcardFlow from "@/components/flashcards/FlashcardFlow";

export const metadata: Metadata = { title: "Flashcards — MedBuddy" };

export default async function FlashcardsPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const nowIso = new Date().toISOString();
  const since30dIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [cardsRes, statesRes, reviewsRes, setsRes] = await Promise.all([
    supabase
      .from("flashcards")
      .select("id, created_at", { count: "exact" })
      .eq("user_id", user.id),
    supabase
      .from("flashcard_card_state")
      .select("due_at, reps")
      .eq("user_id", user.id),
    supabase
      .from("flashcard_reviews")
      .select("reviewed_at")
      .eq("user_id", user.id)
      .gte("reviewed_at", since30dIso)
      .order("reviewed_at", { ascending: false }),
    supabase
      .from("flashcard_sets")
      .select("id, topic, cards, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const totalCards = cardsRes.count ?? cardsRes.data?.length ?? 0;
  const states = statesRes.data ?? [];

  // Due today = states with due_at <= now OR cards with no state yet (new).
  const stateCardCount = states.length;
  const newCount = Math.max(0, totalCards - stateCardCount);
  const dueFromState = states.filter((s) => !s.due_at || s.due_at <= nowIso).length;
  const dueCount = Math.min(100, dueFromState + newCount);

  // Streak (consecutive days back from today with at least one review)
  const reviewDays = new Set(
    (reviewsRes.data ?? []).map((r) => r.reviewed_at.slice(0, 10))
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (reviewDays.has(key)) streak++;
    else if (i > 0) break;
    else if (!reviewDays.has(key)) break;
  }

  const reviewedThisWeek = (reviewsRes.data ?? []).filter(
    (r) =>
      r.reviewed_at >=
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  ).length;

  const recentSets = setsRes.data ?? [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-poppins text-2xl font-semibold text-neutral-900">
          Flashcards
        </h1>
        <p className="text-neutral-500 text-sm mt-1">
          Spaced repetition for high-yield recall.
        </p>
      </div>

      {/* Top row: Due hero + Streak */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Due Today hero */}
        <div
          className={`lg:col-span-2 rounded-xl border p-6 shadow-card transition-shadow hover:shadow-card-hover ${
            dueCount > 0
              ? "bg-gradient-to-br from-accent/[0.08] to-accent/[0.02] border-accent/20"
              : "bg-white border-neutral-200/70"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
                Due today
              </p>
              <div className="flex items-baseline gap-2">
                <span
                  className={`font-poppins text-5xl font-semibold ${
                    dueCount > 0 ? "text-accent" : "text-neutral-300"
                  }`}
                >
                  {dueCount}
                </span>
                <span className="text-sm text-neutral-500">
                  {dueCount === 1 ? "card" : "cards"}
                </span>
              </div>
              <p className="text-sm text-neutral-600 mt-2 max-w-sm">
                {dueCount === 0
                  ? "You're caught up. Generate a new deck or come back tomorrow."
                  : `Mix of ${newCount} new and ${dueFromState} review${
                      dueFromState === 1 ? "" : "s"
                    }. Review takes about ${Math.max(1, Math.round(dueCount * 0.3))} min.`}
              </p>
            </div>
            {dueCount > 0 ? (
              <Link
                href="/flashcards/review"
                className="shrink-0 px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
              >
                Start review →
              </Link>
            ) : (
              <div className="shrink-0 w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 grid place-items-center text-2xl">
                ✓
              </div>
            )}
          </div>
        </div>

        {/* Streak */}
        <div className="rounded-xl bg-white border border-neutral-200/70 p-6 shadow-card hover:shadow-card-hover transition-shadow">
          <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
            Streak
          </p>
          <div className="flex items-baseline gap-2">
            <span className="font-poppins text-4xl font-semibold text-neutral-900">
              {streak}
            </span>
            <span className="text-sm text-neutral-500">
              {streak === 1 ? "day" : "days"}
            </span>
          </div>
          <p className="text-sm text-neutral-600 mt-3">
            {reviewedThisWeek} reviews this week · {totalCards} card
            {totalCards === 1 ? "" : "s"} total
          </p>
        </div>
      </div>

      {/* Recent decks */}
      {recentSets.length > 0 && (
        <div className="rounded-xl bg-white border border-neutral-200/70 p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-poppins font-semibold text-base text-neutral-900">
              Recent decks
            </h2>
            <span className="text-xs text-neutral-400">{recentSets.length} shown</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentSets.map((s) => {
              const count = Array.isArray(s.cards) ? s.cards.length : 0;
              return (
                <div
                  key={s.id}
                  className="group rounded-lg border border-neutral-200 p-4 hover:border-primary/30 hover:bg-primary/[0.02] transition-colors"
                >
                  <div className="text-sm font-medium text-neutral-900 line-clamp-2">
                    {s.topic}
                  </div>
                  <div className="text-xs text-neutral-500 mt-2">
                    {count} card{count === 1 ? "" : "s"} ·{" "}
                    {new Date(s.created_at).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Generate */}
      <div className="rounded-xl bg-white border border-neutral-200/70 p-6 shadow-card">
        <FlashcardFlow />
      </div>
    </div>
  );
}
