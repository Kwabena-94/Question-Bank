import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { generateFlashcardsLive } from "@/lib/flashcards/anthropic";
import { MCCQE_BLUEPRINT_TOPICS } from "@/lib/flashcards/blueprint-topics";
import { l1Get, l1Put } from "@/lib/flashcards/cache";
import { getCwcContext } from "@/lib/flashcards/cwc";
import { PROMPT_VERSION } from "@/lib/flashcards/prompt";
import { buildCacheKey, normalizeTopic } from "@/lib/flashcards/topic-key";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const suppliedSecret = req.headers.get("x-cron-secret");
  if (!cronSecret || suppliedSecret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = await createServiceClient();
  const summary = {
    prompt_version: PROMPT_VERSION,
    checked: MCCQE_BLUEPRINT_TOPICS.length,
    hits: 0,
    misses: 0,
    warmed: 0,
    errors: 0,
    error_topics: [] as Array<{ topic: string; error: string }>,
  };

  for (const topic of MCCQE_BLUEPRINT_TOPICS) {
    const normalized = normalizeTopic(topic, "describe");
    const cacheKey = buildCacheKey(normalized, "describe");
    const cached = await l1Get(service, cacheKey);
    if (cached) {
      summary.hits += 1;
      continue;
    }

    summary.misses += 1;
    try {
      const cwcContext = await getCwcContext(service, topic);
      const result = await generateFlashcardsLive({
        topic,
        mode: "describe",
        cwcContext,
      });
      await l1Put(service, {
        cacheKey,
        promptVersion: PROMPT_VERSION,
        mode: "describe",
        normalizedTopic: normalized,
        cards: result.cards,
        modelVersion: result.modelVersion,
      });
      summary.warmed += 1;
    } catch (error) {
      summary.errors += 1;
      summary.error_topics.push({
        topic,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  console.info("[flashcards] prewarm summary", summary);
  return NextResponse.json(summary);
}
