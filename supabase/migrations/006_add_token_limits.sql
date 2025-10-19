-- 토큰 한도 관리 컬럼 추가
-- =============================================

-- user_tokens 테이블에 한도 관련 컬럼 추가
ALTER TABLE user_tokens 
ADD COLUMN IF NOT EXISTS daily_limit INTEGER NOT NULL DEFAULT 15,
ADD COLUMN IF NOT EXISTS referral_limit_bonus INTEGER NOT NULL DEFAULT 0;

-- 추천 보상 처리 함수 업데이트 (한도도 증가)
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
  limit_bonus INTEGER := 3; -- +3 limit increase for each referral
  default_daily_tokens INTEGER := 15;
BEGIN
  -- Insert into referral_relationships
  INSERT INTO referral_relationships (referrer_id, referee_id, referral_code)
  VALUES (p_referrer_id, p_referee_id, p_referral_code);

  -- Update referrer's tokens and limits
  UPDATE user_tokens
  SET
    retry_tokens = retry_tokens + reward_amount,
    referral_tokens = referral_tokens + reward_amount,
    referral_limit_bonus = referral_limit_bonus + limit_bonus,
    daily_limit = daily_limit + limit_bonus,
    updated_at = NOW()
  WHERE user_id = p_referrer_id
  RETURNING retry_tokens INTO referrer_current_tokens;

  -- Update referee's tokens and limits
  UPDATE user_tokens
  SET
    retry_tokens = retry_tokens + reward_amount,
    referral_limit_bonus = referral_limit_bonus + limit_bonus,
    daily_limit = daily_limit + limit_bonus,
    updated_at = NOW()
  WHERE user_id = p_referee_id
  RETURNING retry_tokens INTO referee_current_tokens;

  -- Log the reward
  INSERT INTO referral_rewards (referrer_id, referee_id, referrer_tokens, referee_tokens)
  VALUES (p_referrer_id, p_referee_id, reward_amount, reward_amount);

  -- Log token changes for referrer
  INSERT INTO token_logs (user_id, delta, reason, meta)
  VALUES (p_referrer_id, reward_amount, 'referral_reward', JSONB_BUILD_OBJECT('referee_id', p_referee_id, 'code', p_referral_code, 'limit_bonus', limit_bonus));

  -- Log token changes for referee
  INSERT INTO token_logs (user_id, delta, reason, meta)
  VALUES (p_referee_id, reward_amount, 'referral_signup', JSONB_BUILD_OBJECT('referrer_id', p_referrer_id, 'code', p_referral_code, 'limit_bonus', limit_bonus));

END;
$$;

-- 기존 사용자들의 daily_limit을 15로 설정
UPDATE user_tokens 
SET daily_limit = 15 
WHERE daily_limit IS NULL OR daily_limit = 0;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_user_tokens_daily_limit ON user_tokens(daily_limit);
CREATE INDEX IF NOT EXISTS idx_user_tokens_referral_limit_bonus ON user_tokens(referral_limit_bonus);
