// lib/flashcards/rate-limit.ts
//
// Per-user rate limit for flashcard generation. Backed by Upstash Redis
// when env vars are present; degrades to a no-op limiter (allow-all) so
// local dev without Upstash still works.
//
// Limits chosen to match the proxy's old policy: 20 generations per
// 30 minutes per user.

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let limiter: Ratelimit | null | undefined;

function getLimiter(): Ratelimit | null {
  if (limiter !== undefined) return limiter;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    limiter = null;
    return null;
  }

  const redis = new Redis({ url, token });
  limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "30 m"),
    analytics: true,
    prefix: "fc:gen",
  });
  return limiter;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

export async function checkGenerationRateLimit(
  userId: string
): Promise<RateLimitResult> {
  const lim = getLimiter();
  if (!lim) {
    // No Upstash configured — allow but signal it.
    return { success: true, limit: Infinity, remaining: Infinity, resetAt: 0 };
  }

  const r = await lim.limit(`u:${userId}`);
  return {
    success: r.success,
    limit: r.limit,
    remaining: r.remaining,
    resetAt: r.reset,
  };
}
