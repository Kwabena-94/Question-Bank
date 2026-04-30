# Codex Brief — Phase 1.1: Mobile Responsive Sweep (non-flashcards)

**Branch:** `codex/phase-1-1-mobile-responsive`
**Base:** `origin/main` (pull latest before starting)
**Estimated scope:** ~10–15 files, mostly Tailwind class adjustments
**Owner:** Codex
**PR target:** one PR titled `polish: mobile responsive sweep across non-flashcards surfaces`

---

## Goal

Every page outside `app/(platform)/flashcards/*` renders without horizontal scroll, text clipping, or unreachable controls at four breakpoints: **375px**, **414px**, **768px**, **1024px**. Touch targets meet **≥ 44×44 px** minimum. Sidebar collapses gracefully on narrow viewports.

This is a polish pass. Do not change information architecture, copy, or business logic. Only adjust layout, spacing, font sizes, and breakpoint behavior.

---

## Files in scope

```
app/(platform)/home/page.tsx
app/(platform)/question-bank/page.tsx
app/(platform)/question-bank/session/[id]/page.tsx
app/(platform)/question-bank/session/[id]/summary/page.tsx
app/(platform)/mocks/page.tsx
app/(platform)/mocks/library/page.tsx
app/(platform)/mocks/history/page.tsx
app/(platform)/mocks/custom/page.tsx
app/(platform)/mocks/[templateId]/start/page.tsx
app/(platform)/mocks/attempt/[attemptId]/page.tsx
app/(platform)/mocks/attempt/[attemptId]/review/page.tsx
app/(platform)/profile/page.tsx
components/shell/AppShell.tsx
components/shell/Sidebar.tsx
components/mocks/*.tsx
components/question-bank/*.tsx
```

**Out of scope — do not touch:**
- `components/flashcards/**` (any file)
- `app/(platform)/flashcards/**`
- `lib/**`
- `supabase/**`
- Auth, middleware, server actions

If you find a layout bug in flashcards, note it in the PR description but don't fix it in this PR.

---

## Acceptance criteria

For each in-scope page, verified at viewports **375 / 414 / 768 / 1024 px**:

- [ ] No horizontal scroll on the document body.
- [ ] No text clipped (look for `truncate` / `overflow-hidden` masking real content).
- [ ] Headings, body text, and badges scale via `text-xs sm:text-sm`, `text-base sm:text-lg`, etc. — no fixed `text-2xl` on small screens unless it's a deliberate hero element.
- [ ] All interactive controls (buttons, links, form fields) are at least **44×44 px** tappable. Use `min-h-11` (44px) or padding to achieve this.
- [ ] Multi-column grids collapse to single column under `sm:` (640px). Use `grid-cols-1 sm:grid-cols-2` not bare `grid-cols-2`.
- [ ] Sticky headers / footers don't cover content (test scrolling on phone viewport).
- [ ] `Sidebar.tsx` has a working collapse / drawer mode on `< lg` (1024px). Use the existing AppShell pattern if one exists; otherwise add a simple drawer with a hamburger trigger in the header.
- [ ] Mock runner (`MockRunner.tsx`) and QBank session runner (`SessionRunner.tsx`) are usable on a phone — question text, options, and submit controls all visible without scrolling within the question card.
- [ ] Confirm `npx tsc --noEmit` passes.
- [ ] No new console warnings introduced.

---

## Canonical reference

The `app/(platform)/mocks/page.tsx` was designed as the source-of-truth UI pattern. **When in doubt, copy from there.** Specifically:

- Card vocabulary: `rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-card`
- Mobile-first padding: `px-4 lg:px-6 py-5 lg:py-6` on outer wrappers
- Responsive type: `text-base sm:text-lg` for section headings, `text-sm` for body, `text-xs` for meta
- Stats grids: `grid-cols-2 sm:grid-cols-4 gap-3`

If a page diverges from these patterns, bring it in line as part of this sweep.

---

## Constraints

- **Do not touch `components/flashcards/*`** — that module is settled and being iterated separately. Any collision will be rejected.
- Run `npx tsc --noEmit` after edits — must pass.
- Server-component fetches stay parallel via `Promise.all`. No new `useEffect` for first paint.
- All mutations stay as Server Actions (`lib/*/actions.ts`) with zod validation. Don't migrate any to client-side fetch.
- Analytics: any new event must go through `lib/analytics/track.ts` helpers. Don't call `posthog.capture` directly.
- Match `claude-brain/CLAUDE.md` conventions.
- Open ONE PR for the whole sweep. Don't squash other people's commits.

---

## Suggested workflow

1. Pull `origin/main` and create branch `codex/phase-1-1-mobile-responsive`.
2. Open dev server with `unset ANTHROPIC_API_KEY && PORT=3010 npm run dev` (the unset is required — there's a known empty-shell-var trap on this machine; see `.env.example` line 11–16 for context).
3. Use Chrome DevTools device toolbar → cycle through 375 / 414 / 768 / 1024.
4. Work page by page in this order: Home → Sidebar → QBank → Mocks → Profile.
5. After each page is clean across all four breakpoints, commit (`git commit -m "fix(<page>): responsive cleanup"`).
6. After all pages are done, run `npx tsc --noEmit` and open the PR.

---

## What "done" looks like

Open the PR description with:
- A bulleted list of pages touched
- Three before/after screenshots at 375px (Home, Mocks page, Profile)
- Confirmation that typecheck passes
- Any flashcards-module bugs noticed (logged, not fixed)
