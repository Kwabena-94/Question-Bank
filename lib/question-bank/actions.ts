"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import type {
  ClinicalSpecialty,
  Difficulty,
  QBSessionFilters,
  SessionLength,
} from "@/types";

const SPECIALTIES: ClinicalSpecialty[] = [
  "medicine",
  "obgyn",
  "peds",
  "pop_health",
  "psych",
  "surgery",
];
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const LENGTHS: SessionLength[] = [5, 10, 20, 40];

const startSchema = z.object({
  length: z.coerce.number().refine((n): n is SessionLength =>
    (LENGTHS as number[]).includes(n)
  ),
  specialties: z.array(z.enum(SPECIALTIES as [string, ...string[]])).default([]),
  difficulties: z.array(z.enum(DIFFICULTIES as [string, ...string[]])).default([]),
  unseenOnly: z.boolean().default(false),
  incorrectOnly: z.boolean().default(false),
});

export async function startQBSession(input: z.input<typeof startSchema>) {
  const user = await requireAuth();
  const parsed = startSchema.parse(input);
  const supabase = await createClient();

  // 1. Build candidate query
  let query = supabase
    .from("questions")
    .select("id")
    .eq("is_published", true);

  if (parsed.specialties.length) {
    query = query.in("clinical_specialty", parsed.specialties);
  }
  if (parsed.difficulties.length) {
    query = query.in("difficulty", parsed.difficulties);
  }

  const { data: candidates, error } = await query.limit(5000);
  if (error) throw new Error(error.message);
  if (!candidates?.length) {
    throw new Error("No questions match these filters.");
  }

  // 2. Apply attempt-based filters
  let pool = candidates.map((r) => r.id as string);

  if (parsed.unseenOnly || parsed.incorrectOnly) {
    const { data: attempts } = await supabase
      .from("question_attempts")
      .select("question_id, is_correct")
      .eq("user_id", user.id)
      .in("question_id", pool);

    const seen = new Set<string>();
    const everCorrect = new Set<string>();
    for (const a of attempts ?? []) {
      seen.add(a.question_id);
      if (a.is_correct) everCorrect.add(a.question_id);
    }

    if (parsed.unseenOnly) {
      pool = pool.filter((id) => !seen.has(id));
    }
    if (parsed.incorrectOnly) {
      pool = pool.filter((id) => seen.has(id) && !everCorrect.has(id));
    }
  }

  if (!pool.length) {
    throw new Error("No questions match these filters.");
  }

  // 3. Shuffle and slice
  const picked = shuffle(pool).slice(0, parsed.length);

  // 4. Persist session
  const filters: QBSessionFilters = {
    specialties: parsed.specialties as ClinicalSpecialty[],
    difficulties: parsed.difficulties as Difficulty[],
    unseenOnly: parsed.unseenOnly,
    incorrectOnly: parsed.incorrectOnly,
  };

  const { data: session, error: insertErr } = await supabase
    .from("qb_sessions")
    .insert({
      user_id: user.id,
      question_ids: picked,
      filters,
      length: parsed.length,
    })
    .select("id")
    .single();

  if (insertErr || !session) {
    throw new Error(insertErr?.message ?? "Failed to start session.");
  }

  redirect(`/question-bank/session/${session.id}`);
}

const attemptSchema = z.object({
  sessionId: z.string().uuid(),
  questionId: z.string().uuid(),
  selected: z.enum(["a", "b", "c", "d", "e"]),
  timeSpentSeconds: z.number().int().nonnegative().optional(),
});

export async function recordQBAttempt(input: z.input<typeof attemptSchema>) {
  const user = await requireAuth();
  const parsed = attemptSchema.parse(input);
  const supabase = await createClient();

  const { data: q, error } = await supabase
    .from("questions")
    .select("correct_option")
    .eq("id", parsed.questionId)
    .single();
  if (error || !q) throw new Error("Question not found.");

  const isCorrect = q.correct_option === parsed.selected;

  const { error: insErr } = await supabase.from("question_attempts").insert({
    user_id: user.id,
    question_id: parsed.questionId,
    selected_option: parsed.selected,
    is_correct: isCorrect,
    time_spent_seconds: parsed.timeSpentSeconds ?? null,
    session_id: parsed.sessionId,
    source: "question_bank",
  });
  if (insErr) throw new Error(insErr.message);

  return { isCorrect, correct: q.correct_option as "a" | "b" | "c" | "d" | "e" };
}

export async function completeQBSession(sessionId: string) {
  const user = await requireAuth();
  const supabase = await createClient();
  await supabase
    .from("qb_sessions")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("user_id", user.id);
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
