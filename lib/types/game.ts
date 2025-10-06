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
  retry_tokens: number
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
  side: 'long' | 'short'
): number {
  if (side === 'long') {
    return entry_price * (1 - (1 / leverage))
  } else {
    return entry_price * (1 + (1 / leverage))
  }
}

// PNL 계산 함수
export function calculatePNL(
  entry_price: number,
  exit_price: number,
  position_size: number,
  leverage: number,
  side: 'long' | 'short'
): number {
  if (side === 'long') {
    return (exit_price - entry_price) * position_size * leverage
  } else {
    return (entry_price - exit_price) * position_size * leverage
  }
}

// ROI 계산 함수
export function calculateROI(pnl: number, position_size: number): number {
  return (pnl / position_size) * 100
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
