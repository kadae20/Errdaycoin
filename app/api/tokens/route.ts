import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { gameService } from '@/lib/services/game-service'

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

    // 유저 토큰 정보 가져오기
    const tokens = await gameService.getUserTokens(user.id)
    
    // 토큰 로그 가져오기
    const { data: tokenLogs, error: logsError } = await supabase
      .from('token_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (logsError) {
      console.error('Token logs fetch error:', logsError)
    }

    return NextResponse.json({
      success: true,
      data: {
        tokens,
        logs: tokenLogs || []
      }
    })

  } catch (error) {
    console.error('Token fetch error:', error)
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

    const { amount, reason, meta } = await request.json()

    // 입력값 검증
    if (!amount || !reason) {
      return NextResponse.json(
        { error: 'Amount and reason are required' },
        { status: 400 }
      )
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      )
    }

    // 토큰 지급
    await gameService.giveTokens(user.id, amount, reason, meta)

    // 업데이트된 토큰 정보 반환
    const tokens = await gameService.getUserTokens(user.id)

    return NextResponse.json({
      success: true,
      data: { tokens }
    })

  } catch (error) {
    console.error('Token give error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
