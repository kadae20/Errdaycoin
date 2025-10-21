// ErrdayCoin 추천인 시스템 서비스

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/types/database'
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
  private getSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
    
    return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  }

  // 유저의 추천 코드 가져오기
  async getUserReferralCode(userId: string): Promise<string> {
    try {
      const supabase = this.getSupabase()
      const { data, error } = await supabase
        .from('user_referral_codes')
        .select('referral_code')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // 추천 코드가 없으면 생성
          return await this.generateReferralCode(userId)
        }
        throw error
      }

      return (data as any).referral_code
    } catch (error) {
      console.error('Failed to get user referral code:', error)
      throw error
    }
  }

  // 새로운 추천 코드 생성
  private async generateReferralCode(userId: string): Promise<string> {
    try {
      const supabase = this.getSupabase()
      let code: string
      let attempts = 0
      const maxAttempts = 10

      do {
        code = this.generateUniqueReferralCode(userId)
        attempts++

        // 중복 체크
        const { data: existing } = await supabase
          .from('user_referral_codes')
          .select('referral_code')
          .eq('referral_code', code)
          .single()

        if (!existing) {
          // 중복되지 않은 코드 발견
          break
        }

        if (attempts >= maxAttempts) {
          // 해시 기반 코드가 중복되면 랜덤으로 생성
          code = this.generateRandomCode()
          break
        }
      } while (true)

      // 코드 저장
      const { error } = await supabase
        .from('user_referral_codes')
        .insert({
          user_id: userId,
          referral_code: code
        } as any)

      if (error) throw error

      return code
    } catch (error) {
      console.error('Failed to generate referral code:', error)
      throw error
    }
  }

  // 추천코드 유효성 검증
  async validateReferralCode(referralCode: string): Promise<{ valid: boolean; referrerId?: string }> {
    try {
      const supabase = this.getSupabase()
      const { data, error } = await supabase
        .from('user_referral_codes')
        .select('user_id')
        .eq('referral_code', referralCode.toUpperCase())
        .single()

      if (error || !data) {
        return { valid: false }
      }

      return { valid: true, referrerId: (data as any).user_id }
    } catch (error) {
      console.error('Failed to validate referral code:', error)
      return { valid: false }
    }
  }

  // 추천코드 생성 (외부에서 호출용)
  async createReferralCode(userId: string, code: string): Promise<void> {
    try {
      const supabase = this.getSupabase()
      const { error } = await supabase
        .from('user_referral_codes')
        .insert({
          user_id: userId,
          referral_code: code
        } as any)

      if (error) throw error
    } catch (error) {
      console.error('Failed to create referral code:', error)
      throw error
    }
  }

  // 사용자 ID 기반 고유 코드 생성 (8자리 영숫자)
  private generateRandomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // 사용자 ID 기반 고유 코드 생성 (8자리 영숫자)
  private generateUniqueReferralCode(userId?: string): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    
    if (userId) {
      // 사용자 ID를 기반으로 일관된 코드 생성 (더 안정적인 해시)
      const hash1 = this.simpleHash(userId)
      const hash2 = this.simpleHash(userId + 'errdaycoin')
      
      for (let i = 0; i < 8; i++) {
        const combinedHash = (hash1 + hash2 + i * 7) % chars.length
        result += chars.charAt(Math.abs(combinedHash))
      }
    } else {
      // 사용자 ID가 없으면 랜덤 생성
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
    }
    
    return result
  }

  // 간단한 해시 함수
  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 32bit 정수로 변환
    }
    return Math.abs(hash)
  }

  // 추천 코드로 회원가입 처리
  async handleReferralSignup(refereeId: string, referralCode: string): Promise<void> {
    try {
      const supabase = this.getSupabase()
      // 추천 코드 유효성 검사
      const { data: referralData, error: validateError } = await supabase
        .from('user_referral_codes')
        .select('user_id')
        .eq('referral_code', referralCode.toUpperCase())
        .single()

      if (validateError || !referralData) {
        throw new Error('Invalid referral code')
      }

      const referrerId = (referralData as any).user_id

      // 자기 자신을 추천할 수 없음
      if (referrerId === refereeId) {
        throw new Error('Cannot refer yourself')
      }

      // 이미 추천받은 적이 있는지 확인
      const { data: existingReferral } = await supabase
        .from('referral_relationships')
        .select('id')
        .eq('referee_id', refereeId)
        .single()

      if (existingReferral) {
        throw new Error('User has already been referred')
      }

      // 게임 서비스를 통한 추천인 보상 처리 (토큰 + 한도 증가)
      const { gameService } = await import('./game-service')
      await gameService.processReferralReward(referrerId, refereeId, referralCode.toUpperCase())

    } catch (error) {
      console.error('Failed to handle referral signup:', error)
      throw error
    }
  }

  // 추천인 통계 조회
  async getReferralStats(userId: string): Promise<ReferralStats> {
    try {
      const supabase = this.getSupabase()
      const { data: referralStats, error } = await supabase
        .from('referral_rewards')
        .select(`
          referrer_tokens,
          referee_tokens,
          created_at
        `)
        .eq('referrer_id', userId)

      if (error) throw error

      const stats = (referralStats || []) as any[]
      const totalReferrals = stats.length
      const totalRewards = stats.reduce((sum, reward) => sum + reward.referrer_tokens, 0)
      
      // 이번 달 추천 수
      const thisMonth = new Date()
      thisMonth.setDate(1)
      thisMonth.setHours(0, 0, 0, 0)
      
      const thisMonthReferrals = stats.filter(
        reward => new Date(reward.created_at) >= thisMonth
      ).length
      
      const thisMonthRewards = stats.filter(
        reward => new Date(reward.created_at) >= thisMonth
      ).reduce((sum, reward) => sum + reward.referrer_tokens, 0)

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

  // 추천인 링크 생성
  generateReferralLink(referralCode: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://errdaycoin.com'
    return `${baseUrl}/?ref=${referralCode}`
  }

  // URL에서 추천코드 추출
  extractReferralCodeFromUrl(url: string): string | null {
    const urlObj = new URL(url)
    return urlObj.searchParams.get('ref')
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
      const supabase = this.getSupabase()
      const { data, error } = await supabase
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

      return (data as any[] || []).map((item: any) => ({
        id: item.id,
        referee_id: item.referee_id,
        code: item.code,
        created_at: item.created_at,
        nickname: item.profiles?.nickname
      }))

    } catch (error) {
      console.error('Failed to get referred users:', error)
      throw error
    }
  }


  // 월별 추천 보상 지급 (관리자용)
  async processMonthlyRewards(year: number, month: number): Promise<void> {
    try {
      const supabase = this.getSupabase()
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 1)

      // 해당 월의 추천 데이터 가져오기
      const { data: referrals, error } = await supabase
        .from('referrals')
        .select('referrer_id')
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString())

      if (error) throw error

      // 추천인별 카운트
      const referrerCounts: Record<string, number> = {}
      const refs = (referrals || []) as any[]
      refs.forEach(ref => {
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
          await supabase
            .from('referral_rewards')
            .upsert({
              referee_id: referrerId,
              month: `${year}-${month.toString().padStart(2, '0')}-01`,
              reward_type: 'monthly_bonus',
              amount: bonusReward,
              rewarded: true
            } as any)
        }
      }

    } catch (error) {
      console.error('Failed to process monthly rewards:', error)
      throw error
    }
  }
}

// Lazy singleton pattern to avoid build-time initialization
let _referralServiceInstance: ReferralService | null = null

export const getReferralService = () => {
  if (!_referralServiceInstance) {
    _referralServiceInstance = new ReferralService()
  }
  return _referralServiceInstance
}

// Backward compatibility
export const referralService = {
  getUserReferralCode: (userId: string) => getReferralService().getUserReferralCode(userId),
  validateReferralCode: (code: string) => getReferralService().validateReferralCode(code),
  createReferralCode: (userId: string, code: string) => getReferralService().createReferralCode(userId, code),
  handleReferralSignup: (refereeId: string, code: string) => getReferralService().handleReferralSignup(refereeId, code),
  getReferralStats: (userId: string) => getReferralService().getReferralStats(userId),
  getReferredUsers: (userId: string, limit?: number) => getReferralService().getReferredUsers(userId, limit),
  generateReferralLink: (code: string) => getReferralService().generateReferralLink(code),
  extractReferralCodeFromUrl: (url: string) => getReferralService().extractReferralCodeFromUrl(url),
  processMonthlyRewards: (year: number, month: number) => getReferralService().processMonthlyRewards(year, month)
}
