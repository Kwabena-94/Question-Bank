# Codex Brief — Phase 1.2: Loading Skeletons

**Branch:** `codex/phase-1-2-loading-skeletons`
**Base:** `origin/main` (pull latest before starting)
**Estimated scope:** ~6 new files, no logic changes
**Owner:** Codex
**PR target:** one PR titled `feat: loading skeletons for every platform route`

---

## Goal

Every server-component data fetch in `app/(platform)/*` shows a skeleton placeholder during the fetch, instead of a blank flash or the previous page persisting until ready. This is a Next.js App Router pattern — drop a `loading.tsx` next to each `page.tsx` and Next.js wires Suspense automatically.

The skeletons must visually match the eventual loaded layout closely enough that the transition doesn't feel like a jump.

---

## Files to create

| Path | Skeleton represents |
|---|---|
| `app/(platform)/loading.tsx` | Generic fallback for any route without its own loading.tsx |
| `app/(platform)/home/loading.tsx` | Hero greeting + Today's focus + Recommendations + ExamReadinessCard |
| `app/(platform)/question-bank/loading.tsx` | Section title + StartSessionForm + recent sessions list |
| `app/(platform)/question-bank/session/[id]/loading.tsx` | Question stem + 4 option buttons + footer hint |
| `app/(platform)/question-bank/session/[id]/summary/loading.tsx` | Summary header + per-question result rows |
| `app/(platform)/mocks/loading.tsx` | InProgressBanner placeholder + ExamReadinessCard + library grid (4 cards) |
| `app/(platform)/mocks/history/loading.tsx` | List of attempt rows (5 items) |
| `app/(platform)/mocks/library/loading.tsx` | Grid of mock cards (6 items) |
| `app/(platform)/mocks/[templateId]/start/loading.tsx` | Mock summary card + start CTA |
| `app/(platform)/mocks/attempt/[attemptId]/loading.tsx` | Mock runner shell — progress bar + question card |
| `app/(platform)/mocks/attempt/[attemptId]/review/loading.tsx` | Header + question results list |
| `app/(platform)/profile/loading.tsx` | Profile header + form sections |

**Out of scope:** Do NOT add a `loading.tsx` under `app/(platform)/flashcards/**` — that module is being iterated separately.

---

## Acceptance criteria

- [ ] Each `loading.tsx` exports a default component that renders a skeleton matching the structure of its sibling `page.tsx`.
- [ ] Skeletons use the same outer padding/wrapper as the real page so the transition doesn't shift content (no layout jump when the real content swaps in).
- [ ] Skeletons use the existing shimmer pattern. **First check if `animate-shimmer` exists in `app/globals.css` or `tailwind.config.ts`** — if yes, use it. If no, add it: a slow background-position animation across `bg-gradient-to-r from-neutral-100 via-neutral-200 to-neutral-100`.
- [ ] No `useEffect`, no client components — these are server components that render synchronously.
- [ ] No real data fetching in skeletons.
- [ ] `npx tsc --noEmit` passes.
- [ ] Manually verified: throttle network to "Slow 3G" in DevTools, navigate between routes, confirm skeleton appears before real content.

---

## Canonical skeleton building blocks

Create these as small helper components in `components/ui/Skeleton.tsx` first if they don't exist, then reuse:

```tsx
// components/ui/Skeleton.tsx
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-shimmer rounded-md bg-gradient-to-r from-neutral-100 via-neutral-200 to-neutral-100 bg-[length:200%_100%] ${className}`}
    />
  );
}

export function SkeletonText({ lines = 1, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3 ${i === lines - 1 ? "w-3/4" : "w-full"}`} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-card ${className}`}>
      <Skeleton className="h-4 w-1/3 mb-3" />
      <SkeletonText lines={3} />
    </div>
  );
}
```

Then each `loading.tsx` composes these into the right layout.

If `animate-shimmer` doesn't exist yet, add to `tailwind.config.ts` keyframes:

```ts
keyframes: {
  shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
},
animation: {
  shimmer: "shimmer 2s ease-in-out infinite",
},
```

---

## Constraints

- **Do not touch `components/flashcards/*` or `app/(platform)/flashcards/**`.**
- Server components only — no client `"use client"` directives.
- Match `claude-brain/CLAUDE.md` conventions.
- Run `npx tsc --noEmit` after edits — must pass.
- Open ONE PR for the whole pass.

---

## Suggested workflow

1. Pull `origin/main` and create branch `codex/phase-1-2-loading-skeletons`.
2. Create `components/ui/Skeleton.tsx` first.
3. Add the keyframes to Tailwind config if missing.
4. Build the 12 `loading.tsx` files. Match each to its sibling `page.tsx` structure — open both side-by-side.
5. Test by throttling network to Slow 3G in DevTools and navigating each route.
6. `npx tsc --noEmit`, commit, open PR.

---

## What "done" looks like

PR description includes:
- File list (the 12+ loading files + Skeleton helpers + Tailwind config diff)
- One screenshot of `/home` loading state
- One screenshot of `/mocks` loading state
- Confirmation typecheck passes
- A note if you skipped any file (and why)
