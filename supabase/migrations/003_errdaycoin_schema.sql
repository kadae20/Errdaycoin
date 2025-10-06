-- ErrdayCoin 선물거래 시뮬레이터를 위한 스키마
-- 기존 스키마를 확장하여 새로운 기능들을 추가합니다.
-- 기존 app_user, quiz 관련 테이블들은 유지하면서 새로운 기능을 추가합니다.

-- Enable UUID extension (이미 001_initial_schema.sql에서 생성됨)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles 테이블 (auth.users와 1:1 관계)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    nickname TEXT,
    avatar_url TEXT,
    locale TEXT DEFAULT 'ko',
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User tokens 테이블 (토큰 이코노미)
CREATE TABLE IF NOT EXISTS user_tokens (
    user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    retry_tokens INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Token logs 테이블 (토큰 획득/소모 이력)
CREATE TABLE IF NOT EXISTS token_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    delta INTEGER NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('earn', 'spend')),
    reason TEXT,
    meta JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referral codes 테이블 (각 유저의 추천 코드)
CREATE TABLE IF NOT EXISTS referral_codes (
    user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referrals 테이블 (추천 관계)
CREATE TABLE IF NOT EXISTS referrals (
    id BIGSERIAL PRIMARY KEY,
    referrer_id UUID REFERENCES auth.users,
    referee_id UUID UNIQUE REFERENCES auth.users,
    code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clicks 테이블 (배너 클릭 추적)
CREATE TABLE IF NOT EXISTS clicks (
    click_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users,
    exchange TEXT,
    ref_code TEXT,
    banner_slot TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    fingerprint TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referral rewards 테이블 (추천 보상)
CREATE TABLE IF NOT EXISTS referral_rewards (
    id BIGSERIAL PRIMARY KEY,
    referee_id UUID REFERENCES auth.users,
    month DATE,
    reward_type TEXT,
    amount INTEGER,
    rewarded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(referee_id, month, reward_type)
);

-- Game sessions 테이블 (게임 세션 기록)
CREATE TABLE IF NOT EXISTS game_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users,
    symbol TEXT,
    entry_price NUMERIC,
    leverage INTEGER,
    position_size NUMERIC,
    side TEXT CHECK (side IN ('long', 'short')),
    liquidation_price NUMERIC,
    exit_price NUMERIC,
    pnl NUMERIC,
    roi NUMERIC,
    nextday_uses_consumed INTEGER DEFAULT 0,
    is_liquidated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_profiles_nickname ON profiles(nickname);
CREATE INDEX IF NOT EXISTS idx_token_logs_user_id ON token_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_token_logs_created_at ON token_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_id ON referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_clicks_user_id ON clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_clicks_created_at ON clicks(created_at);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_created_at ON game_sessions(created_at);

-- RLS 정책 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles RLS 정책
CREATE POLICY "Users can read their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- User tokens RLS 정책
CREATE POLICY "Users can read their own tokens" ON user_tokens
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens" ON user_tokens
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens" ON user_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Token logs RLS 정책 (읽기만 허용, 삽입은 서버에서만)
CREATE POLICY "Users can read their own token logs" ON token_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Referral codes RLS 정책
CREATE POLICY "Users can read their own referral code" ON referral_codes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own referral code" ON referral_codes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can read referral codes for validation" ON referral_codes
    FOR SELECT USING (true);

-- Referrals RLS 정책
CREATE POLICY "Users can read referrals they're involved in" ON referrals
    FOR SELECT USING (
        auth.uid() = referrer_id OR auth.uid() = referee_id
    );

CREATE POLICY "Users can insert referrals as referee" ON referrals
    FOR INSERT WITH CHECK (auth.uid() = referee_id);

CREATE POLICY "Admins can read all referrals" ON referrals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all referrals" ON referrals
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Clicks RLS 정책
CREATE POLICY "Users can read their own clicks" ON clicks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert clicks" ON clicks
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can read all clicks" ON clicks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Referral rewards RLS 정책
CREATE POLICY "Users can read their own rewards" ON referral_rewards
    FOR SELECT USING (auth.uid() = referee_id);

CREATE POLICY "Admins can manage all rewards" ON referral_rewards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Game sessions RLS 정책
CREATE POLICY "Users can read their own game sessions" ON game_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game sessions" ON game_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game sessions" ON game_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- 트리거 함수: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Profiles updated_at 트리거
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- User tokens updated_at 트리거
CREATE TRIGGER update_user_tokens_updated_at 
    BEFORE UPDATE ON user_tokens 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 회원가입 시 자동으로 profile, user_tokens, referral_code 생성하는 함수
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    random_code TEXT;
BEGIN
    -- 고유한 추천 코드 생성 (6자리 랜덤 문자열)
    LOOP
        random_code := upper(substring(md5(random()::text) from 1 for 6));
        EXIT WHEN NOT EXISTS (SELECT 1 FROM referral_codes WHERE code = random_code);
    END LOOP;
    
    -- Profile 생성
    INSERT INTO public.profiles (id, nickname, locale)
    VALUES (NEW.id, 'Player-' || substring(NEW.id::text from 1 for 4), 'ko');
    
    -- User tokens 생성 (기본 10개)
    INSERT INTO public.user_tokens (user_id, retry_tokens)
    VALUES (NEW.id, 10);
    
    -- Referral code 생성
    INSERT INTO public.referral_codes (user_id, code)
    VALUES (NEW.id, random_code);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 회원가입 트리거
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- 추천인 보상 지급 함수
CREATE OR REPLACE FUNCTION give_referral_rewards(referrer_uuid UUID, referee_uuid UUID)
RETURNS VOID AS $$
BEGIN
    -- 추천인에게 10 토큰 지급
    UPDATE user_tokens 
    SET retry_tokens = retry_tokens + 10,
        updated_at = NOW()
    WHERE user_id = referrer_uuid;
    
    -- 피추천인에게 10 토큰 지급
    UPDATE user_tokens 
    SET retry_tokens = retry_tokens + 10,
        updated_at = NOW()
    WHERE user_id = referee_uuid;
    
    -- 토큰 로그 기록 (추천인)
    INSERT INTO token_logs (user_id, delta, kind, reason)
    VALUES (referrer_uuid, 10, 'earn', 'referral_reward');
    
    -- 토큰 로그 기록 (피추천인)
    INSERT INTO token_logs (user_id, delta, kind, reason)
    VALUES (referee_uuid, 10, 'earn', 'referral_signup');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 권한 부여
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION give_referral_rewards(UUID, UUID) TO authenticated;
