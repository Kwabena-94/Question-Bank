# Codex Briefs

Self-contained task briefs for handing off discrete chunks of work to Codex. Each brief is written to be read cold — no context from prior conversations needed.

## Workflow

1. **Pick a brief** from this folder.
2. **Open a fresh Codex session** in the project root.
3. **Paste the brief contents** as the first message, then say "Execute this brief end-to-end and open the PR."
4. Codex works on its own branch and opens a PR. Review and merge.

## Conventions every brief assumes

- Branch: `codex/<brief-id>` (e.g. `codex/phase-1-1-mobile-responsive`)
- Base branch: latest `origin/main`
- One PR per brief, titled per the brief's `PR target` line.
- `npx tsc --noEmit` must pass before opening the PR.
- Stack conventions in `claude-brain/CLAUDE.md` apply.
- `components/flashcards/**` and `app/(platform)/flashcards/**` are **off-limits** unless the brief explicitly says otherwise — Claude handles that module to avoid collisions.
- Local dev: run with `unset ANTHROPIC_API_KEY && PORT=3010 npm run dev` (see `.env.example` for why).

## Active briefs — Phase 1

| Brief | Status |
|---|---|
| [1.1 Mobile responsive sweep](./phase-1-1-mobile-responsive-sweep.md) | Ready to assign |
| [1.2 Loading skeletons](./phase-1-2-loading-skeletons.md) | Ready to assign |
| [1.3 Empty states](./phase-1-3-empty-states.md) | Ready to assign |

Phase 1 chunks 1.4 (error boundaries), 1.5 (SW hardening), 1.6 (telemetry audit), 1.7 (dev-server guard) are owned by Claude and tracked in-session.
