-- PR 5: learner-configurable daily flashcard review cap.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS daily_review_cap INT NOT NULL DEFAULT 100
  CHECK (daily_review_cap BETWEEN 10 AND 300);
