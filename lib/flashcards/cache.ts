// lib/flashcards/cache.ts
//
// L1 cache — global, cross-user generation cache stored in Supabase.
// Reads/writes use the service-role client because the table is RLS-locked
// to service-role only (it's not user-scoped data).

import type { Flashcard } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface CachedSet {
  cards: Flashcard[];
  model_version: string | null;
  cache_key: string;
}

export async function l1Get(
  service: SupabaseClient,
  cacheKey: string
): Promise<CachedSet | null> {
  const { data, error } = await service
    .from("flashcard_cache")
    .select("cards, model_version, expires_at")
    .eq("cache_key", cacheKey)
    .maybeSingle();

  if (error || !data) return null;

  // Treat expired entries as misses; let the writer overwrite.
  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
    return null;
  }

  // Bump the hit counter (fire-and-forget).
  void service.rpc("bump_flashcard_cache_hit", { p_cache_key: cacheKey });

  return {
    cards: data.cards as Flashcard[],
    model_version: data.model_version,
    cache_key: cacheKey,
  };
}

export async function l1Put(
  service: SupabaseClient,
  args: {
    cacheKey: string;
    promptVersion: string;
    mode: "describe" | "paste";
    normalizedTopic: string;
    cards: Flashcard[];
    modelVersion: string | null;
    ttlDays?: number;
  }
): Promise<void> {
  const ttlDays = args.ttlDays ?? 30;
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

  // Upsert so a re-generation refreshes the entry.
  const { error } = await service.from("flashcard_cache").upsert(
    {
      cache_key: args.cacheKey,
      prompt_version: args.promptVersion,
      mode: args.mode,
      normalized_topic: args.normalizedTopic,
      cards: args.cards,
      model_version: args.modelVersion,
      hits: 0,
      last_used_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    },
    { onConflict: "cache_key" }
  );

  if (error) {
    // Cache write failures must never break generation — log and continue.
    console.warn("[flashcards] l1Put failed:", error.message);
  }
}
