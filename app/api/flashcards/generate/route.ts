// app/api/flashcards/generate/route.ts
//
// Internal flashcard generation pipeline. Replaces the legacy proxy
// dependency with a direct Anthropic call routed through a layered
// caching strategy:
//
//   L0  Per-user rate limit (Upstash sliding window 20/30min)
//   L1  Global generation cache (Supabase flashcard_cache, 30-day TTL)
//   L3  Anthropic Messages API with prompt caching
//
// On L1 hit, no API call is made. On miss, the result is written to L1
// before the response so the next caller (anywhere) gets the cached set.
//
// Response contract preserved from the legacy proxy-backed route so the
// existing components/flashcards/FlashcardFlow.tsx keeps working unchanged:
//   200 → { set_id, cards, cache_hit, model_version }

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { generateFlashcardsLive, AnthropicError } from "@/lib/flashcards/anthropic";
import { l1Get, l1Put } from "@/lib/flashcards/cache";
import { getCwcContext } from "@/lib/flashcards/cwc";
import { PROMPT_VERSION } from "@/lib/flashcards/prompt";
import { checkGenerationRateLimit } from "@/lib/flashcards/rate-limit";
import { generateRequestSchema } from "@/lib/flashcards/schemas";
import { buildCacheKey, normalizeTopic } from "@/lib/flashcards/topic-key";
import type { Flashcard } from "@/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // ── Parse + validate ────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = generateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // ── Auth ────────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── L0: rate limit ──────────────────────────────────────────────────────
  const rl = await checkGenerationRateLimit(user.id);
  if (!rl.success) {
    return NextResponse.json(
      {
        error: "Too many generations. Try again in a few minutes.",
        retry_after: Math.max(0, Math.floor((rl.resetAt - Date.now()) / 1000)),
      },
      { status: 429 }
    );
  }

  const service = await createServiceClient();
  const normalized = normalizeTopic(parsed.data.topic, parsed.data.mode);
  const cacheKey = buildCacheKey(normalized, parsed.data.mode);

  // ── L1: global cache lookup ─────────────────────────────────────────────
  let cards: Flashcard[];
  let modelVersion: string | null;
  let cacheHit = false;

  const cached = await l1Get(service, cacheKey);
  if (cached) {
    cards = cached.cards;
    modelVersion = cached.model_version;
    cacheHit = true;
  } else {
    // ── L3: live Anthropic call ───────────────────────────────────────────
    const cwcContext =
      parsed.data.mode === "paste" ? null : await getCwcContext(service, parsed.data.topic);

    try {
      const result = await generateFlashcardsLive({
        topic: parsed.data.topic,
        mode: parsed.data.mode,
        cwcContext,
      });
      cards = result.cards;
      modelVersion = result.modelVersion;
    } catch (e) {
      const status = e instanceof AnthropicError ? e.status : 502;
      const msg =
        e instanceof AnthropicError
          ? e.message
          : "Could not reach the flashcard service.";
      return NextResponse.json({ error: msg }, { status });
    }

    // Write-through to L1. Do not await failures.
    void l1Put(service, {
      cacheKey,
      promptVersion: PROMPT_VERSION,
      mode: parsed.data.mode,
      normalizedTopic: normalized,
      cards,
      modelVersion,
    });
  }

  // ── Persist set + per-card rows for this user ───────────────────────────
  // The set keeps the JSONB cards (legacy contract); the new flashcards
  // table holds per-card rows so PR 2 can attach SRS state without a
  // backfill migration.
  const { data: setRow, error: setErr } = await supabase
    .from("flashcard_sets")
    .insert({
      user_id: user.id,
      topic: parsed.data.topic,
      input_mode: parsed.data.mode,
      generation_mode: parsed.data.generation_mode,
      weak_topic_tags: parsed.data.weak_topic_tags ?? null,
      cards,
      model_version: modelVersion,
      cache_hit: cacheHit,
      cache_key: cacheKey,
      prompt_version: PROMPT_VERSION,
    })
    .select("id")
    .single();

  if (setErr || !setRow) {
    return NextResponse.json(
      { error: "Could not save flashcard set." },
      { status: 500 }
    );
  }

  // Per-card rows. Best-effort: if this fails, the set is still usable
  // through the JSONB column — PR 2 can add a backfill if needed.
  const cardRows = cards.map((c, i) => ({
    set_id: setRow.id,
    user_id: user.id,
    position: i,
    format: c.format ?? "basic",
    type: c.type,
    context: c.context ?? null,
    front: c.front,
    back: c.back,
    reasoning: c.reasoning,
    mcq_options: c.mcq_options ?? null,
    source_question_id: parsed.data.source_question_id ?? null,
    source_mock_attempt_id: parsed.data.source_mock_attempt_id ?? null,
  }));
  const { error: cardsErr } = await supabase.from("flashcards").insert(cardRows);
  if (cardsErr) {
    console.warn("[flashcards] per-card insert failed:", cardsErr.message);
  }

  return NextResponse.json({
    set_id: setRow.id,
    cards,
    cache_hit: cacheHit,
    model_version: modelVersion,
  });
}
