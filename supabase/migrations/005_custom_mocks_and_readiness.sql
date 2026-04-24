-- ============================================================
-- Custom mocks: user-configured attempts with null template.
-- Readiness: denormalized per-user snapshot recomputed on submit.
-- ============================================================

-- Store the user's choices for custom attempts: count, specialties, duration.
ALTER TABLE public.mock_attempts
  ADD COLUMN custom_config JSONB;

-- For custom attempts we need to carry the ordered question list and
-- duration on the attempt itself (no template to inherit from).
ALTER TABLE public.mock_attempts
  ADD COLUMN question_ids UUID[],
  ADD COLUMN duration_minutes INTEGER,
  ADD COLUMN title TEXT;

-- The original partial unique index only fires when mock_template_id is NOT NULL
-- (Postgres treats NULLs as distinct), so custom attempts are naturally exempt.
-- Add a separate guard: at most one in-progress custom attempt per user.
CREATE UNIQUE INDEX uq_ma_one_in_progress_custom
  ON public.mock_attempts(user_id)
  WHERE status = 'in_progress' AND mock_template_id IS NULL;

-- Mocks history lookup (used by /mocks/history)
CREATE INDEX IF NOT EXISTS idx_ma_user_submitted
  ON public.mock_attempts(user_id, submitted_at DESC)
  WHERE status = 'submitted';
