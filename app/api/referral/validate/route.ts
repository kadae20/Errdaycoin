import { NextRequest, NextResponse } from 'next/server'
import { referralService } from '@/lib/services/referral-service'

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      )
    }

    // 추천 코드 유효성 검사
    const validation = await referralService.validateReferralCode(code)

    return NextResponse.json({
      success: true,
      data: validation
    })

  } catch (error) {
    console.error('Referral validation error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
