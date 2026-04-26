import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import ReviewSession from "@/components/flashcards/ReviewSession";
import type { CardFormat, FlashcardMcqOption } from "@/types";

export const metadata: Metadata = { title: "Review — MedBuddy" };

const DAILY_CAP = 100;

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

  const { data } = await supabase
    .from("flashcards")
    .select(
      `id, set_id, position, format, type, context, front, back, reasoning, mcq_options, created_at,
       state:flashcard_card_state!left(due_at, ease, interval_days, reps, lapses)`
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(500);

  const nowIso = new Date().toISOString();
  const cards = ((data ?? []) as unknown as CardRow[])
    .map((r) => {
      const stateRaw = Array.isArray(r.state) ? r.state[0] : r.state;
      const isDue = !stateRaw?.due_at || stateRaw.due_at <= nowIso;
      return { r, stateRaw, isDue };
    })
    .filter((x) => x.isDue)
    .slice(0, DAILY_CAP)
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
    <div className="px-4 py-6 sm:py-8">
      <ReviewSession cards={cards} />
    </div>
  );
}
