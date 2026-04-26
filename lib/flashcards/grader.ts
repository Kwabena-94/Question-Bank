// lib/flashcards/grader.ts
//
// AI-assisted free-text recall grader. Always-visible suggestion chip:
// the user types their recalled answer, we send it to Haiku alongside
// the canonical back-of-card and a short rubric, and we get back a
// suggested grade (1-4) plus a one-line rationale.
//
// The student remains the source of truth — the chip only suggests.
// Grader failures degrade gracefully (we just don't show a suggestion).

import { MODEL_NAME } from "./prompt";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const GRADER_MAX_TOKENS = 200;
const GRADER_TIMEOUT_MS = 8000;

export interface GraderInput {
  question: string;        // card front (or stem)
  expected: string;        // card back
  studentAnswer: string;   // typed recall
  context?: string | null; // optional scene-setter from card.context
}

export interface GraderResult {
  grade: 1 | 2 | 3 | 4;
  rationale: string;
}

const SYSTEM = `You are grading a medical student's free-text recall against the canonical answer.

Return one of four grades:
- 1 (Again): missed the key concept or got it wrong
- 2 (Hard):  partial recall — got the gist but missed specifics or had to think hard
- 3 (Good):  recalled the key points cleanly
- 4 (Easy):  recalled completely and accurately, including nuance

Be lenient on phrasing, strict on clinical correctness. Synonyms count.
A wrong drug, dose, or diagnosis is grade 1 even if the rest is right.`;

const TOOL = {
  name: "grade_recall",
  description: "Grade the student's recall on a 1-4 scale.",
  input_schema: {
    type: "object",
    properties: {
      grade: { type: "integer", enum: [1, 2, 3, 4] },
      rationale: { type: "string", maxLength: 240 },
    },
    required: ["grade", "rationale"],
  },
} as const;

export async function gradeRecall(input: GraderInput): Promise<GraderResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const userPrompt = [
    input.context ? `Scenario: ${input.context}` : null,
    `Question: ${input.question}`,
    `Canonical answer: ${input.expected}`,
    `Student answer: ${input.studentAnswer.trim() || "(blank)"}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GRADER_TIMEOUT_MS);

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        max_tokens: GRADER_MAX_TOKENS,
        temperature: 0,
        system: SYSTEM,
        tools: [TOOL],
        tool_choice: { type: "tool", name: "grade_recall" },
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      content?: Array<{ type: string; name?: string; input?: unknown }>;
    };
    const block = json.content?.find((b) => b.type === "tool_use" && b.name === "grade_recall");
    if (!block || typeof block.input !== "object" || !block.input) return null;
    const { grade, rationale } = block.input as { grade?: number; rationale?: string };
    if (grade !== 1 && grade !== 2 && grade !== 3 && grade !== 4) return null;
    return { grade, rationale: typeof rationale === "string" ? rationale : "" };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
