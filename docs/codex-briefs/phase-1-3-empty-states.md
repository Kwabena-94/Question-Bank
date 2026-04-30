# Codex Brief — Phase 1.3: Empty States

**Branch:** `codex/phase-1-3-empty-states`
**Base:** `origin/main` (pull latest before starting)
**Estimated scope:** ~6–8 list-rendering components / pages
**Owner:** Codex
**PR target:** one PR titled `feat: empty states for every list surface`

---

## Goal

Every list, grid, or table in the platform that can be empty shows a deliberate empty state with: an illustration / icon, a short clear message, and a primary CTA pointing the user toward what to do next. No more bare "No results" strings or zero-row blanks.

---

## Surfaces in scope

| Surface | Empty when | What to show |
|---|---|---|
| **Home → Recommendations** | User has no `weak_topic_tags` yet (new account) | Brain icon · "We'll suggest topics once you've practiced a few questions" · CTA: "Start a session" → `/question-bank` |
| **Home → Today's flashcards** (if currently rendered when 0 due) | No cards due today | Sparkles icon · "Caught up for today" · Secondary text: streak count · CTA: "Generate a new deck" → `/flashcards` |
| **Question Bank → recent sessions list** | User has 0 completed sessions | Question-mark icon · "Take your first practice session" · CTA: "Start session" (scrolls to StartSessionForm) |
| **Mocks → InProgressBanner** | No in-progress mock | (Already handled — confirm it doesn't render at all rather than rendering empty) |
| **Mocks → Library grid** | No mock templates available (shouldn't happen but handle defensively) | File icon · "No mocks available yet" · No CTA (admin-side issue) |
| **Mocks → History page** | User has 0 attempts | Clock icon · "Your past mocks will appear here" · CTA: "Take your first mock" → `/mocks` |
| **Mocks → Custom mock list** | User has 0 custom mocks | Wand icon · "Build a focused mock from your weak topics" · CTA: "Create custom mock" |
| **Profile → Activity / streak** (if such a list exists) | Audit `app/(platform)/profile/page.tsx` for any list rendering — if there's an "activity" feed, give it an empty state | TBD based on what's there |

**Out of scope — flashcards:** Don't touch `app/(platform)/flashcards/**` or `components/flashcards/**`. The flashcard deck home already has its own empty state.

---

## Acceptance criteria

- [ ] Every surface above renders an intentional empty state component (not a bare conditional return null or "No results").
- [ ] Empty states use `lucide-react` icons (consistent with rest of app).
- [ ] CTAs use the primary button style: `inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]`.
- [ ] Empty states are vertically centered within their container, padded generously (`py-12` or more).
- [ ] Each CTA fires a `track.*()` analytics event when clicked. If a relevant event doesn't exist in `lib/analytics/track.ts`, ADD ONE — don't call `posthog.capture` directly.
- [ ] `npx tsc --noEmit` passes.

---

## Canonical EmptyState component

Create `components/ui/EmptyState.tsx` first, then use everywhere:

```tsx
// components/ui/EmptyState.tsx
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className = "" }: Props) {
  const ActionEl = action ? (
    action.href ? (
      <Link
        href={action.href}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]"
      >
        {action.label}
      </Link>
    ) : (
      <button
        type="button"
        onClick={action.onClick}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]"
      >
        {action.label}
      </button>
    )
  ) : null;

  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-primary/[0.08] text-primary">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="font-poppins text-base font-semibold text-neutral-900">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-neutral-600">{description}</p>}
      {ActionEl && <div className="mt-5">{ActionEl}</div>}
    </div>
  );
}
```

If a CTA needs custom analytics, the consumer wraps `onClick` to fire the event.

---

## Constraints

- **Do not touch `components/flashcards/*` or `app/(platform)/flashcards/**`.**
- Match `claude-brain/CLAUDE.md` conventions.
- Server-component fetches stay on the server. Empty-state CTAs that need client interactivity require `"use client"` only on the leaf component, not the page.
- Run `npx tsc --noEmit` after edits — must pass.
- Open ONE PR.

---

## Suggested workflow

1. Pull `origin/main` and create branch `codex/phase-1-3-empty-states`.
2. Build `components/ui/EmptyState.tsx` first.
3. Audit each in-scope surface — find the conditional that returns when empty, and replace the bare/missing UI with `<EmptyState />`.
4. Add analytics events to `lib/analytics/track.ts` if needed.
5. Test by either truncating data on the server (e.g. `.limit(0)`) or signing in as a fresh user.
6. `npx tsc --noEmit`, commit, open PR.

---

## What "done" looks like

PR description includes:
- The EmptyState component diff
- A bulleted list of every surface touched
- Two screenshots: an empty Recommendations panel and an empty History page
- Confirmation typecheck passes
- New track.* event names if any were added
