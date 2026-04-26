// lib/flashcards/scheduler.ts
//
// SM-2 scheduler. Pure function so it's trivially testable and so the
// review endpoint stays a thin wrapper around it.
//
// Grades:
//   1 = Again  (forgot)
//   2 = Hard   (recalled with effort)
//   3 = Good   (recalled cleanly)
//   4 = Easy   (trivial)
//
// Notes:
// - On Again, we keep the card in-session by setting due 10 minutes out
//   and zeroing the interval; reps reset, lapses bump.
// - Ease floor is 1.30 (classic SM-2).
// - First two successful reps use fixed steps (1d, 3-4d) so the algorithm
//   doesn't misbehave on tiny ease values for new cards.

import type { Grade } from "@/types";

export interface SrsState {
  ease: number;          // multiplier; default 2.50
  interval_days: number; // current interval
  reps: number;          // consecutive successful reps
  lapses: number;        // # of times the card was failed
}

export interface SrsScheduleResult extends SrsState {
  due_at: Date;
  /** True when the card stays in the current session (grade=Again). */
  in_session: boolean;
}

const EASE_FLOOR = 1.30;
const AGAIN_DELAY_MIN = 10;

export function nextSchedule(prior: SrsState, grade: Grade, now: Date = new Date()): SrsScheduleResult {
  let { ease, interval_days, reps, lapses } = prior;

  // Adjust ease (SM-2)
  if (grade === 1) ease -= 0.20;
  else if (grade === 2) ease -= 0.15;
  else if (grade === 4) ease += 0.10;
  // grade === 3: no change
  if (ease < EASE_FLOOR) ease = EASE_FLOOR;

  let due_at: Date;
  let in_session = false;

  if (grade === 1) {
    // Lapse — back to learning, rep counter reset
    reps = 0;
    interval_days = 0;
    lapses += 1;
    due_at = new Date(now.getTime() + AGAIN_DELAY_MIN * 60 * 1000);
    in_session = true;
  } else {
    // Successful recall
    let next_interval: number;
    if (reps === 0) {
      next_interval = 1;
    } else if (reps === 1) {
      next_interval = grade === 4 ? 4 : 3;
    } else {
      const modifier = grade === 2 ? 1.2 : grade === 4 ? 1.3 : 1.0;
      next_interval = Math.max(1, Math.round(interval_days * ease * modifier));
    }
    reps += 1;
    interval_days = next_interval;
    due_at = new Date(now.getTime() + interval_days * 24 * 60 * 60 * 1000);
  }

  // Round ease to 2 decimals so DB column stays clean
  ease = Math.round(ease * 100) / 100;

  return { ease, interval_days, reps, lapses, due_at, in_session };
}

export const DEFAULT_SRS: SrsState = {
  ease: 2.5,
  interval_days: 0,
  reps: 0,
  lapses: 0,
};
