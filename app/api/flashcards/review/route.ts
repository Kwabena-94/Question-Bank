// app/api/flashcards/review/route.ts
//
// Records a single grade event for a card and advances its SRS state.
// Body: { card_id, grade (1-4), answer_text?, grader_suggestion? }
//
// Two writes:
//   1. flashcard_card_state — upsert with the new schedule
//   2. flashcard_reviews    — append-only log (feeds future FSRS migration)

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_SRS, nextSchedule } from "@/lib/flashcards/scheduler";
import type { Grade } from "@/types";

export const runtime = "nodejs";

const reviewSchema = z.object({
  card_id: z.string().uuid(),
  grade: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  answer_text: z.string().max(4000).optional(),
  grader_suggestion: z
    .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
    .optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify card belongs to this user (RLS would also block, but we want
  // a clean 404 instead of an empty update).
  const { data: card, error: cardErr } = await supabase
    .from("flashcards")
    .select("id, user_id")
    .eq("id", parsed.data.card_id)
    .maybeSingle();
  if (cardErr || !card || card.user_id !== user.id) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  // Load prior state (may not exist yet for new cards)
  const { data: priorRow } = await supabase
    .from("flashcard_card_state")
    .select("ease, interval_days, reps, lapses")
    .eq("card_id", parsed.data.card_id)
    .eq("user_id", user.id)
    .maybeSingle();

  const prior = priorRow ?? DEFAULT_SRS;
  const now = new Date();
  const grade = parsed.data.grade as Grade;
  const next = nextSchedule(
    {
      ease: Number(prior.ease),
      interval_days: prior.interval_days,
      reps: prior.reps,
      lapses: prior.lapses,
    },
    grade,
    now
  );

  const dueIso = next.due_at.toISOString();

  // Upsert state
  const { error: stateErr } = await supabase
    .from("flashcard_card_state")
    .upsert(
      {
        card_id: parsed.data.card_id,
        user_id: user.id,
        ease: next.ease,
        interval_days: next.interval_days,
        reps: next.reps,
        lapses: next.lapses,
        due_at: dueIso,
        last_grade: grade,
        last_reviewed_at: now.toISOString(),
      },
      { onConflict: "card_id,user_id" }
    );
  if (stateErr) {
    return NextResponse.json({ error: stateErr.message }, { status: 500 });
  }

  // Append review log
  const { error: logErr } = await supabase.from("flashcard_reviews").insert({
    card_id: parsed.data.card_id,
    user_id: user.id,
    grade,
    prior_ease: Number(prior.ease),
    prior_interval: prior.interval_days,
    new_ease: next.ease,
    new_interval: next.interval_days,
    due_at: dueIso,
    answer_text: parsed.data.answer_text ?? null,
    grader_suggestion: parsed.data.grader_suggestion ?? null,
  });
  if (logErr) {
    console.warn("[flashcards] review log insert failed:", logErr.message);
  }

  return NextResponse.json({
    card_id: parsed.data.card_id,
    grade,
    ease: next.ease,
    interval_days: next.interval_days,
    due_at: dueIso,
    in_session: next.in_session,
  });
}
