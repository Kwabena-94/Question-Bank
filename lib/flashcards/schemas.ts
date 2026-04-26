// lib/flashcards/schemas.ts
//
// Zod schemas for the flashcards API surface.

import { z } from "zod";

export const generateRequestSchema = z.object({
  topic: z.string().trim().min(1).max(5000),
  mode: z.enum(["describe", "paste"]),
  generation_mode: z.enum(["manual", "adaptive"]).default("manual"),
  weak_topic_tags: z.array(z.string().max(120)).max(20).optional(),
  source_question_id: z.string().uuid().optional(),
  source_mock_attempt_id: z.string().uuid().optional(),
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;
