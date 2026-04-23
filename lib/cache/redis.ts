import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export default redis;

// ── TTLs (seconds) ────────────────────────────────────────────────────────────
export const TTL = {
  flashcardGeneration: 60 * 60 * 24 * 7,  // 7 days — topic-level semantic cache
  homeSummary: 60 * 5,                     // 5 min — dashboard stats
  readinessScore: 60 * 30,                 // 30 min — recomputed after major events
  recommendations: 60 * 15,               // 15 min
};

// ── Semantic flashcard cache ──────────────────────────────────────────────────

function normaliseTopicKey(topic: string): string {
  return topic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 80);
}

export async function getCachedFlashcards(topic: string) {
  const key = `flashcards:${normaliseTopicKey(topic)}`;
  return redis.get<object>(key);
}

export async function setCachedFlashcards(topic: string, cards: object) {
  const key = `flashcards:${normaliseTopicKey(topic)}`;
  await redis.set(key, cards, { ex: TTL.flashcardGeneration });
}

// ── Generic helpers ───────────────────────────────────────────────────────────

export async function getCached<T>(key: string): Promise<T | null> {
  return redis.get<T>(key);
}

export async function setCached(key: string, value: unknown, ttl: number) {
  await redis.set(key, value, { ex: ttl });
}

export async function invalidateCache(key: string) {
  await redis.del(key);
}

export function userKey(userId: string, suffix: string) {
  return `user:${userId}:${suffix}`;
}
