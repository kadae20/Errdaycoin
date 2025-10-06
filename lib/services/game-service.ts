// ErrdayCoin 선물거래 게임 서비스

import { createClient } from '@/lib/supabase/client'
import { binanceAPI, type CandleData } from './binance-api'
import { 
  calculateLiquidationPrice, 
  calculatePNL, 
  calculateROI, 
  isLiquidated,
  GAME_CONSTANTS,
  type GameSession,
  type Position,
  type GameState,
  type UserTokens
} from '@/lib/types/game'

export class GameService {
  private supabase = createClient()

  // 새 게임 세션 시작
  async startNewGame(
    userId: string,
    symbol?: string
  ): Promise<{
    session: GameSession
    chartData: CandleData[]
    previewData: CandleData[]
  }> {
    try {
      // 유저 토큰 확인
      const tokens = await this.getUserTokens(userId)
      if (tokens.retry_tokens <= 0) {
        throw new Error('토큰이 부족합니다. 토큰을 충전해주세요.')
      }

      // 랜덤 차트 데이터 가져오기
      const gameChart = await binanceAPI.getRandomGameChart(symbol, 5, 15)
      
      // 게임 세션 생성
      const { data: session, error } = await this.supabase
        .from('game_sessions')
        .insert({
          user_id: userId,
          symbol: gameChart.symbol,
          nextday_uses_consumed: 0
        })
        .select()
        .single()

      if (error) throw error

      return {
        session,
        chartData: gameChart.full_data,
        previewData: gameChart.preview_candles
      }
    } catch (error) {
      console.error('Failed to start new game:', error)
      throw error
    }
  }

  // 포지션 진입
  async enterPosition(
    sessionId: number,
    side: 'long' | 'short',
    leverage: number,
    positionPercentage: number, // 포트폴리오 대비 비중 (%)
    entryPrice: number
  ): Promise<GameSession> {
    try {
      // 레버리지 검증
      if (leverage < GAME_CONSTANTS.MIN_LEVERAGE || leverage > GAME_CONSTANTS.MAX_LEVERAGE) {
        throw new Error(`레버리지는 ${GAME_CONSTANTS.MIN_LEVERAGE}~${GAME_CONSTANTS.MAX_LEVERAGE}배 사이여야 합니다.`)
      }

      // 포지션 크기 계산 (기본 포트폴리오 100 USDT 기준)
      const basePortfolio = 100
      const positionSize = (basePortfolio * positionPercentage) / 100

      // 청산가 계산
      const liquidationPrice = calculateLiquidationPrice(entryPrice, leverage, side)

      // 게임 세션 업데이트
      const { data: session, error } = await this.supabase
        .from('game_sessions')
        .update({
          entry_price: entryPrice,
          leverage: leverage,
          position_size: positionSize,
          side: side,
          liquidation_price: liquidationPrice
        })
        .eq('id', sessionId)
        .select()
        .single()

      if (error) throw error

      return session
    } catch (error) {
      console.error('Failed to enter position:', error)
      throw error
    }
  }

  // 다음 날 공개 (Next Day)
  async revealNextDay(
    sessionId: number,
    currentCandleIndex: number,
    newPrice: number
  ): Promise<{
    session: GameSession
    isLiquidated: boolean
    pnl?: number
    roi?: number
  }> {
    try {
      // 현재 세션 정보 가져오기
      const { data: currentSession, error: fetchError } = await this.supabase
        .from('game_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (fetchError || !currentSession) {
        throw new Error('게임 세션을 찾을 수 없습니다.')
      }

      // 포지션이 없으면 에러
      if (!currentSession.entry_price || !currentSession.side) {
        throw new Error('포지션을 먼저 진입해주세요.')
      }

      // 유저 토큰 확인 및 차감
      const userId = currentSession.user_id!
      const tokens = await this.getUserTokens(userId)
      
      // nextday_uses 체크 (기본 15회)
      const nextdayUsesLeft = GAME_CONSTANTS.DEFAULT_NEXTDAY_USES - currentSession.nextday_uses_consumed
      
      if (nextdayUsesLeft <= 0) {
        // retry_tokens로 충전
        if (tokens.retry_tokens <= 0) {
          throw new Error('Next Day 사용 횟수와 토큰이 모두 부족합니다.')
        }
        
        // retry_token 1개 차감하고 nextday_uses 15회 충전
        await this.consumeRetryToken(userId, 'nextday_refill')
      }

      // 청산 여부 확인
      const liquidated = isLiquidated(
        newPrice,
        currentSession.liquidation_price!,
        currentSession.side as 'long' | 'short'
      )

      let pnl = 0
      let roi = 0

      if (!liquidated) {
        // PNL 계산
        pnl = calculatePNL(
          currentSession.entry_price,
          newPrice,
          currentSession.position_size!,
          currentSession.leverage!,
          currentSession.side as 'long' | 'short'
        )
        
        // ROI 계산
        roi = calculateROI(pnl, currentSession.position_size!)
      } else {
        // 청산 시 100% 손실
        pnl = -currentSession.position_size!
        roi = -100
      }

      // 세션 업데이트
      const { data: updatedSession, error: updateError } = await this.supabase
        .from('game_sessions')
        .update({
          exit_price: newPrice,
          pnl: pnl,
          roi: roi,
          is_liquidated: liquidated,
          nextday_uses_consumed: currentSession.nextday_uses_consumed + 1,
          completed_at: liquidated ? new Date().toISOString() : null
        })
        .eq('id', sessionId)
        .select()
        .single()

      if (updateError) throw updateError

      return {
        session: updatedSession,
        isLiquidated: liquidated,
        pnl,
        roi
      }
    } catch (error) {
      console.error('Failed to reveal next day:', error)
      throw error
    }
  }

  // 포지션 종료
  async closePosition(sessionId: number, exitPrice: number): Promise<GameSession> {
    try {
      const { data: session, error } = await this.supabase
        .from('game_sessions')
        .update({
          exit_price: exitPrice,
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single()

      if (error) throw error

      return session
    } catch (error) {
      console.error('Failed to close position:', error)
      throw error
    }
  }

  // 게임 재시작 (retry_token 소모)
  async restartGame(userId: string): Promise<void> {
    try {
      await this.consumeRetryToken(userId, 'game_restart')
    } catch (error) {
      console.error('Failed to restart game:', error)
      throw error
    }
  }

  // 유저 토큰 정보 가져오기
  async getUserTokens(userId: string): Promise<UserTokens> {
    try {
      const { data, error } = await this.supabase
        .from('user_tokens')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        // 토큰 정보가 없으면 생성
        if (error.code === 'PGRST116') {
          const { data: newTokens, error: createError } = await this.supabase
            .from('user_tokens')
            .insert({
              user_id: userId,
              retry_tokens: GAME_CONSTANTS.DEFAULT_RETRY_TOKENS
            })
            .select()
            .single()
          
          if (createError) throw createError
          return newTokens
        }
        throw error
      }

      return data
    } catch (error) {
      console.error('Failed to get user tokens:', error)
      throw error
    }
  }

  // retry_token 소모
  private async consumeRetryToken(userId: string, reason: string): Promise<void> {
    try {
      const tokens = await this.getUserTokens(userId)
      
      if (tokens.retry_tokens <= 0) {
        throw new Error('토큰이 부족합니다.')
      }

      // 토큰 차감
      const { error: updateError } = await this.supabase
        .from('user_tokens')
        .update({ 
          retry_tokens: tokens.retry_tokens - 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (updateError) throw updateError

      // 로그 기록
      const { error: logError } = await this.supabase
        .from('token_logs')
        .insert({
          user_id: userId,
          delta: -1,
          kind: 'spend',
          reason: reason
        })

      if (logError) throw logError
    } catch (error) {
      console.error('Failed to consume retry token:', error)
      throw error
    }
  }

  // 토큰 지급
  async giveTokens(
    userId: string, 
    amount: number, 
    reason: string,
    meta?: Record<string, any>
  ): Promise<void> {
    try {
      const tokens = await this.getUserTokens(userId)

      // 토큰 추가
      const { error: updateError } = await this.supabase
        .from('user_tokens')
        .update({ 
          retry_tokens: tokens.retry_tokens + amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (updateError) throw updateError

      // 로그 기록
      const { error: logError } = await this.supabase
        .from('token_logs')
        .insert({
          user_id: userId,
          delta: amount,
          kind: 'earn',
          reason: reason,
          meta: meta
        })

      if (logError) throw logError
    } catch (error) {
      console.error('Failed to give tokens:', error)
      throw error
    }
  }

  // 유저 게임 기록 가져오기
  async getUserGameHistory(
    userId: string,
    limit: number = 20
  ): Promise<GameSession[]> {
    try {
      const { data, error } = await this.supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Failed to get user game history:', error)
      throw error
    }
  }

  // 게임 통계
  async getUserGameStats(userId: string): Promise<{
    totalGames: number
    winRate: number
    totalPnl: number
    bestRoi: number
    worstRoi: number
  }> {
    try {
      const { data, error } = await this.supabase
        .from('game_sessions')
        .select('pnl, roi')
        .eq('user_id', userId)
        .not('pnl', 'is', null)

      if (error) throw error

      const sessions = data || []
      const totalGames = sessions.length
      
      if (totalGames === 0) {
        return {
          totalGames: 0,
          winRate: 0,
          totalPnl: 0,
          bestRoi: 0,
          worstRoi: 0
        }
      }

      const wins = sessions.filter(s => (s.pnl || 0) > 0).length
      const winRate = (wins / totalGames) * 100
      const totalPnl = sessions.reduce((sum, s) => sum + (s.pnl || 0), 0)
      const rois = sessions.map(s => s.roi || 0)
      const bestRoi = Math.max(...rois)
      const worstRoi = Math.min(...rois)

      return {
        totalGames,
        winRate,
        totalPnl,
        bestRoi,
        worstRoi
      }
    } catch (error) {
      console.error('Failed to get user game stats:', error)
      throw error
    }
  }
}

export const gameService = new GameService()
