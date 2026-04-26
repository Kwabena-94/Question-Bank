// lib/flashcards/topic-key.ts
//
// Topic normalization + cache-key derivation.
//
// Goals:
// - "Atrial Fibrillation", "atrial fibrillation", "  atrial  fibrillation  "
//   should all produce the same key in describe mode (so the cache hits).
// - Paste mode should NOT collapse to the topic — different note dumps
//   should produce different cards. We hash the full normalized body.
// - Changing PROMPT_VERSION naturally invalidates all old keys.

import { createHash } from "node:crypto";
import { PROMPT_VERSION } from "./prompt";

export function normalizeTopic(input: string, mode: "describe" | "paste"): string {
  let s = input.trim().toLowerCase();
  // Collapse whitespace
  s = s.replace(/\s+/g, " ");
  if (mode === "describe") {
    // Strip surrounding punctuation, keep internal hyphens + slashes
    // Strip surrounding ASCII punctuation + whitespace (keep internal hyphens/slashes)
    s = s.replace(/^[\s.,;:!?'"()[\]{}]+|[\s.,;:!?'"()[\]{}]+$/g, "");
  }
  // Hard cap so a giant paste can still produce a stable hash
  return s.slice(0, 4000);
}

export function buildCacheKey(
  normalizedTopic: string,
  mode: "describe" | "paste"
): string {
  const hash = createHash("sha256");
  hash.update(`${PROMPT_VERSION}|${mode}|${normalizedTopic}`);
  return `fc:${PROMPT_VERSION}:${mode}:${hash.digest("hex").slice(0, 32)}`;
}
