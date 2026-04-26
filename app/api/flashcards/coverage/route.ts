// app/api/flashcards/coverage/route.ts
//
// Lightweight gate the QBank uses to decide whether to surface the
// "Remember this?" inline prompt. Returns { covered: boolean } so the
// client doesn't need to know the underlying heuristic.

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isTopicCovered } from "@/lib/flashcards/coverage";

export const runtime = "nodejs";

const schema = z.object({
  question_id: z.string().uuid(),
  topic_hint: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const covered = await isTopicCovered(supabase, {
    userId: user.id,
    questionId: parsed.data.question_id,
    topicHint: parsed.data.topic_hint,
  });
  return NextResponse.json({ covered });
}
