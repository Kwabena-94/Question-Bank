# MedBuddy Question Bank — Project Context

> Inherits full brain from parent. This file adds project-specific conventions for this Next.js app.

@../claude-brain/CLAUDE.md

---

## Project: MedBuddy Question Bank App

**Root:** `Digital Assistant/Question Bank/`
**Stack:** Next.js 14 App Router · TypeScript · Tailwind CSS v3.4 · shadcn/ui · Lucide React · Framer Motion · Supabase

### Non-negotiable conventions

- Every `(platform)` route must start with `await requireAuth()` from `@/lib/auth`
- Server Supabase: `@/lib/supabase/server` · Client Supabase: `@/lib/supabase/client`
- Mutations are Server Actions (e.g. `lib/mocks/actions.ts`) with zod-validated inputs
- Analytics via typed `track.*()` helpers — never call `posthog.capture` directly
- Parallelize server-component fetches with `Promise.all` — no client `useEffect` for first paint
- Run `npx tsc --noEmit` after non-trivial UI/TS changes
- Supabase migrations live in `supabase/migrations/` — apply with `supabase db push`

### Canonical UI reference

The `/mocks` page is the source of truth for all platform UI patterns. When in doubt, open `/mocks` and copy the pattern — do not invent new card or layout vocabulary.

### Design system files (in this project)

- `medcognito-design-system.md` — Tailwind tokens, globals.css, component code, animation rules
- `medcognito-style-guide.md` — Brand source of truth (colors, type, logo)
- `../medcognito-design-skills/` — Six Cowork skill files for targeted UI tasks
