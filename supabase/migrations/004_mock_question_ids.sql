-- ============================================================
-- Mock templates: fixed question sets
-- Each template now owns the exact ordered list of question IDs
-- that every attempt of that template will see.
-- ============================================================

ALTER TABLE public.mock_templates
  ADD COLUMN question_ids UUID[] NOT NULL DEFAULT '{}';

ALTER TABLE public.mock_templates
  ADD COLUMN slug TEXT UNIQUE;

ALTER TABLE public.mock_templates
  ADD COLUMN description TEXT;

-- Attempt answers need an ordinal so the runner can render the
-- grid in the template's order and resume reliably.
ALTER TABLE public.mock_attempt_answers
  ADD COLUMN position INTEGER;

CREATE UNIQUE INDEX uq_maa_attempt_question
  ON public.mock_attempt_answers(mock_attempt_id, question_id);

CREATE INDEX idx_maa_attempt_position
  ON public.mock_attempt_answers(mock_attempt_id, position);

-- Enforce one in-progress attempt per (user, template)
CREATE UNIQUE INDEX uq_ma_one_in_progress
  ON public.mock_attempts(user_id, mock_template_id)
  WHERE status = 'in_progress';
