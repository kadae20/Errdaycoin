// 일일 리셋 서비스 - 미국 자정 12시 기준

import { createClient } from '@/lib/supabase/server'

export class DailyResetService {
  private supabase = createClient()

  // 미국 시간대 확인 및 리셋 필요 여부 판단
  async checkAndResetDailyTokens(): Promise<void> {
    try {
      const now = new Date()
      const usTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}))
      
      // 자정 12시인지 확인 (0시 0분)
      const isMidnight = usTime.getHours() === 0 && usTime.getMinutes() === 0
      
      if (!isMidnight) {
        console.log('🕐 Not midnight in US time, skipping reset')
        return
      }

      console.log('🔄 Starting daily reset at US midnight...')
      
      // 모든 사용자의 토큰을 기본 한도로 리셋
      await this.resetAllUserTokens()
      
      console.log('✅ Daily reset completed')
    } catch (error) {
      console.error('❌ Failed to check and reset daily tokens:', error)
      throw error
    }
  }

  // 모든 사용자 토큰 리셋 (추천 보상 유지)
  private async resetAllUserTokens(): Promise<void> {
    try {
      // 모든 사용자에 대해 개별적으로 리셋 (추천 보상 포함)
      const { data: allUsers, error: fetchError } = await this.supabase
        .from('user_tokens')
        .select('user_id')
        .neq('user_id', 'guest') // 게스트 제외

      if (fetchError) throw fetchError

      // 각 사용자별로 추천 보상을 포함한 토큰 수 계산하여 리셋
      for (const user of allUsers || []) {
        await this.resetUserTokens(user.user_id)
      }

      console.log(`🔄 Reset tokens for ${allUsers?.length || 0} users with referral bonuses`)
    } catch (error) {
      console.error('Failed to reset user tokens:', error)
      throw error
    }
  }

  // 특정 사용자의 토큰 리셋 (한도만큼 채워주기)
  async resetUserTokens(userId: string): Promise<void> {
    try {
      // 사용자의 추천 보상 토큰 수 계산 (영구적)
      const referralBonus = await this.getUserReferralBonus(userId)
      const dailyLimit = 15 + referralBonus // 기본 15 + 추천 보상 = 일일 한도

      // 잔액 확인 및 리셋
      const { data: userTokens, error: fetchError } = await this.supabase
        .from('user_tokens')
        .select('balance')
        .eq('user_id', userId)
        .single()

      if (fetchError) throw fetchError

      const currentBalance = parseFloat(userTokens.balance)
      const resetBalance = currentBalance >= 1000 ? currentBalance : 1000

      // 토큰을 일일 한도만큼 채워주기 (사용량과 상관없이)
      const { error: updateError } = await this.supabase
        .from('user_tokens')
        .update({
          retry_tokens: dailyLimit, // 일일 한도만큼 채워주기 (10/45 → 45/45)
          balance: resetBalance.toFixed(2),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (updateError) throw updateError

      console.log(`🔄 Daily refill user ${userId}: ${dailyLimit} tokens (daily limit: 15 base + ${referralBonus} referral), ${resetBalance} USDT`)
    } catch (error) {
      console.error('Failed to reset user tokens:', error)
      throw error
    }
  }

  // 사용자의 추천 보상 토큰 수 계산
  private async getUserReferralBonus(userId: string): Promise<number> {
    try {
      // 추천한 사람 수 + 추천받은 사람 수
      const { data: referralStats, error } = await this.supabase
        .from('referral_relationships')
        .select('referrer_id, referee_id')
        .or(`referrer_id.eq.${userId},referee_id.eq.${userId}`)

      if (error) throw error

      const totalReferrals = referralStats?.length || 0
      return totalReferrals * 3 // 추천당 +3 토큰

    } catch (error) {
      console.error('Failed to calculate referral bonus:', error)
      return 0
    }
  }

  // 사용자 토큰 정보 가져오기 (추천 보상 포함)
  async getUserTokensWithBonus(userId: string): Promise<{
    retry_tokens: number
    balance: string
    referral_bonus: number
    total_tokens: number
  }> {
    try {
      const { data: userTokens, error } = await this.supabase
        .from('user_tokens')
        .select('retry_tokens, balance')
        .eq('user_id', userId)
        .single()

      if (error) throw error

      const referralBonus = await this.getUserReferralBonus(userId)
      const totalTokens = userTokens.retry_tokens + referralBonus

      return {
        retry_tokens: userTokens.retry_tokens,
        balance: userTokens.balance,
        referral_bonus: referralBonus,
        total_tokens: totalTokens
      }
    } catch (error) {
      console.error('Failed to get user tokens with bonus:', error)
      throw error
    }
  }
}

export const dailyResetService = new DailyResetService()
