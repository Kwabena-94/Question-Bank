-- ============================================================
-- user_insights: durable per-user AI/heuristic insight cache.
-- v1 populated by rule-based recommender; v2 swap to LLM-backed
-- background job without changing the read path or API shape.
-- ============================================================

CREATE TABLE public.user_insights (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL,
  payload      JSONB NOT NULL,
  computed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, kind)
);

CREATE INDEX idx_ui_user_kind ON public.user_insights(user_id, kind);

ALTER TABLE public.user_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_ui" ON public.user_insights FOR ALL USING (auth.uid() = user_id);
