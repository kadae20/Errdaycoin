import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { referralService } from '@/lib/services/referral-service'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 유저의 추천 코드 가져오기
    const code = await referralService.getUserReferralCode(user.id)
    
    // 추천 통계 가져오기
    const stats = await referralService.getReferralStats(user.id)
    
    // 추천한 유저 목록 가져오기
    const referredUsers = await referralService.getReferredUsers(user.id, 10)

    return NextResponse.json({
      success: true,
      data: {
        code,
        stats,
        referredUsers
      }
    })

  } catch (error) {
    console.error('Referral code fetch error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { referralCode } = await request.json()

    if (!referralCode) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      )
    }

    // 추천 코드 유효성 검사
    const validation = await referralService.validateReferralCode(referralCode)
    
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 400 }
      )
    }

    // 추천인 회원가입 처리
    await referralService.handleReferralSignup(user.id, referralCode)

    return NextResponse.json({
      success: true,
      message: '추천인 가입이 완료되었습니다!'
    })

  } catch (error) {
    console.error('Referral signup error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
