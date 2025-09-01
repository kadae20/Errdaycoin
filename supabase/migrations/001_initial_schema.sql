-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create app_user table
CREATE TABLE IF NOT EXISTS app_user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create quiz_bank table
CREATE TABLE IF NOT EXISTS quiz_bank (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  start_ts TIMESTAMPTZ NOT NULL,
  preview_candles JSONB NOT NULL,
  answer_candles JSONB NOT NULL,
  answer TEXT NOT NULL CHECK (answer IN ('UP', 'DOWN', 'FLAT')),
  difficulty SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create quiz_attempt table
CREATE TABLE IF NOT EXISTS quiz_attempt (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES app_user(id) ON DELETE CASCADE,
  quiz_id BIGINT REFERENCES quiz_bank(id) ON DELETE CASCADE,
  choice TEXT NOT NULL CHECK (choice IN ('UP', 'DOWN', 'FLAT')),
  is_correct BOOLEAN,
  score INTEGER DEFAULT 0,
  took_ms INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS ratelimit_hits (
  id BIGSERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  key TEXT NOT NULL,
  ts TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ip, key)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quiz_bank_difficulty ON quiz_bank(difficulty);
CREATE INDEX IF NOT EXISTS idx_quiz_bank_symbol ON quiz_bank(symbol);
CREATE INDEX IF NOT EXISTS idx_quiz_attempt_user_id ON quiz_attempt(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempt_created_at ON quiz_attempt(created_at);
CREATE INDEX IF NOT EXISTS idx_ratelimit_hits_ip_key ON ratelimit_hits(ip, key);
CREATE INDEX IF NOT EXISTS idx_ratelimit_hits_ts ON ratelimit_hits(ts);

-- Create weekly leaderboard view
CREATE OR REPLACE VIEW weekly_leaderboard AS
SELECT 
  ROW_NUMBER() OVER (ORDER BY SUM(qa.score) DESC) as rank,
  COALESCE(au.handle, 'Player-' || SUBSTRING(au.id::TEXT, 1, 4)) as handle_or_anon,
  SUM(qa.score) as score_sum,
  ROUND(AVG(CASE WHEN qa.is_correct THEN 1.0 ELSE 0.0 END) * 100, 1) as correct_rate,
  COUNT(qa.id) as attempts,
  au.id as user_id
FROM quiz_attempt qa
LEFT JOIN app_user au ON qa.user_id = au.id
WHERE qa.created_at >= DATE_TRUNC('week', NOW())
GROUP BY au.id, au.handle
HAVING COUNT(qa.id) >= 1
ORDER BY score_sum DESC
LIMIT 100;

-- Enable Row Level Security
ALTER TABLE app_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempt ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read their own data" ON app_user
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own handle" ON app_user
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own data" ON app_user
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read their own attempts" ON quiz_attempt
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attempts" ON quiz_attempt
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public read access for quiz_bank and leaderboard data
CREATE POLICY "Anyone can read quiz bank" ON quiz_bank
  FOR SELECT USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON quiz_bank TO anon, authenticated;
GRANT SELECT ON weekly_leaderboard TO anon, authenticated;
GRANT ALL ON app_user TO authenticated;
GRANT ALL ON quiz_attempt TO authenticated;
GRANT ALL ON ratelimit_hits TO anon, authenticated;
