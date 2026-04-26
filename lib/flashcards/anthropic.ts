// lib/flashcards/anthropic.ts
//
// Direct Anthropic Messages API call with prompt caching enabled.
// We use raw fetch (not the SDK) so we can pass the prompt-caching
// beta header without dependency churn — matches the proven proxy
// behavior in medcognito-proxy/api/flashcards-v3.js.

import type { CardType, Flashcard } from "@/types";
import {
  ALLOWED_CARD_TYPES,
  FLASHCARD_TOOL,
  MODEL_MAX_TOKENS,
  MODEL_NAME,
  MODEL_TEMPERATURE,
  buildSystemBlocks,
  buildUserPrompt,
} from "./prompt";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

// ── Card sanitization ───────────────────────────────────────────────────────
function isCardType(v: unknown): v is CardType {
  return typeof v === "string" && (ALLOWED_CARD_TYPES as readonly string[]).includes(v);
}

function sanitizeCards(raw: unknown): Flashcard[] {
  if (!Array.isArray(raw)) return [];
  const out: Flashcard[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    const front = typeof obj.front === "string" ? obj.front.trim() : "";
    const back = typeof obj.back === "string" ? obj.back.trim() : "";
    if (!front || !back) continue;
    out.push({
      front,
      back,
      type: isCardType(obj.type) ? obj.type : "clinical",
      reasoning: typeof obj.reasoning === "string" ? obj.reasoning.trim() : "",
      context: typeof obj.context === "string" ? obj.context.trim() : null,
      format: "basic",
    });
  }
  return out;
}

// ── Anthropic response shape (only the bits we care about) ─────────────────
interface AnthropicContentBlock {
  type: string;
  name?: string;
  input?: { cards?: unknown };
}
interface AnthropicResponse {
  content?: AnthropicContentBlock[];
  model?: string;
}

export interface GenerateResult {
  cards: Flashcard[];
  modelVersion: string;
}

export class AnthropicError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Generate flashcards via Anthropic Messages API with tool-forced output.
 * Throws AnthropicError on upstream failure or empty card response.
 */
export async function generateFlashcardsLive(args: {
  topic: string;
  mode: "describe" | "paste";
  cwcContext: string | null;
}): Promise<GenerateResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new AnthropicError(503, "Flashcard generation is not configured.");
  }

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "prompt-caching-2024-07-31",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      max_tokens: MODEL_MAX_TOKENS,
      temperature: MODEL_TEMPERATURE,
      system: buildSystemBlocks(args.cwcContext),
      tools: [FLASHCARD_TOOL],
      tool_choice: { type: "tool", name: FLASHCARD_TOOL.name },
      messages: [{ role: "user", content: buildUserPrompt(args.topic, args.mode) }],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new AnthropicError(
      502,
      `Anthropic ${res.status}: ${text.slice(0, 200) || "no body"}`
    );
  }

  const data = (await res.json()) as AnthropicResponse;
  const toolBlock = data.content?.find(
    (b) => b.type === "tool_use" && b.name === FLASHCARD_TOOL.name
  );
  const cards = sanitizeCards(toolBlock?.input?.cards);

  if (cards.length === 0) {
    throw new AnthropicError(422, "No cards returned by the model.");
  }

  return {
    cards,
    modelVersion: data.model ?? MODEL_NAME,
  };
}
