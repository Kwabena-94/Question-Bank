// app/api/flashcards/due/route.ts
//
// Returns cards due for review for the current user. New cards (no
// flashcard_card_state row yet) count as due — we left-join state and
// treat NULL due_at as "now".
//
// Capped at 100/day per the v2 design decisions. The cap is applied
// here so the client never has to know about it.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const DAILY_CAP = 100;

interface DueRow {
  id: string;
  set_id: string;
  position: number;
  format: "basic" | "cloze" | "mcq";
  type: string;
  context: string | null;
  front: string;
  back: string;
  reasoning: string | null;
  mcq_options: unknown;
  state: {
    ease: number;
    interval_days: number;
    due_at: string;
    reps: number;
    lapses: number;
  } | null;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Pull cards + (optional) state for this user. RLS keeps it scoped.
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("flashcards")
    .select(
      `id, set_id, position, format, type, context, front, back, reasoning, mcq_options,
       state:flashcard_card_state!left(ease, interval_days, due_at, reps, lapses)`
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as unknown as DueRow[];
  const due = rows
    .map((r) => {
      // Supabase returns left-join nested as an array even with !left; normalize.
      const stateRaw = Array.isArray(r.state) ? r.state[0] : r.state;
      const due_at = stateRaw?.due_at ?? null;
      const isDue = !due_at || due_at <= nowIso;
      return { row: r, state: stateRaw, isDue };
    })
    .filter((x) => x.isDue)
    .slice(0, DAILY_CAP)
    .map(({ row, state }) => ({
      id: row.id,
      set_id: row.set_id,
      position: row.position,
      format: row.format,
      type: row.type,
      context: row.context,
      front: row.front,
      back: row.back,
      reasoning: row.reasoning,
      mcq_options: row.mcq_options,
      ease: state?.ease ?? 2.5,
      interval_days: state?.interval_days ?? 0,
      reps: state?.reps ?? 0,
      lapses: state?.lapses ?? 0,
      is_new: !state,
    }));

  return NextResponse.json({
    cards: due,
    cap: DAILY_CAP,
    total_due: due.length,
  });
}
