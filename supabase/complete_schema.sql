-- =============================================
-- ErrdayCoin Complete Database Schema
-- =============================================
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- 0. 기존 테이블 삭제 (있다면)
-- =============================================
DROP TABLE IF EXISTS referral_rewards CASCADE;
DROP TABLE IF EXISTS referral_relationships CASCADE;
DROP TABLE IF EXISTS user_referral_codes CASCADE;
DROP TABLE IF EXISTS token_logs CASCADE;
DROP TABLE IF EXISTS positions CASCADE;
DROP TABLE IF EXISTS game_sessions CASCADE;
DROP TABLE IF EXISTS user_tokens CASCADE;

-- 1. 기본 테이블들
-- =============================================

-- 사용자 토큰 테이블
CREATE TABLE user_tokens (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance VARCHAR(20) NOT NULL DEFAULT '1000.00',
  retry_tokens INTEGER NOT NULL DEFAULT 15,
  referral_tokens INTEGER NOT NULL DEFAULT 0,
  referral_code VARCHAR(8) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 게임 세션 테이블
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 포지션 테이블
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  side VARCHAR(10) NOT NULL CHECK (side IN ('long', 'short')),
  leverage INTEGER NOT NULL,
  position_size DECIMAL(20,8) NOT NULL,
  entry_price DECIMAL(20,8) NOT NULL,
  liquidation_price DECIMAL(20,8) NOT NULL,
  current_price DECIMAL(20,8) NOT NULL,
  unrealized_pnl DECIMAL(20,8) NOT NULL DEFAULT 0,
  roi DECIMAL(10,4) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 토큰 로그 테이블
CREATE TABLE token_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  reason VARCHAR(50) NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 추천 시스템 테이블들
-- =============================================

-- 사용자 추천코드 테이블
CREATE TABLE user_referral_codes (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code VARCHAR(8) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 추천 관계 테이블
CREATE TABLE referral_relationships (
  id BIGSERIAL PRIMARY KEY,
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code VARCHAR(8) REFERENCES user_referral_codes(referral_code) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 추천 보상 테이블
CREATE TABLE referral_rewards (
  id BIGSERIAL PRIMARY KEY,
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referrer_tokens INTEGER NOT NULL,
  referee_tokens INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS (Row Level Security) 정책
-- =============================================

-- user_tokens 테이블 RLS
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tokens" ON user_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own tokens" ON user_tokens FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tokens" ON user_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role can do everything" ON user_tokens FOR ALL USING (auth.role() = 'service_role');

-- game_sessions 테이블 RLS
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sessions" ON game_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON game_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON game_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role can do everything" ON game_sessions FOR ALL USING (auth.role() = 'service_role');

-- positions 테이블 RLS
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own positions" ON positions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own positions" ON positions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own positions" ON positions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role can do everything" ON positions FOR ALL USING (auth.role() = 'service_role');

-- token_logs 테이블 RLS
ALTER TABLE token_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own token logs" ON token_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own token logs" ON token_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role can do everything" ON token_logs FOR ALL USING (auth.role() = 'service_role');

-- user_referral_codes 테이블 RLS
ALTER TABLE user_referral_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own referral code" ON user_referral_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own referral code" ON user_referral_codes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role can do everything" ON user_referral_codes FOR ALL USING (auth.role() = 'service_role');

-- referral_relationships 테이블 RLS
ALTER TABLE referral_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own referral relationships" ON referral_relationships FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);
CREATE POLICY "Authenticated users can insert referral relationships" ON referral_relationships FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Service role can do everything" ON referral_relationships FOR ALL USING (auth.role() = 'service_role');

-- referral_rewards 테이블 RLS
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own referral rewards" ON referral_rewards FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);
CREATE POLICY "Authenticated users can insert referral rewards" ON referral_rewards FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Service role can do everything" ON referral_rewards FOR ALL USING (auth.role() = 'service_role');

-- 4. 함수들
-- =============================================

-- 8자리 랜덤 추천코드 생성 함수
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS VARCHAR(8) AS $$
DECLARE
  chars VARCHAR(36) := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result VARCHAR(8) := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 중복되지 않는 추천코드 생성 함수
CREATE OR REPLACE FUNCTION create_unique_referral_code(user_id UUID)
RETURNS VARCHAR(8) AS $$
DECLARE
  new_code VARCHAR(8);
  attempts INTEGER := 0;
  max_attempts INTEGER := 10;
BEGIN
  LOOP
    new_code := generate_referral_code();
    SELECT COUNT(*) INTO attempts FROM user_referral_codes WHERE referral_code = new_code;
    IF attempts = 0 THEN
      INSERT INTO user_referral_codes (user_id, referral_code) VALUES (user_id, new_code);
      RETURN new_code;
    END IF;
    attempts := attempts + 1;
    IF attempts > max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique referral code after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 추천 보상 처리 함수
CREATE OR REPLACE FUNCTION process_referral_reward(
  p_referrer_id UUID,
  p_referee_id UUID,
  p_referral_code VARCHAR(8)
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  referrer_current_tokens INTEGER;
  referee_current_tokens INTEGER;
  reward_amount INTEGER := 3; -- +3 tokens for each referral
  default_daily_tokens INTEGER := 15;
BEGIN
  -- Insert into referral_relationships
  INSERT INTO referral_relationships (referrer_id, referee_id, referral_code)
  VALUES (p_referrer_id, p_referee_id, p_referral_code);

  -- Update referrer's tokens
  UPDATE user_tokens
  SET
    retry_tokens = retry_tokens + reward_amount,
    referral_tokens = referral_tokens + reward_amount,
    updated_at = NOW()
  WHERE user_id = p_referrer_id
  RETURNING retry_tokens INTO referrer_current_tokens;

  -- Update referee's tokens
  UPDATE user_tokens
  SET
    retry_tokens = retry_tokens + reward_amount,
    updated_at = NOW()
  WHERE user_id = p_referee_id
  RETURNING retry_tokens INTO referee_current_tokens;

  -- Log the reward
  INSERT INTO referral_rewards (referrer_id, referee_id, referrer_tokens, referee_tokens)
  VALUES (p_referrer_id, p_referee_id, reward_amount, reward_amount);

  -- Log token changes for referrer
  INSERT INTO token_logs (user_id, delta, reason, meta)
  VALUES (p_referrer_id, reward_amount, 'referral_reward', JSONB_BUILD_OBJECT('referee_id', p_referee_id, 'code', p_referral_code));

  -- Log token changes for referee
  INSERT INTO token_logs (user_id, delta, reason, meta)
  VALUES (p_referee_id, reward_amount, 'referral_signup', JSONB_BUILD_OBJECT('referrer_id', p_referrer_id, 'code', p_referral_code));

END;
$$;

-- 5. 인덱스 생성
-- =============================================

-- 성능 최적화를 위한 인덱스들
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_user_id ON positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_session_id ON positions(session_id);
CREATE INDEX IF NOT EXISTS idx_token_logs_user_id ON token_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_token_logs_created_at ON token_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_referral_codes_code ON user_referral_codes(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_relationships_referrer ON referral_relationships(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_relationships_referee ON referral_relationships(referee_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer ON referral_rewards(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referee ON referral_rewards(referee_id);

-- 6. 완료 메시지
-- =============================================
SELECT 'ErrdayCoin database schema has been successfully created!' as message;
