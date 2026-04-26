"use client";

import type { AnalyticsEventName, AnalyticsEventPayload } from "@/types";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
  }
}

export function trackEvent(
  name: AnalyticsEventName,
  payload: AnalyticsEventPayload = {}
) {
  const enriched = {
    ...payload,
    timestamp: new Date().toISOString(),
  };

  // GA4
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", name, enriched);
  }

  // Microsoft Clarity custom event
  if (typeof window !== "undefined" && window.clarity) {
    window.clarity("event", name);
  }

  // Development logging
  if (process.env.NODE_ENV === "development") {
    console.debug(`[analytics] ${name}`, enriched);
  }
}

// ── Typed event helpers ───────────────────────────────────────────────────────

export const track = {
  appOpened: (payload?: AnalyticsEventPayload) =>
    trackEvent("app_opened", payload),

  moduleOpened: (module: string, payload?: AnalyticsEventPayload) =>
    trackEvent("module_opened", { module, ...payload }),

  questionAnswered: (opts: {
    question_id: string;
    is_correct: boolean;
    domain?: string;
    topic?: string;
    source?: "manual" | "recommendation";
    session_id?: string;
  }) => trackEvent("question_answered", opts),

  mockStarted: (mock_id: string, payload?: AnalyticsEventPayload) =>
    trackEvent("mock_started", { mock_id, ...payload }),

  mockSubmitted: (opts: {
    mock_id: string;
    score: number;
    duration_seconds: number;
  }) => trackEvent("mock_submitted", opts),

  flashcardsGenerated: (opts: {
    topic: string;
    card_count: number;
    cache_hit: boolean;
    latency_ms?: number;
  }) => trackEvent("flashcards_generated", opts),

  flashcardFlipped: (opts: { set_id: string; card_index: number }) =>
    trackEvent("flashcard_flipped", opts),

  flashcardsReviewStarted: (opts: { due_count: number }) =>
    trackEvent("flashcards_review_started", opts),

  flashcardsReviewCompleted: (opts: {
    reviewed: number;
    again: number;
    hard: number;
    good: number;
    easy: number;
    duration_seconds: number;
  }) => trackEvent("flashcards_review_completed", opts),

  flashcardReviewed: (opts: {
    card_id: string;
    grade: 1 | 2 | 3 | 4;
    used_grader: boolean;
    in_session: boolean;
  }) => trackEvent("flashcard_reviewed", opts),

  flashcardGraderUsed: (opts: {
    card_id: string;
    suggestion: 1 | 2 | 3 | 4;
    accepted: boolean;
  }) => trackEvent("flashcard_grader_used", opts),

  recommendationViewed: (recommendation_id: string) =>
    trackEvent("recommendation_viewed", { recommendation_id }),

  recommendationClicked: (recommendation_id: string) =>
    trackEvent("recommendation_clicked", { recommendation_id }),

  recommendationCompleted: (recommendation_id: string) =>
    trackEvent("recommendation_completed", { recommendation_id }),

  readinessViewed: (confidence_tier: string) =>
    trackEvent("readiness_viewed", { confidence_tier }),
};
