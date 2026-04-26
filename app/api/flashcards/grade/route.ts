// app/api/flashcards/grade/route.ts
//
// Server-side proxy for the AI recall grader. The client never sees the
// Anthropic key; we just accept the typed answer + card id and return
// a suggested grade.

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { gradeRecall } from "@/lib/flashcards/grader";

export const runtime = "nodejs";

const schema = z.object({
  card_id: z.string().uuid(),
  answer_text: z.string().min(1).max(4000),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: card, error } = await supabase
    .from("flashcards")
    .select("id, user_id, front, back, context")
    .eq("id", parsed.data.card_id)
    .maybeSingle();
  if (error || !card || card.user_id !== user.id) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const result = await gradeRecall({
    question: card.front,
    expected: card.back,
    studentAnswer: parsed.data.answer_text,
    context: card.context,
  });

  if (!result) {
    return NextResponse.json({ available: false });
  }
  return NextResponse.json({ available: true, ...result });
}
