-- ============================================================
-- Replace partial unique index on questions.source_reference
-- with a plain unique index so ON CONFLICT can match it.
-- (Postgres treats NULLs as distinct by default, so multiple
-- NULL source_references remain allowed.)
-- ============================================================

DROP INDEX IF EXISTS public.uq_questions_source_reference;

CREATE UNIQUE INDEX uq_questions_source_reference
  ON public.questions(source_reference);
