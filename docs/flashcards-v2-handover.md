# Flashcards v2 — Handover Notes for PR 4 + PR 5

> **Audience:** another coding agent (or human) picking up **PR 4 (card formats)
> and PR 5 (pre-warm + polish)** of the flashcards rebuild.
>
> **PR 1 (internal generation pipeline)** shipped in commit `f511b33`.
> **PR 2 (SRS surface) and PR 3 (cross-platform integration)** are being executed
> by the agent that produced this doc — when you pick up PR 4, both should be
> on `main` (or the active feature branch). If they are NOT yet merged, stop
> and check status before proceeding; PR 4 builds on review-session components
> and the per-card schema that PR 2/3 finalize.
>
> This doc gives you everything to ship PR 4 and PR 5 without re-discovering
> context.

---

## Background — what we're building and why

The MedBuddy flashcards module is being rebuilt to:

1. **Remove dependency on the legacy `medcognito-proxy` Vercel deployment.**
   PR 1 replaced the proxy with a direct Anthropic call inside this Next.js
   app, behind a layered cache.
2. **Become AI-native and integrated**, per the PRD (`medcognito-unified-app-prd.md`)
   §8.3, §8.5, §8.7, §9.1. Cards should appear in-flow inside QBank and Mocks,
   not just on a standalone page.
3. **Match modern Anki-grade UX** with spaced repetition (SM-2),
   AI-graded free-text recall, mobile-first swipe gestures, cloze + MCQ
   formats, and offline-friendly review.

The full UX spec lives in the conversation history that produced this doc.
The agreed configuration is **option 2.B.2**:

- Primary entry: in-flow generation (QBank wrongs → "Remember this", Mock submit → review pack)
- Manual `/flashcards/new` is secondary
- Card formats: front/back · cloze · mini-MCQ
- Review surface: SM-2 + AI-assisted free-text recall, mobile swipe gestures
- Inline QBank trigger: topic-not-covered + 3-wrong escalation
- Post-mock pack: generated at submission, async
- Daily review cap: 100 (configurable later)
- Voice input: NOT in v1

---

## What PR 1 delivered (already on disk, typecheck clean)

| File | Purpose |
|---|---|
| `supabase/migrations/007_flashcards_v2.sql` | New tables: `flashcards`, `flashcard_card_state`, `flashcard_reviews`, `flashcard_cache`, `cwc_cache`. New `card_format` enum. Adds `cache_key`, `prompt_version` to `flashcard_sets`. RLS policies set. SECURITY DEFINER `bump_flashcard_cache_hit(text)` RPC. |
| `types/index.ts` | `Flashcard` now has optional `context`, `format`, `mcq_options`. New `CardFormat` and `Grade` types. |
| `lib/flashcards/prompt.ts` | System blocks lifted from proxy verbatim. `PROMPT_VERSION` constant — bump to invalidate L1 cache. Anthropic tool spec. |
| `lib/flashcards/anthropic.ts` | Direct Messages API call with `prompt-caching-2024-07-31` beta header. Sanitizes cards against `CardType` union. Throws `AnthropicError` on failure. |
| `lib/flashcards/cache.ts` | `l1Get(service, key)` / `l1Put(service, args)` against `flashcard_cache`. Uses service-role client (RLS-locked). |
| `lib/flashcards/cwc.ts` | Choosing Wisely Canada grounding. Topic-keyword map → specialty slug → scrape with 4s timeout. Cached in `cwc_cache` with 24h TTL. |
| `lib/flashcards/topic-key.ts` | `normalizeTopic()` + `buildCacheKey()` (sha256 of `version\|mode\|normalized`). |
| `lib/flashcards/rate-limit.ts` | Per-user Upstash sliding window 20/30min. Degrades to allow-all if Upstash env vars missing. |
| `lib/flashcards/schemas.ts` | Zod request schema. |
| `app/api/flashcards/generate/route.ts` | New pipeline: rate-limit → L1 lookup → Anthropic on miss → write through to L1 → persist set + per-card rows. **Response contract preserved**: `{ set_id, cards, cache_hit, model_version }`. |
| `.env.example` | Dropped `FLASHCARD_PROXY_URL`. Added `ANTHROPIC_API_KEY`. |
| `package.json` | Added `@upstash/ratelimit ^2.0.8`. |

### Things to know about PR 1's choices

- **Response is JSON, not SSE.** I kept the JSON contract so the existing
  `components/flashcards/FlashcardFlow.tsx` keeps working unchanged. PR 2
  introduces the new ReviewSession UI; that's where SSE belongs.
- **Per-card explosion is best-effort.** The route writes per-card rows into
  `flashcards`, but a failure there only logs a warning — the set is still
  usable through `flashcard_sets.cards` JSONB. PR 2 may want a backfill if
  any pre-PR-1 sets need SRS scheduling.
- **`flashcard_cache` is global / cross-user.** RLS is enabled with no
  policies, so only the service-role client can touch it. Same for `cwc_cache`.
- **No streaming in PR 1.** The route waits for the full Anthropic response
  before returning. This matches the proxy's prior behavior and the
  existing client. Add streaming in PR 2/4.

---

## What PR 1 did NOT do (deliberate)

- Did not change `components/flashcards/FlashcardFlow.tsx` — UX rebuild lives in PR 2/3.
- Did not redesign `/flashcards` deck home — PR 2.
- Did not add `/flashcards/review` page — PR 2.
- Did not add inline QBank "Remember this" or post-mock review pack — PR 3.
- Did not add cloze or MCQ rendering — PR 4.
- Did not add the pre-warm cron — PR 5.

---

## Schema reference (for all future PRs)

```sql
flashcards (
  id, set_id, user_id, position,
  format card_format,                   -- 'basic' | 'cloze' | 'mcq'
  type, context, front, back, reasoning,
  mcq_options jsonb,                    -- [{label,text,correct}] when format='mcq'
  source_question_id,                   -- nullable FK to questions
  source_mock_attempt_id,               -- nullable FK to mock_attempts
  created_at
)

flashcard_card_state (
  card_id, user_id,
  ease numeric(4,2) default 2.50,       -- SM-2 ease factor
  interval_days int default 0,
  due_at timestamptz default now(),
  lapses int default 0,
  reps int default 0,
  last_grade smallint,                  -- 1..4
  last_reviewed_at,
  PRIMARY KEY (card_id, user_id)
)

flashcard_reviews (
  id, card_id, user_id,
  grade smallint check (1..4),
  prior_ease, prior_interval, new_ease, new_interval,
  due_at,
  answer_text,                          -- typed free-text recall
  grader_suggestion smallint,           -- AI grader's suggested grade
  reviewed_at
)

flashcard_cache (                       -- global, service-role only
  cache_key PK, prompt_version, mode, normalized_topic,
  cards jsonb, model_version, hits,
  created_at, last_used_at, expires_at
)

cwc_cache (                             -- global, service-role only
  specialty PK, body, fetched_at
)
```

RLS: own_flashcards / own_card_state / own_reviews policies on user-scoped
tables. `flashcard_cache` and `cwc_cache` have RLS enabled with NO
policies — only `createServiceClient()` can read/write.

Helpful RPC: `public.bump_flashcard_cache_hit(p_cache_key text)` —
SECURITY DEFINER, increments `hits` and refreshes `last_used_at`.

---

## Conventions you must follow

These are project-wide, not flashcards-specific. Failing to follow them
is the most common reason a PR gets reverted.

1. **Auth.** Every `(platform)` route starts with `await requireAuth()`
   from `@/lib/auth`. API routes do `const { data: { user } } = await supabase.auth.getUser()` and 401 if `!user`.
2. **Supabase clients.** Server: `@/lib/supabase/server` (`createClient` for
   user-scoped, `createServiceClient` for admin). Client: `@/lib/supabase/client`.
3. **Mutations are Server Actions** with zod-validated inputs. See
   `lib/mocks/actions.ts` for the canonical pattern. API routes are reserved
   for streaming or external-service-facing endpoints.
4. **Analytics.** Typed `track.*()` helpers in `lib/analytics/track.ts`. Never
   call `posthog.capture` or hit `/api/analytics/events` directly from
   components. New events go in `track.ts` first.
5. **Server-component fetching.** Parallelize with `Promise.all`. No
   `useEffect` for first paint.
6. **Typecheck after every meaningful change:** `npx tsc --noEmit`. Project
   lacks an explicit TS target — avoid `\p{...}` regex Unicode flags.
7. **Design system.** `/mocks` page is the canonical UI reference. See
   `medcognito-design-system.md` Appendix A. Key rules:
   - Card surface: `rounded-xl bg-white border border-neutral-200/70 shadow-card hover:shadow-card-hover transition-shadow duration-200 p-6`
   - Burgundy `primary #9E0E27` for CTAs; accent `#FE7406` only for in-progress;
     info teal `#145A79` only for smart/AI-derived surfaces
   - Micro-interactions: `transition-all duration-200 active:scale-[0.98]`
   - Uppercase kicker labels: `text-[11px] font-medium uppercase tracking-wider text-neutral-500`
   - **Never use the literal word "AI"** in user-facing copy. Use "Smart" or "Recommended".
   - Use `bg-primary/[0.08]` not `bg-primary/8`.

---

## What PR 2 + PR 3 already shipped (your starting state)

> If you're starting PR 4, **read the commits first**:
> ```bash
> git log --oneline --grep="PR [23] of flashcards"
> ```
> The commit messages and the files below are the contract you're building on.
> If anything contradicts what's described here, trust the code over the doc.

### PR 2 — SRS surface (already on the branch)

Shipped:
- `lib/flashcards/scheduler.ts` — SM-2 algorithm (input: prior state + grade 1–4, output: new ease/interval/due_at).
- `lib/flashcards/grader.ts` — Anthropic Haiku call that suggests a 1–4 grade given (front, back, answer_text). Returns `null` on timeout/failure; UI must always allow manual grading.
- `GET /api/flashcards/due` — returns due cards for the user, capped at 100/day (configurable later via `profiles.daily_review_cap`).
- `POST /api/flashcards/review` — body `{ card_id, grade, answer_text?, grader_suggestion? }`. Upserts `flashcard_card_state`, inserts `flashcard_reviews`, fires `track.flashcardReviewed`.
- `components/flashcards/ReviewSession.tsx` — typed-recall input → reveal → AI suggestion chip → 4-button grade with intervals shown beneath each button. Mobile gestures: swipe right=Good, left=Again, up=Hard, long-press=Easy. Buttons remain visible.
- `app/(platform)/flashcards/review/page.tsx` — server-fetches due queue, mounts ReviewSession.
- `app/(platform)/flashcards/page.tsx` — redesigned deck home: Due Today hero (accent orange), Streak summary, Recommendations strip (info teal), Decks grid. The legacy `FlashcardFlow` is now reached via a small "+ Make a deck" button.
- Analytics events added to `lib/analytics/track.ts`: `flashcards_review_started`, `flashcards_review_completed`, `flashcard_reviewed`, `flashcard_grader_used`.

### PR 3 — Cross-platform integration (already on the branch)

Shipped:
- `lib/flashcards/quick-card.ts` — extracts a card from a question (no LLM): front=stem, back=correct option text, reasoning=explanation. Used by the cheap "Remember this" path.
- `lib/flashcards/coverage.ts` — `isTopicCovered(userId, specialty, tag)` returns true if the user already has a card on that specialty+tag. Used to gate the inline QBank prompt.
- `components/question-bank/RememberThisPrompt.tsx` — appears below the explanation when the user got the question wrong AND `isTopicCovered === false`. One tap creates the card via `/api/flashcards/quick-add`.
- `app/api/flashcards/quick-add/route.ts` — POST `{ question_id }`. Creates card from question, inserts into the user's "From wrong answers" deck (auto-created on first use), schedules `due_at = now() + 1 day`.
- 3-wrong escalation in QBank session: if a user gets 3+ wrongs on the same `clinical_specialty + primary_tag` in one session, the prompt upgrades from "Add card" to "Generate a 10-card refresher" which calls `/api/flashcards/generate` with `generation_mode: 'adaptive'`.
- Post-mock review pack: `lib/mocks/actions.ts` mock-submit action now fires `void generateMockReviewPack(...)` (fire-and-forget) which generates cards from the top-3 weak topics (cache-aware). Results page reads from `flashcard_sets` and renders a banner above the domain breakdown when a pack exists.
- `/home` due chip: small accent-orange pill `📚 N due — M min` linking to `/flashcards/review`. Estimate: `count * 0.33` minutes.
- `/home` Smart Recommendations strip gets a "Generate from weak domain" variant when readiness identifies a domain with no recent flashcards.
- `ExamReadinessCard` footer CTA gets a "Generate review deck →" variant when a domain has trended down >5% over 7 days AND has no flashcards in the last 14 days.

### Implications for PR 4

- The per-card schema (`flashcards.format`, `flashcards.mcq_options`) is already populated by the generation pipeline — PR 4 just needs to teach the LLM to choose formats and the UI to render them.
- `ReviewSession.tsx` will need a sub-component switch on `card.format` — basic / cloze / mcq variants.
- `PROMPT_VERSION` bump in PR 4 invalidates all L1 cache entries naturally; this is fine, the cache rebuilds.

---

## PR 4 — Card format expansion (cloze + MCQ)

**Goal:** the LLM picks the optimal format for each card; the UI renders
each format correctly. Cloze deletion is the single most-used format in
serious med-school Anki — high impact.

### Prompt changes

Update `lib/flashcards/prompt.ts`:

1. Bump `PROMPT_VERSION` (this invalidates L1).
2. Update `FLASHCARD_TOOL.input_schema.items.properties` to add:
   - `format: { type: "string", enum: ["basic", "cloze", "mcq"] }`
   - `mcq_options: { type: "array", items: {...}, minItems: 4, maxItems: 4 }`
3. Add to `CARD_FORMAT_RULES`:
   ```
   Choose the best format per card:
   - basic: definition, recall, single-fact mastery
   - cloze: clinical vignettes where 1-2 key terms are the high-yield retrieval
     target. Format the front with {{c1::answer}} markers. Back must list the
     same terms in order.
   - mcq: when the topic has 3 clinically-meaningful distractors. Provide 4
     options with exactly 1 correct=true.
   Aim for ~50% basic, ~30% cloze, ~20% mcq across a 10-card set.
   ```
4. Update `sanitizeCards()` in `anthropic.ts` to read and validate
   `format` + `mcq_options`.

### Cloze rendering

`components/flashcards/cards/ClozeCard.tsx`:
- Front shows the text with cloze markers replaced by `[ ___ ]`.
- "Reveal" button replaces blanks with the answers in green.
- Use a regex parser: `/\{\{c(\d+)::([^}]+?)\}\}/g`.

### MCQ rendering

`components/flashcards/cards/McqCard.tsx`:
- Match the QBank explanation visual language for continuity.
- Submit reveals correct + per-option reasoning.
- After reveal, standard 4-button grade.

### Definition of done for PR 4

- Generator produces a mix of formats per set.
- Each format renders correctly in `ReviewSession`.
- Reviews still log + schedule via SM-2 regardless of format.
- L1 cache populated under bumped `PROMPT_VERSION` (old entries naturally expire).

---

## PR 5 — Pre-warming + polish

### Pre-warm endpoint

`app/api/flashcards/prewarm/route.ts`:
- POST only. Auth via `x-cron-secret` header matching `process.env.CRON_SECRET`.
- Iterates the top-50 MCCQE blueprint topics (define `lib/flashcards/blueprint-topics.ts`).
- For each, builds the cache key, checks L1, calls Anthropic only on miss.
- Logs hit/miss/error counts. Returns summary JSON.

Don't wire the cron in PR 5 — that's an ops decision. Vercel Cron config
goes in `vercel.json`.

### Polish

- Skeleton + step-timeline loading states on `/flashcards/new` generation.
- Daily review cap setting on profile (`profiles.daily_review_cap int default 100`).
- Empty / offline / error states refined per UX spec §7.
- PWA manifest + service worker for offline review (cards in IndexedDB,
  grade actions queued).

---

## Local dev setup checklist

For any agent picking up the next PR:

```bash
cd "/Users/kwabena/Desktop/Digital Assistant/Question Bank"
npm install                      # ensure deps fresh after PR 1 added @upstash/ratelimit
supabase db push                 # apply migration 007
# In .env.local set ANTHROPIC_API_KEY (copy from medcognito-proxy Vercel env)
# Optional: UPSTASH_REDIS_REST_URL / TOKEN — without them, rate limit is allow-all
npm run dev
```

Smoke test PR 1 end-to-end:

1. Visit `/flashcards`, generate a deck on "atrial fibrillation".
2. Confirm `flashcard_sets` row + 5–10 `flashcards` rows in Supabase.
3. Generate the same topic again — `cache_hit` should be `true`, no Anthropic call.
4. Check `flashcard_cache.hits` incremented.

---

## Open questions to revisit before each PR

These were deferred during planning. Ask the user before locking in.

- **PR 2:** Daily review cap surface (silent enforcement vs banner "you're capped at 100/day, change in settings")?
- **PR 3:** "Remember this" prompt — auto-add silently (low friction) or always require tap (consent)? Current spec says tap.
- **PR 3:** Mock review pack — should the user see a "generating…" state on results page if it hasn't finished, or always wait until done before showing the banner?
- **PR 4:** Image occlusion (anatomy/imaging cards) — defer to v2 confirmed, but reconfirm.
- **PR 5:** Pre-warm topic list source — hardcoded in `lib/flashcards/blueprint-topics.ts` or derived from a `mcc_blueprint_topics` table?

---

## Reference files (don't lose track)

- **PRD:** `medcognito-unified-app-prd.md` — §8.3, §8.5, §8.7, §9.1 are the relevant sections.
- **Design system:** `medcognito-design-system.md` Appendix A.
- **Style guide:** `medcognito-style-guide.md` (brand truth).
- **Legacy proxy (delete dependency, but keep around for reference):** `~/Desktop/medcognito-proxy/api/flashcards-v3.js`. v4 is identical + a CORS allowlist. The system prompts are now in `lib/flashcards/prompt.ts`.
- **Project CLAUDE.md:** `Question Bank/CLAUDE.md` (imports brain).
- **Master CLAUDE.md:** `~/Desktop/Digital Assistant/claude-brain/CLAUDE.md` — has platform UI conventions.

---

*Last updated at end of PR 1, 2026-04-26.*
