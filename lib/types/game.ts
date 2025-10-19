// ErrdayCoin 선물거래 시뮬레이터 게임 타입 정의

export interface GameSession {
  id: number
  user_id: string
  symbol: string
  entry_price: number
  leverage: number
  position_size: number
  side: 'long' | 'short'
  liquidation_price: number
  exit_price?: number
  pnl?: number
  roi?: number
  nextday_uses_consumed: number
  is_liquidated: boolean
  created_at: string
  completed_at?: string
}

export interface Position {
  id?: string
  user_id?: string
  session_id?: string
  side: 'long' | 'short'
  entry_price: number
  leverage: number
  position_size: number
  liquidation_price: number
  current_price?: number
  unrealized_pnl?: number
  roi?: number
}

export interface GameState {
  session?: GameSession
  position?: Position
  chart_data: CandleData[]
  current_candle_index: number
  max_candles: number
  nextday_uses_left: number
  retry_tokens: number
  is_position_open: boolean
  is_liquidated: boolean
  balance?: number // 현재 잔액
}

export interface CandleData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface UserTokens {
  user_id: string
  balance: string
  retry_tokens: number
  referral_tokens: number
  referral_code: string
  created_at: string
  updated_at: string
}

export interface TokenLog {
  id: number
  user_id: string
  delta: number
  kind: 'earn' | 'spend'
  reason: string
  meta?: Record<string, any>
  created_at: string
}

export interface ReferralCode {
  user_id: string
  code: string
  created_at: string
}

export interface Referral {
  id: number
  referrer_id: string
  referee_id: string
  code: string
  created_at: string
}

export interface Profile {
  id: string
  nickname?: string
  avatar_url?: string
  locale: string
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
}

// 게임 설정 상수
export const GAME_CONSTANTS = {
  DEFAULT_RETRY_TOKENS: 10,
  DEFAULT_NEXTDAY_USES: 15,
  MAX_LEVERAGE: 100,
  MIN_LEVERAGE: 1,
  BASE_POSITION_SIZE: 100, // USDT
  REFERRAL_REWARD: 10, // tokens
} as const

// 청산가 계산 함수
export function calculateLiquidationPrice(
  entry_price: number,
  leverage: number,
  side: 'long' | 'short',
  balance: number = 1000,
  position_size: number
): number {
  // 간단한 청산가 계산
  // 10배율이면 약 9% 하락 시 청산 (90% 마진 사용)
  const liquidation_percentage = 0.9 / leverage // 90% / 레버리지
  
  if (side === 'long') {
    // 롱 포지션: 청산가 = 진입가 × (1 - 청산퍼센트)
    return entry_price * (1 - liquidation_percentage)
  } else {
    // 숏 포지션: 청산가 = 진입가 × (1 + 청산퍼센트)
    return entry_price * (1 + liquidation_percentage)
  }
}

// PNL 계산 함수 (간단한 시그니처)
export function calculatePNL(
  entry_price: number,
  current_price: number,
  side: 'long' | 'short',
  position_size: number
): number {
  const price_diff = side === 'long' 
    ? current_price - entry_price 
    : entry_price - current_price
  
  // PNL = 가격차이 * 포지션크기 / 진입가 * 포지션크기
  return (price_diff / entry_price) * position_size
}

// ROI 계산 함수 (간단한 시그니처)
export function calculateROI(
  entry_price: number,
  current_price: number,
  side: 'long' | 'short',
  leverage: number
): number {
  const price_diff = side === 'long' 
    ? current_price - entry_price 
    : entry_price - current_price
  
  // ROI = (가격차이 / 진입가) * 레버리지 * 100
  return (price_diff / entry_price) * leverage * 100
}

// 청산 여부 확인 함수
export function isLiquidated(
  current_price: number,
  liquidation_price: number,
  side: 'long' | 'short'
): boolean {
  if (side === 'long') {
    return current_price <= liquidation_price
  } else {
    return current_price >= liquidation_price
  }
}
