-- AI Usage Logs Table
-- Tracks all AI model calls for budget monitoring and analysis

CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  task_type TEXT NOT NULL,
  model TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('flash', 'pro', 'image')),
  input_tokens INT NOT NULL DEFAULT 0,
  output_tokens INT NOT NULL DEFAULT 0,
  estimated_cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0,
  duration_ms INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient querying
CREATE INDEX idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_logs_created_at ON ai_usage_logs(created_at DESC);
CREATE INDEX idx_ai_usage_logs_task_type ON ai_usage_logs(task_type);
CREATE INDEX idx_ai_usage_logs_tier ON ai_usage_logs(tier);
CREATE INDEX idx_ai_usage_logs_user_created ON ai_usage_logs(user_id, created_at DESC);

-- RLS policies
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read all logs
CREATE POLICY "Admins can view all AI usage logs"
  ON ai_usage_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can view their own logs
CREATE POLICY "Users can view their own AI usage logs"
  ON ai_usage_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Service role can insert logs
CREATE POLICY "Service can insert AI usage logs"
  ON ai_usage_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

COMMENT ON TABLE ai_usage_logs IS 'Tracks AI model usage for budget monitoring';
COMMENT ON COLUMN ai_usage_logs.task_type IS 'Type of AI task (matches model-router TaskType)';
COMMENT ON COLUMN ai_usage_logs.tier IS 'Model tier: flash (cheap/fast), pro (expensive/smart), image (image generation)';
COMMENT ON COLUMN ai_usage_logs.estimated_cost_usd IS 'Estimated cost based on token counts and current pricing';
