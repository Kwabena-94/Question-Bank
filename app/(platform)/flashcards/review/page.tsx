import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import ReviewSession from "@/components/flashcards/ReviewSession";
import type { CardFormat, FlashcardMcqOption } from "@/types";

export const metadata: Metadata = { title: "Review — MedBuddy" };

const DEFAULT_DAILY_CAP = 100;

interface CardRow {
  id: string;
  set_id: string;
  position: number;
  format: CardFormat;
  type: string;
  context: string | null;
  front: string;
  back: string;
  reasoning: string | null;
  mcq_options: FlashcardMcqOption[] | null;
  created_at: string;
  state:
    | { due_at: string; ease: number; interval_days: number; reps: number; lapses: number }
    | { due_at: string; ease: number; interval_days: number; reps: number; lapses: number }[]
    | null;
}

export default async function FlashcardsReviewPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const sixtyDaysAgoIso = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: profile }, { data }, { data: recentReviews }] = await Promise.all([
    supabase
      .from("profiles")
      .select("daily_review_cap")
      .eq("id", user.id)
      .single(),
    supabase
      .from("flashcards")
      .select(
        `id, set_id, position, format, type, context, front, back, reasoning, mcq_options, created_at,
         state:flashcard_card_state!left(due_at, ease, interval_days, reps, lapses)`
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(500),
    supabase
      .from("flashcard_reviews")
      .select("reviewed_at")
      .eq("user_id", user.id)
      .gte("reviewed_at", sixtyDaysAgoIso)
      .order("reviewed_at", { ascending: false }),
  ]);
  const dailyCap = profile?.daily_review_cap ?? DEFAULT_DAILY_CAP;

  // Day streak: consecutive days (ending today, or yesterday if today has no review yet)
  const reviewDays = new Set(
    (recentReviews ?? []).map((r) => (r.reviewed_at as string).slice(0, 10))
  );
  const todayDate = new Date();
  const todayKey = todayDate.toISOString().slice(0, 10);
  const yesterdayDate = new Date(todayDate.getTime() - 86_400_000);
  const yesterdayKey = yesterdayDate.toISOString().slice(0, 10);
  let currentStreak = 0;
  let cursor: Date | null = reviewDays.has(todayKey)
    ? todayDate
    : reviewDays.has(yesterdayKey)
      ? yesterdayDate
      : null;
  while (cursor && reviewDays.has(cursor.toISOString().slice(0, 10))) {
    currentStreak++;
    cursor = new Date(cursor.getTime() - 86_400_000);
  }

  const nowIso = new Date().toISOString();
  const cards = ((data ?? []) as unknown as CardRow[])
    .map((r) => {
      const stateRaw = Array.isArray(r.state) ? r.state[0] : r.state;
      const isDue = !stateRaw?.due_at || stateRaw.due_at <= nowIso;
      return { r, stateRaw, isDue };
    })
    .filter((x) => x.isDue)
    .slice(0, dailyCap)
    .map(({ r, stateRaw }) => ({
      id: r.id,
      set_id: r.set_id,
      format: r.format,
      type: r.type,
      context: r.context,
      front: r.front,
      back: r.back,
      reasoning: r.reasoning,
      mcq_options: r.mcq_options,
      is_new: !stateRaw,
    }));

  return (
    <div className="-mx-4 -my-5 lg:-mx-6 lg:-my-6">
      <ReviewSession cards={cards} currentStreak={currentStreak} />
    </div>
  );
}
