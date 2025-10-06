// ErrdayCoin 추천인 시스템 서비스

import { createClient } from '@/lib/supabase/client'
import { gameService } from './game-service'
import { GAME_CONSTANTS } from '@/lib/types/game'

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

export interface ReferralStats {
  totalReferrals: number
  totalRewards: number
  thisMonthReferrals: number
  thisMonthRewards: number
}

export class ReferralService {
  private supabase = createClient()

  // 유저의 추천 코드 가져오기
  async getUserReferralCode(userId: string): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('referral_codes')
        .select('code')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // 추천 코드가 없으면 생성
          return await this.generateReferralCode(userId)
        }
        throw error
      }

      return data.code
    } catch (error) {
      console.error('Failed to get user referral code:', error)
      throw error
    }
  }

  // 새로운 추천 코드 생성
  private async generateReferralCode(userId: string): Promise<string> {
    try {
      let code: string
      let attempts = 0
      const maxAttempts = 10

      do {
        code = this.generateRandomCode()
        attempts++

        // 중복 체크
        const { data: existing } = await this.supabase
          .from('referral_codes')
          .select('code')
          .eq('code', code)
          .single()

        if (!existing) {
          // 중복되지 않은 코드 발견
          break
        }

        if (attempts >= maxAttempts) {
          throw new Error('Failed to generate unique referral code')
        }
      } while (true)

      // 코드 저장
      const { error } = await this.supabase
        .from('referral_codes')
        .insert({
          user_id: userId,
          code: code
        })

      if (error) throw error

      return code
    } catch (error) {
      console.error('Failed to generate referral code:', error)
      throw error
    }
  }

  // 랜덤 코드 생성 (6자리 영숫자)
  private generateRandomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // 추천 코드로 회원가입 처리
  async handleReferralSignup(refereeId: string, referralCode: string): Promise<void> {
    try {
      // 추천 코드 유효성 검사
      const { data: referralCodeData, error: codeError } = await this.supabase
        .from('referral_codes')
        .select('user_id')
        .eq('code', referralCode.toUpperCase())
        .single()

      if (codeError || !referralCodeData) {
        throw new Error('유효하지 않은 추천 코드입니다.')
      }

      const referrerId = referralCodeData.user_id

      // 자기 자신을 추천할 수 없음
      if (referrerId === refereeId) {
        throw new Error('자기 자신의 추천 코드는 사용할 수 없습니다.')
      }

      // 이미 추천받은 유저인지 확인
      const { data: existingReferral } = await this.supabase
        .from('referrals')
        .select('id')
        .eq('referee_id', refereeId)
        .single()

      if (existingReferral) {
        throw new Error('이미 추천을 받으신 계정입니다.')
      }

      // 추천 관계 생성
      const { error: referralError } = await this.supabase
        .from('referrals')
        .insert({
          referrer_id: referrerId,
          referee_id: refereeId,
          code: referralCode.toUpperCase()
        })

      if (referralError) throw referralError

      // 보상 지급 (추천인과 피추천인 모두)
      await this.giveReferralRewards(referrerId, refereeId)

    } catch (error) {
      console.error('Failed to handle referral signup:', error)
      throw error
    }
  }

  // 추천 보상 지급
  private async giveReferralRewards(referrerId: string, refereeId: string): Promise<void> {
    try {
      // 추천인에게 보상
      await gameService.giveTokens(
        referrerId,
        GAME_CONSTANTS.REFERRAL_REWARD,
        'referral_reward',
        { referee_id: refereeId }
      )

      // 피추천인에게 보상
      await gameService.giveTokens(
        refereeId,
        GAME_CONSTANTS.REFERRAL_REWARD,
        'referral_signup',
        { referrer_id: referrerId }
      )

    } catch (error) {
      console.error('Failed to give referral rewards:', error)
      throw error
    }
  }

  // 유저의 추천 통계 가져오기
  async getReferralStats(userId: string): Promise<ReferralStats> {
    try {
      // 전체 추천 수
      const { data: allReferrals, error: allError } = await this.supabase
        .from('referrals')
        .select('id, created_at')
        .eq('referrer_id', userId)

      if (allError) throw allError

      const totalReferrals = allReferrals?.length || 0

      // 이번 달 추천 수
      const thisMonth = new Date()
      thisMonth.setDate(1)
      thisMonth.setHours(0, 0, 0, 0)

      const thisMonthReferrals = allReferrals?.filter(r => 
        new Date(r.created_at) >= thisMonth
      ).length || 0

      // 토큰 로그에서 추천 보상 계산
      const { data: rewardLogs, error: rewardError } = await this.supabase
        .from('token_logs')
        .select('delta, created_at')
        .eq('user_id', userId)
        .eq('reason', 'referral_reward')

      if (rewardError) throw rewardError

      const totalRewards = rewardLogs?.reduce((sum, log) => sum + log.delta, 0) || 0
      const thisMonthRewards = rewardLogs?.filter(log =>
        new Date(log.created_at) >= thisMonth
      ).reduce((sum, log) => sum + log.delta, 0) || 0

      return {
        totalReferrals,
        totalRewards,
        thisMonthReferrals,
        thisMonthRewards
      }

    } catch (error) {
      console.error('Failed to get referral stats:', error)
      throw error
    }
  }

  // 추천한 유저 목록 가져오기
  async getReferredUsers(userId: string, limit: number = 20): Promise<Array<{
    id: number
    referee_id: string
    code: string
    created_at: string
    nickname?: string
  }>> {
    try {
      const { data, error } = await this.supabase
        .from('referrals')
        .select(`
          id,
          referee_id,
          code,
          created_at,
          profiles!referrals_referee_id_fkey(nickname)
        `)
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data?.map(item => ({
        id: item.id,
        referee_id: item.referee_id,
        code: item.code,
        created_at: item.created_at,
        nickname: (item.profiles as any)?.nickname
      })) || []

    } catch (error) {
      console.error('Failed to get referred users:', error)
      throw error
    }
  }

  // 추천 링크 생성
  generateReferralLink(code: string, baseUrl: string = ''): string {
    const url = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
    return `${url}/?ref=${code}`
  }

  // 추천 코드 유효성 검사
  async validateReferralCode(code: string): Promise<{
    isValid: boolean
    referrerId?: string
    error?: string
  }> {
    try {
      if (!code || code.length !== 6) {
        return { isValid: false, error: '추천 코드는 6자리여야 합니다.' }
      }

      const { data, error } = await this.supabase
        .from('referral_codes')
        .select('user_id')
        .eq('code', code.toUpperCase())
        .single()

      if (error || !data) {
        return { isValid: false, error: '존재하지 않는 추천 코드입니다.' }
      }

      return { isValid: true, referrerId: data.user_id }

    } catch (error) {
      console.error('Failed to validate referral code:', error)
      return { isValid: false, error: '추천 코드 확인 중 오류가 발생했습니다.' }
    }
  }

  // 월별 추천 보상 지급 (관리자용)
  async processMonthlyRewards(year: number, month: number): Promise<void> {
    try {
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 1)

      // 해당 월의 추천 데이터 가져오기
      const { data: referrals, error } = await this.supabase
        .from('referrals')
        .select('referrer_id')
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString())

      if (error) throw error

      // 추천인별 카운트
      const referrerCounts: Record<string, number> = {}
      referrals?.forEach(ref => {
        referrerCounts[ref.referrer_id] = (referrerCounts[ref.referrer_id] || 0) + 1
      })

      // 보상 지급 로직 (예: 5명 이상 추천 시 추가 보상)
      for (const [referrerId, count] of Object.entries(referrerCounts)) {
        if (count >= 5) {
          const bonusReward = Math.floor(count / 5) * 50 // 5명당 50 토큰 보너스
          
          await gameService.giveTokens(
            referrerId,
            bonusReward,
            'monthly_referral_bonus',
            { year, month, referral_count: count }
          )

          // 보상 기록
          await this.supabase
            .from('referral_rewards')
            .upsert({
              referee_id: referrerId,
              month: `${year}-${month.toString().padStart(2, '0')}-01`,
              reward_type: 'monthly_bonus',
              amount: bonusReward,
              rewarded: true
            })
        }
      }

    } catch (error) {
      console.error('Failed to process monthly rewards:', error)
      throw error
    }
  }
}

export const referralService = new ReferralService()
