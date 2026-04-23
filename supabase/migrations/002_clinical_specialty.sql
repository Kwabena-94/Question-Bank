-- ============================================================
-- Add clinical specialty axis to questions
-- Source data groups by clinical specialty (medicine, obgyn…)
-- which is orthogonal to the MCC competency `domain`.
-- ============================================================

CREATE TYPE clinical_specialty AS ENUM (
  'medicine', 'obgyn', 'peds', 'pop_health', 'psych', 'surgery'
);

ALTER TABLE public.questions
  ADD COLUMN clinical_specialty clinical_specialty;

CREATE INDEX idx_questions_specialty
  ON public.questions(clinical_specialty)
  WHERE is_published = true;

-- Enables idempotent upserts for imported/legacy questions.
CREATE UNIQUE INDEX uq_questions_source_reference
  ON public.questions(source_reference)
  WHERE source_reference IS NOT NULL;

-- ── Question Bank sessions ───────────────────────────────────
-- Practice sessions (tutor mode). Mocks use mock_attempts instead.

CREATE TABLE public.qb_sessions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_ids    UUID[] NOT NULL,
  filters         JSONB NOT NULL DEFAULT '{}',
  length          INTEGER NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_qbs_user ON public.qb_sessions(user_id, created_at DESC);

ALTER TABLE public.qb_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_qbs" ON public.qb_sessions FOR ALL USING (auth.uid() = user_id);
