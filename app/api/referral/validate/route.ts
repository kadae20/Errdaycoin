import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { referralCode } = await request.json()
    
    if (!referralCode || referralCode.length !== 8) {
      return NextResponse.json(
        { error: 'Invalid referral code format' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    
    // 추천코드 유효성 검사
    const { data: referralData, error } = await supabase
      .from('user_referral_codes')
      .select('user_id, referral_code')
      .eq('referral_code', referralCode)
      .single()

    if (error || !referralData) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      valid: true,
      referrerId: referralData.user_id,
      referralCode: referralData.referral_code
    })
  } catch (error) {
    console.error('Referral code validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}