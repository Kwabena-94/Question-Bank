-- 007_flashcards_v2.sql
-- Flashcards v2: per-card explosion for SRS, global generation cache,
-- Choosing Wisely Canada cache, and the columns needed by the new
-- internal generation pipeline.
--
-- Backwards-compatible: flashcard_sets keeps its JSONB `cards` column;
-- new per-card rows in `flashcards` are written alongside.

-- ── Card formats ─────────────────────────────────────────────────────────
CREATE TYPE card_format AS ENUM ('basic', 'cloze', 'mcq');

-- ── Per-card rows (needed for SRS — can't schedule a JSONB array) ───────
CREATE TABLE public.flashcards (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  set_id              UUID NOT NULL REFERENCES public.flashcard_sets(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position            INTEGER NOT NULL,
  format              card_format NOT NULL DEFAULT 'basic',
  type                TEXT NOT NULL,                       -- definition/clinical/...
  context             TEXT,                                -- scene-setter (NEW)
  front               TEXT NOT NULL,                       -- for cloze: text with {{c1::}} markers
  back                TEXT NOT NULL,
  reasoning           TEXT,
  mcq_options         JSONB,                               -- [{label, text, correct}] when format='mcq'
  source_question_id  UUID REFERENCES public.questions(id) ON DELETE SET NULL,
  source_mock_attempt_id UUID REFERENCES public.mock_attempts(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_fc_user ON public.flashcards(user_id, created_at DESC);
CREATE INDEX idx_fc_set  ON public.flashcards(set_id, position);
CREATE INDEX idx_fc_source_question ON public.flashcards(source_question_id) WHERE source_question_id IS NOT NULL;

-- ── SRS state (one row per card-user pair) ──────────────────────────────
CREATE TABLE public.flashcard_card_state (
  card_id             UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ease                NUMERIC(4,2) NOT NULL DEFAULT 2.50,
  interval_days       INTEGER NOT NULL DEFAULT 0,
  due_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lapses              INTEGER NOT NULL DEFAULT 0,
  reps                INTEGER NOT NULL DEFAULT 0,
  last_grade          SMALLINT,                            -- 1=Again 2=Hard 3=Good 4=Easy
  last_reviewed_at    TIMESTAMPTZ,
  PRIMARY KEY (card_id, user_id)
);
CREATE INDEX idx_fcs_due ON public.flashcard_card_state(user_id, due_at);

-- ── Review log (one row per grade event; feeds future FSRS migration) ───
CREATE TABLE public.flashcard_reviews (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id             UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grade               SMALLINT NOT NULL CHECK (grade BETWEEN 1 AND 4),
  prior_ease          NUMERIC(4,2),
  prior_interval      INTEGER,
  new_ease            NUMERIC(4,2),
  new_interval        INTEGER,
  due_at              TIMESTAMPTZ NOT NULL,
  answer_text         TEXT,                                -- typed free-text recall
  grader_suggestion   SMALLINT,                            -- AI grader's suggested grade
  reviewed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_fr_user ON public.flashcard_reviews(user_id, reviewed_at DESC);

-- ── Global generation cache (cross-user; keyed by hash of inputs) ───────
CREATE TABLE public.flashcard_cache (
  cache_key           TEXT PRIMARY KEY,                    -- sha256(normalized_topic|mode|prompt_version)
  prompt_version      TEXT NOT NULL,
  mode                TEXT NOT NULL CHECK (mode IN ('describe', 'paste')),
  normalized_topic    TEXT NOT NULL,
  cards               JSONB NOT NULL,
  model_version       TEXT,
  hits                INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at          TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days'
);
CREATE INDEX idx_fcache_expires ON public.flashcard_cache(expires_at);
CREATE INDEX idx_fcache_topic   ON public.flashcard_cache(normalized_topic, mode);

-- ── Choosing Wisely Canada scrape cache ─────────────────────────────────
CREATE TABLE public.cwc_cache (
  specialty           TEXT PRIMARY KEY,
  body                TEXT NOT NULL,
  fetched_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Augment flashcard_sets with cache linkage ───────────────────────────
ALTER TABLE public.flashcard_sets ADD COLUMN IF NOT EXISTS cache_key TEXT;
ALTER TABLE public.flashcard_sets ADD COLUMN IF NOT EXISTS prompt_version TEXT;

-- ── RLS ──────────────────────────────────────────────────────────────────
ALTER TABLE public.flashcards            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_card_state  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_reviews     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_cache       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cwc_cache             ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_flashcards"   ON public.flashcards            FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_card_state"   ON public.flashcard_card_state  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_reviews"      ON public.flashcard_reviews     FOR ALL USING (auth.uid() = user_id);
-- flashcard_cache and cwc_cache are global; only the service-role client touches them.
-- RLS is enabled with no policies so anon/authenticated reads are denied.

-- ── Helper: bump cache hit counter atomically ───────────────────────────
CREATE OR REPLACE FUNCTION public.bump_flashcard_cache_hit(p_cache_key TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.flashcard_cache
  SET hits = hits + 1, last_used_at = NOW()
  WHERE cache_key = p_cache_key;
END;
$$;
