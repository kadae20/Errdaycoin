import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { referrerId, refereeId, referralCode } = await request.json()
    
    if (!referrerId || !refereeId || !referralCode) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // 자기 자신을 추천할 수 없음
    if (referrerId === refereeId) {
      return NextResponse.json(
        { error: 'Cannot refer yourself' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    
    // 이미 추천받은 적이 있는지 확인
    const { data: existingReferral } = await supabase
      .from('referral_relationships')
      .select('id')
      .eq('referee_id', refereeId)
      .single()

    if (existingReferral) {
      return NextResponse.json(
        { error: 'User has already been referred' },
        { status: 400 }
      )
    }

    // 추천인 보상 처리
    const { error: rewardError } = await supabase.rpc('process_referral_reward', {
      referrer_id: referrerId,
      referee_id: refereeId,
      referral_code: referralCode
    })

    if (rewardError) {
      console.error('Referral reward processing error:', rewardError)
      return NextResponse.json(
        { error: 'Failed to process referral reward' },
        { status: 500 }
      )
    }

    // 업데이트된 토큰 정보 조회
    const { data: referrerTokens } = await supabase
      .from('user_tokens')
      .select('retry_tokens, referral_tokens')
      .eq('user_id', referrerId)
      .single()

    const { data: refereeTokens } = await supabase
      .from('user_tokens')
      .select('retry_tokens')
      .eq('user_id', refereeId)
      .single()

    return NextResponse.json({
      success: true,
      message: 'Referral reward processed successfully',
      referrerTokens: referrerTokens,
      refereeTokens: refereeTokens
    })
  } catch (error) {
    console.error('Referral processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
