-- 해외주식 및 암호화폐 데이터 스키마

-- 시장 카테고리 (US, EU, CRYPTO 등)
CREATE TABLE IF NOT EXISTS market_category (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- 'US', 'EU', 'CRYPTO', 'ASIA'
  name_ko TEXT NOT NULL,
  name_en TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 종목 정보 (주식/코인)
CREATE TABLE IF NOT EXISTS asset (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT UNIQUE NOT NULL, -- 'AAPL', 'BTC-USD', 'TSLA'
  name TEXT NOT NULL,
  name_ko TEXT,
  market_category_id BIGINT REFERENCES market_category(id),
  asset_type TEXT CHECK (asset_type IN ('STOCK', 'CRYPTO', 'ETF', 'INDEX')),
  exchange TEXT, -- 'NASDAQ', 'NYSE', 'BINANCE'
  currency TEXT DEFAULT 'USD',
  logo_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 실시간 시세 데이터
CREATE TABLE IF NOT EXISTS market_price (
  id BIGSERIAL PRIMARY KEY,
  asset_id BIGINT REFERENCES asset(id) ON DELETE CASCADE,
  price DECIMAL(20, 8) NOT NULL,
  change_amount DECIMAL(20, 8),
  change_percent DECIMAL(8, 4),
  volume BIGINT,
  market_cap BIGINT,
  high_24h DECIMAL(20, 8),
  low_24h DECIMAL(20, 8),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'api', -- 데이터 소스
  UNIQUE(asset_id, timestamp)
);

-- 일별 OHLCV 데이터
CREATE TABLE IF NOT EXISTS daily_candle (
  id BIGSERIAL PRIMARY KEY,
  asset_id BIGINT REFERENCES asset(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  open_price DECIMAL(20, 8) NOT NULL,
  high_price DECIMAL(20, 8) NOT NULL,
  low_price DECIMAL(20, 8) NOT NULL,
  close_price DECIMAL(20, 8) NOT NULL,
  volume BIGINT DEFAULT 0,
  adj_close DECIMAL(20, 8), -- 수정주가 (주식용)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(asset_id, date)
);

-- 사용자 관심종목
CREATE TABLE IF NOT EXISTS user_watchlist (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES app_user(id) ON DELETE CASCADE,
  asset_id BIGINT REFERENCES asset(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, asset_id)
);

-- 사용자 포트폴리오
CREATE TABLE IF NOT EXISTS user_portfolio (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES app_user(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Portfolio',
  is_default BOOLEAN DEFAULT false,
  total_value DECIMAL(20, 8) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 포트폴리오 보유 종목
CREATE TABLE IF NOT EXISTS portfolio_holding (
  id BIGSERIAL PRIMARY KEY,
  portfolio_id BIGINT REFERENCES user_portfolio(id) ON DELETE CASCADE,
  asset_id BIGINT REFERENCES asset(id) ON DELETE CASCADE,
  quantity DECIMAL(20, 8) NOT NULL,
  avg_buy_price DECIMAL(20, 8) NOT NULL,
  total_invested DECIMAL(20, 8) NOT NULL,
  current_value DECIMAL(20, 8),
  profit_loss DECIMAL(20, 8),
  profit_loss_percent DECIMAL(8, 4),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(portfolio_id, asset_id)
);

-- 거래 내역 (모의투자)
CREATE TABLE IF NOT EXISTS transaction_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES app_user(id) ON DELETE CASCADE,
  portfolio_id BIGINT REFERENCES user_portfolio(id) ON DELETE CASCADE,
  asset_id BIGINT REFERENCES asset(id) ON DELETE CASCADE,
  transaction_type TEXT CHECK (transaction_type IN ('BUY', 'SELL')) NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL,
  price DECIMAL(20, 8) NOT NULL,
  total_amount DECIMAL(20, 8) NOT NULL,
  fee DECIMAL(20, 8) DEFAULT 0,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 커뮤니티 게시글
CREATE TABLE IF NOT EXISTS community_post (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES app_user(id) ON DELETE CASCADE,
  asset_id BIGINT REFERENCES asset(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  post_type TEXT CHECK (post_type IN ('ANALYSIS', 'NEWS', 'DISCUSSION', 'QUESTION')) DEFAULT 'DISCUSSION',
  tags TEXT[], -- 태그 배열
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 게시글 댓글
CREATE TABLE IF NOT EXISTS post_comment (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT REFERENCES community_post(id) ON DELETE CASCADE,
  user_id UUID REFERENCES app_user(id) ON DELETE CASCADE,
  parent_id BIGINT REFERENCES post_comment(id) ON DELETE CASCADE, -- 대댓글용
  content TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 게시글/댓글 좋아요
CREATE TABLE IF NOT EXISTS post_like (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES app_user(id) ON DELETE CASCADE,
  post_id BIGINT REFERENCES community_post(id) ON DELETE CASCADE,
  comment_id BIGINT REFERENCES post_comment(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, comment_id),
  CHECK ((post_id IS NOT NULL AND comment_id IS NULL) OR (post_id IS NULL AND comment_id IS NOT NULL))
);

-- AI 분석 결과
CREATE TABLE IF NOT EXISTS ai_analysis (
  id BIGSERIAL PRIMARY KEY,
  asset_id BIGINT REFERENCES asset(id) ON DELETE CASCADE,
  analysis_type TEXT CHECK (analysis_type IN ('TECHNICAL', 'SENTIMENT', 'PATTERN')) NOT NULL,
  signal TEXT CHECK (signal IN ('BUY', 'SELL', 'HOLD')) NOT NULL,
  confidence DECIMAL(5, 2), -- 신뢰도 0-100
  reasoning TEXT,
  indicators JSONB, -- 기술적 지표 데이터
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_asset_symbol ON asset(symbol);
CREATE INDEX IF NOT EXISTS idx_asset_market_category ON asset(market_category_id);
CREATE INDEX IF NOT EXISTS idx_market_price_asset_timestamp ON market_price(asset_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_daily_candle_asset_date ON daily_candle(asset_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_user_watchlist_user ON user_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_holding_portfolio ON portfolio_holding(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_transaction_history_user ON transaction_history(user_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_post_created_at ON community_post(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_post_asset ON community_post(asset_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_asset ON ai_analysis(asset_id, created_at DESC);

-- 초기 데이터 삽입
INSERT INTO market_category (code, name_ko, name_en) VALUES
('US', '미국', 'United States'),
('EU', '유럽', 'Europe'),
('ASIA', '아시아', 'Asia'),
('CRYPTO', '암호화폐', 'Cryptocurrency')
ON CONFLICT (code) DO NOTHING;

-- 주요 해외 주식 종목
INSERT INTO asset (symbol, name, name_ko, market_category_id, asset_type, exchange, logo_url) VALUES
('AAPL', 'Apple Inc.', '애플', (SELECT id FROM market_category WHERE code = 'US'), 'STOCK', 'NASDAQ', 'https://logo.clearbit.com/apple.com'),
('MSFT', 'Microsoft Corporation', '마이크로소프트', (SELECT id FROM market_category WHERE code = 'US'), 'STOCK', 'NASDAQ', 'https://logo.clearbit.com/microsoft.com'),
('GOOGL', 'Alphabet Inc.', '알파벳', (SELECT id FROM market_category WHERE code = 'US'), 'STOCK', 'NASDAQ', 'https://logo.clearbit.com/google.com'),
('AMZN', 'Amazon.com Inc.', '아마존', (SELECT id FROM market_category WHERE code = 'US'), 'STOCK', 'NASDAQ', 'https://logo.clearbit.com/amazon.com'),
('TSLA', 'Tesla Inc.', '테슬라', (SELECT id FROM market_category WHERE code = 'US'), 'STOCK', 'NASDAQ', 'https://logo.clearbit.com/tesla.com'),
('NVDA', 'NVIDIA Corporation', '엔비디아', (SELECT id FROM market_category WHERE code = 'US'), 'STOCK', 'NASDAQ', 'https://logo.clearbit.com/nvidia.com'),
('META', 'Meta Platforms Inc.', '메타', (SELECT id FROM market_category WHERE code = 'US'), 'STOCK', 'NASDAQ', 'https://logo.clearbit.com/meta.com')
ON CONFLICT (symbol) DO NOTHING;

-- 주요 암호화폐
INSERT INTO asset (symbol, name, name_ko, market_category_id, asset_type, exchange) VALUES
('BTC-USD', 'Bitcoin', '비트코인', (SELECT id FROM market_category WHERE code = 'CRYPTO'), 'CRYPTO', 'BINANCE'),
('ETH-USD', 'Ethereum', '이더리움', (SELECT id FROM market_category WHERE code = 'CRYPTO'), 'CRYPTO', 'BINANCE'),
('BNB-USD', 'Binance Coin', '바이낸스코인', (SELECT id FROM market_category WHERE code = 'CRYPTO'), 'CRYPTO', 'BINANCE'),
('ADA-USD', 'Cardano', '카르다노', (SELECT id FROM market_category WHERE code = 'CRYPTO'), 'CRYPTO', 'BINANCE'),
('SOL-USD', 'Solana', '솔라나', (SELECT id FROM market_category WHERE code = 'CRYPTO'), 'CRYPTO', 'BINANCE')
ON CONFLICT (symbol) DO NOTHING;

-- RLS 정책
ALTER TABLE user_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_holding ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comment ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_like ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 데이터만 접근 가능
CREATE POLICY "Users can manage their own watchlist" ON user_watchlist
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own portfolio" ON user_portfolio
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own holdings" ON portfolio_holding
  FOR ALL USING (auth.uid() = (SELECT user_id FROM user_portfolio WHERE id = portfolio_id));

CREATE POLICY "Users can manage their own transactions" ON transaction_history
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own posts" ON community_post
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can read posts" ON community_post
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own posts" ON community_post
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON community_post
  FOR DELETE USING (auth.uid() = user_id);

-- 공개 읽기 권한
GRANT SELECT ON market_category TO anon, authenticated;
GRANT SELECT ON asset TO anon, authenticated;
GRANT SELECT ON market_price TO anon, authenticated;
GRANT SELECT ON daily_candle TO anon, authenticated;
GRANT SELECT ON ai_analysis TO anon, authenticated;
GRANT SELECT ON community_post TO anon, authenticated;
GRANT SELECT ON post_comment TO anon, authenticated;
