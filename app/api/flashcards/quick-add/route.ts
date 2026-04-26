// app/api/flashcards/quick-add/route.ts
//
// One-tap "Remember this" — turns a question into a single SRS card
// without invoking the LLM. Idempotent: if the user already has a
// card sourced from this question, we return the existing set.

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { PROMPT_VERSION } from "@/lib/flashcards/prompt";
import { quickCardFromQuestion, quickCardTopic } from "@/lib/flashcards/quick-card";
import type { Question } from "@/types";

export const runtime = "nodejs";

const schema = z.object({
  question_id: z.string().uuid(),
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

  // Idempotency: existing card sourced from this question?
  const { data: existing } = await supabase
    .from("flashcards")
    .select("id, set_id")
    .eq("user_id", user.id)
    .eq("source_question_id", parsed.data.question_id)
    .limit(1)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ set_id: existing.set_id, card_id: existing.id, existed: true });
  }

  // Fetch question
  const { data: question, error: qErr } = await supabase
    .from("questions")
    .select("id, content, options, correct_option, explanation, clinical_specialty")
    .eq("id", parsed.data.question_id)
    .maybeSingle();
  if (qErr || !question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const card = quickCardFromQuestion({ question: question as unknown as Question });
  const topic = quickCardTopic(question as unknown as Question);

  // Persist set + per-card row
  const { data: setRow, error: setErr } = await supabase
    .from("flashcard_sets")
    .insert({
      user_id: user.id,
      topic,
      input_mode: "describe",
      generation_mode: "manual",
      cards: [card],
      model_version: null,
      cache_hit: false,
      cache_key: null,
      prompt_version: PROMPT_VERSION,
    })
    .select("id")
    .single();
  if (setErr || !setRow) {
    return NextResponse.json({ error: "Could not save card" }, { status: 500 });
  }

  const { data: cardRow, error: cardErr } = await supabase
    .from("flashcards")
    .insert({
      set_id: setRow.id,
      user_id: user.id,
      position: 0,
      format: card.format ?? "basic",
      type: card.type,
      context: card.context ?? null,
      front: card.front,
      back: card.back,
      reasoning: card.reasoning,
      mcq_options: null,
      source_question_id: parsed.data.question_id,
    })
    .select("id")
    .single();
  if (cardErr || !cardRow) {
    return NextResponse.json({ error: "Could not save card row" }, { status: 500 });
  }

  return NextResponse.json({ set_id: setRow.id, card_id: cardRow.id, existed: false });
}
