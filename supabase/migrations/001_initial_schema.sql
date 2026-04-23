-- ============================================================
-- MedCognito Unified Platform — Initial Schema
-- Run via: supabase db push
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Enums ────────────────────────────────────────────────────

CREATE TYPE exam_track AS ENUM ('mccqe1', 'nac_osce', 'nclex_rn', 'pebc');
CREATE TYPE mcc_domain AS ENUM (
  'health_promotion', 'assessment_diagnosis', 'acute_care', 'chronic_care',
  'management', 'communication', 'psychosocial', 'professional_behaviours'
);
CREATE TYPE canmeds_role AS ENUM (
  'medical_expert', 'communicator', 'collaborator', 'leader',
  'health_advocate', 'scholar', 'professional'
);
CREATE TYPE difficulty AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE mock_type AS ENUM ('diagnostic', 'timed');
CREATE TYPE mock_status AS ENUM ('in_progress', 'submitted', 'abandoned');
CREATE TYPE card_type AS ENUM (
  'definition', 'clinical', 'investigation', 'management',
  'complications', 'differentials', 'referral'
);
CREATE TYPE recommendation_type AS ENUM ('question_set', 'flashcard', 'mock', 'topic_review');
CREATE TYPE recommendation_status AS ENUM ('pending', 'viewed', 'clicked', 'completed', 'dismissed');
CREATE TYPE recommendation_source AS ENUM ('weak_area', 'recency', 'mock_result');
CREATE TYPE confidence_tier AS ENUM ('early', 'developing', 'reliable');
CREATE TYPE ingestion_job_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected', 'edited');
CREATE TYPE user_role AS ENUM ('student', 'admin');
CREATE TYPE attempt_source AS ENUM ('question_bank', 'mock', 'recommendation');

-- ── Profiles (extends auth.users) ───────────────────────────

CREATE TABLE public.profiles (
  id                  UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email               TEXT NOT NULL,
  full_name           TEXT,
  exam_pathway        exam_track,
  teachable_user_id   TEXT UNIQUE,
  role                user_role NOT NULL DEFAULT 'student',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── Topics ───────────────────────────────────────────────────

CREATE TABLE public.topics (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name              TEXT NOT NULL UNIQUE,
  domain            mcc_domain NOT NULL,
  subdomain         TEXT,
  mcc_domain_code   TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Questions ────────────────────────────────────────────────

CREATE TABLE public.questions (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content             TEXT NOT NULL,
  options             JSONB NOT NULL,         -- [{key: 'a', text: '...'}]
  correct_option      TEXT NOT NULL,
  explanation         TEXT NOT NULL,
  topic_id            UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  domain              mcc_domain,
  subdomain           TEXT,
  difficulty          difficulty,
  canmeds_role        canmeds_role,
  source_reference    TEXT,
  image_urls          TEXT[],
  is_published        BOOLEAN NOT NULL DEFAULT false,
  ingestion_source    TEXT CHECK (ingestion_source IN ('manual', 'ai_ingestion', 'import')),
  ingestion_metadata  JSONB,                  -- model, source_file, generated_at
  created_by          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_questions_domain    ON public.questions(domain) WHERE is_published = true;
CREATE INDEX idx_questions_topic     ON public.questions(topic_id) WHERE is_published = true;
CREATE INDEX idx_questions_published ON public.questions(is_published, created_at DESC);

-- ── Question Attempts ────────────────────────────────────────

CREATE TABLE public.question_attempts (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id           UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option       TEXT NOT NULL,
  is_correct            BOOLEAN NOT NULL,
  time_spent_seconds    INTEGER,
  session_id            TEXT,
  source                attempt_source NOT NULL DEFAULT 'question_bank',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_qa_user_id    ON public.question_attempts(user_id, created_at DESC);
CREATE INDEX idx_qa_question   ON public.question_attempts(question_id);
CREATE INDEX idx_qa_session    ON public.question_attempts(session_id) WHERE session_id IS NOT NULL;

-- ── Mock Templates ───────────────────────────────────────────

CREATE TABLE public.mock_templates (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title                 TEXT NOT NULL,
  type                  mock_type NOT NULL,
  duration_minutes      INTEGER NOT NULL DEFAULT 160,
  question_count        INTEGER NOT NULL DEFAULT 115,
  domain_distribution   JSONB,
  is_published          BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Mock Attempts ────────────────────────────────────────────

CREATE TABLE public.mock_attempts (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mock_template_id      UUID REFERENCES public.mock_templates(id) ON DELETE SET NULL,
  status                mock_status NOT NULL DEFAULT 'in_progress',
  started_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at          TIMESTAMPTZ,
  time_spent_seconds    INTEGER,
  score                 NUMERIC(5,2),
  domain_scores         JSONB
);

CREATE INDEX idx_ma_user_id ON public.mock_attempts(user_id, started_at DESC);

-- ── Mock Attempt Answers ─────────────────────────────────────

CREATE TABLE public.mock_attempt_answers (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mock_attempt_id       UUID NOT NULL REFERENCES public.mock_attempts(id) ON DELETE CASCADE,
  question_id           UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option       TEXT,
  is_correct            BOOLEAN,
  is_flagged            BOOLEAN NOT NULL DEFAULT false,
  time_spent_seconds    INTEGER
);

CREATE INDEX idx_maa_attempt ON public.mock_attempt_answers(mock_attempt_id);

-- ── Flashcard Sets ───────────────────────────────────────────

CREATE TABLE public.flashcard_sets (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic                 TEXT NOT NULL,
  input_mode            TEXT CHECK (input_mode IN ('describe', 'paste')),
  generation_mode       TEXT CHECK (generation_mode IN ('manual', 'adaptive')) NOT NULL DEFAULT 'manual',
  weak_topic_tags       TEXT[],
  cards                 JSONB NOT NULL,        -- [{front, back, type, reasoning}]
  model_version         TEXT,
  cache_hit             BOOLEAN NOT NULL DEFAULT false,
  generated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fs_user_id ON public.flashcard_sets(user_id, generated_at DESC);

-- ── Flashcard Review Events ──────────────────────────────────

CREATE TABLE public.flashcard_review_events (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flashcard_set_id      UUID NOT NULL REFERENCES public.flashcard_sets(id) ON DELETE CASCADE,
  cards_reviewed        INTEGER NOT NULL DEFAULT 0,
  completed             BOOLEAN NOT NULL DEFAULT false,
  reviewed_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Recommendations ──────────────────────────────────────────

CREATE TABLE public.recommendations (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type                  recommendation_type NOT NULL,
  title                 TEXT NOT NULL,
  description           TEXT,
  topic_tags            TEXT[],
  source                recommendation_source NOT NULL,
  trigger_event_id      TEXT,
  status                recommendation_status NOT NULL DEFAULT 'pending',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rec_user_id ON public.recommendations(user_id, status, created_at DESC);

-- ── Progress Snapshots ───────────────────────────────────────

CREATE TABLE public.progress_snapshots (
  id                          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_date               DATE NOT NULL,
  total_questions_attempted   INTEGER NOT NULL DEFAULT 0,
  total_correct               INTEGER NOT NULL DEFAULT 0,
  accuracy_pct                NUMERIC(5,2),
  mocks_completed             INTEGER NOT NULL DEFAULT 0,
  flashcard_sets_completed    INTEGER NOT NULL DEFAULT 0,
  streak_days                 INTEGER NOT NULL DEFAULT 0,
  domain_accuracy             JSONB,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, snapshot_date)
);

CREATE INDEX idx_ps_user_date ON public.progress_snapshots(user_id, snapshot_date DESC);

-- ── Readiness Scores ─────────────────────────────────────────

CREATE TABLE public.readiness_scores (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score                 NUMERIC(5,2) NOT NULL,
  confidence_tier       confidence_tier NOT NULL,
  domain_scores         JSONB NOT NULL,
  narrative_improving   TEXT,
  narrative_at_risk     TEXT,
  top_actions           JSONB NOT NULL DEFAULT '[]',
  questions_answered    INTEGER NOT NULL DEFAULT 0,
  domains_covered       INTEGER NOT NULL DEFAULT 0,
  mocks_completed       INTEGER NOT NULL DEFAULT 0,
  computed_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rs_user_id ON public.readiness_scores(user_id, computed_at DESC);

-- ── Analytics Events (server-side relay) ─────────────────────

CREATE TABLE public.analytics_events (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name    TEXT NOT NULL,
  module        TEXT,
  topic         TEXT,
  source        TEXT,
  session_id    TEXT,
  payload       JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ae_user_event ON public.analytics_events(user_id, event_name, created_at DESC);

-- ── AI Ingestion Jobs ────────────────────────────────────────

CREATE TABLE public.ingestion_jobs (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  status                ingestion_job_status NOT NULL DEFAULT 'pending',
  source_files          JSONB NOT NULL DEFAULT '[]',
  questions_generated   INTEGER NOT NULL DEFAULT 0,
  questions_approved    INTEGER NOT NULL DEFAULT 0,
  questions_rejected    INTEGER NOT NULL DEFAULT 0,
  model_version         TEXT,
  created_by            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at          TIMESTAMPTZ
);

-- ── Ingestion Review Queue ───────────────────────────────────

CREATE TABLE public.ingestion_review_queue (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id                  UUID NOT NULL REFERENCES public.ingestion_jobs(id) ON DELETE CASCADE,
  draft_question          JSONB NOT NULL,
  auto_tags               JSONB NOT NULL DEFAULT '{}',
  source_reference        TEXT,
  status                  review_status NOT NULL DEFAULT 'pending',
  reject_reason           TEXT,
  reviewed_by             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at             TIMESTAMPTZ,
  published_question_id   UUID REFERENCES public.questions(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_irq_job_status ON public.ingestion_review_queue(job_id, status);

-- ── Row Level Security ───────────────────────────────────────

ALTER TABLE public.profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_attempts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_attempts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_attempt_answers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_sets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_review_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_snapshots     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readiness_scores       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events       ENABLE ROW LEVEL SECURITY;

-- Users can only see and edit their own data
CREATE POLICY "own_profile"          ON public.profiles               FOR ALL USING (auth.uid() = id);
CREATE POLICY "own_qa"               ON public.question_attempts      FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_ma"               ON public.mock_attempts          FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_maa"              ON public.mock_attempt_answers   FOR ALL USING (
  mock_attempt_id IN (SELECT id FROM public.mock_attempts WHERE user_id = auth.uid())
);
CREATE POLICY "own_fs"               ON public.flashcard_sets         FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_fre"              ON public.flashcard_review_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_rec"              ON public.recommendations        FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_ps"               ON public.progress_snapshots     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_rs"               ON public.readiness_scores       FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_ae"               ON public.analytics_events       FOR ALL USING (auth.uid() = user_id);

-- Published questions are readable by all authenticated users
ALTER TABLE public.questions          ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_published"        ON public.questions              FOR SELECT USING (is_published = true);
CREATE POLICY "admin_all_questions"   ON public.questions              FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Topics and mock templates are readable by authenticated users
ALTER TABLE public.topics             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_templates     ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_topics"           ON public.topics                 FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "read_mock_templates"   ON public.mock_templates         FOR SELECT USING (is_published = true AND auth.uid() IS NOT NULL);

-- Admin-only tables
ALTER TABLE public.ingestion_jobs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_review_queue   ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_ingestion_jobs"  ON public.ingestion_jobs         FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "admin_review_queue"    ON public.ingestion_review_queue FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
