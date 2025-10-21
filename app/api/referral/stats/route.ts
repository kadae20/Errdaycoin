import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Vercel 함수 타임아웃 설정 (최대 30초)
export const maxDuration = 30

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // 현재 사용자 정보 가져오기
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 추천인 통계 조회
    const { data: referralStats, error: statsError } = await supabase
      .from('referral_rewards')
      .select(`
        referrer_tokens,
        referee_tokens,
        created_at
      `)
      .eq('referrer_id', user.id)

    if (statsError) {
      console.error('Referral stats error:', statsError)
      return NextResponse.json(
        { error: 'Failed to fetch referral stats' },
        { status: 500 }
      )
    }

    // 통계 계산
    const totalReferrals = referralStats?.length || 0
    const totalRewards = referralStats?.reduce((sum, reward) => sum + reward.referrer_tokens, 0) || 0
    
    // 이번 달 추천 수
    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)
    
    const thisMonthReferrals = referralStats?.filter(
      reward => new Date(reward.created_at) >= thisMonth
    ).length || 0
    
    const thisMonthRewards = referralStats?.filter(
      reward => new Date(reward.created_at) >= thisMonth
    ).reduce((sum, reward) => sum + reward.referrer_tokens, 0) || 0

    return NextResponse.json({
      totalReferrals,
      totalRewards,
      thisMonthReferrals,
      thisMonthRewards
    })
  } catch (error) {
    console.error('Referral stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
