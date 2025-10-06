import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { gameService } from '@/lib/services/game-service'

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

    const { 
      sessionId, 
      side, 
      leverage, 
      positionPercentage, 
      entryPrice 
    } = await request.json()

    // 입력값 검증
    if (!sessionId || !side || !leverage || !positionPercentage || !entryPrice) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (side !== 'long' && side !== 'short') {
      return NextResponse.json(
        { error: 'Invalid side. Must be long or short' },
        { status: 400 }
      )
    }

    if (leverage < 1 || leverage > 100) {
      return NextResponse.json(
        { error: 'Invalid leverage. Must be between 1 and 100' },
        { status: 400 }
      )
    }

    if (positionPercentage < 1 || positionPercentage > 100) {
      return NextResponse.json(
        { error: 'Invalid position percentage. Must be between 1 and 100' },
        { status: 400 }
      )
    }

    // 포지션 진입
    const session = await gameService.enterPosition(
      sessionId,
      side,
      leverage,
      positionPercentage,
      entryPrice
    )

    return NextResponse.json({
      success: true,
      data: { session }
    })

  } catch (error) {
    console.error('Position entry error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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

    const { sessionId, exitPrice } = await request.json()

    // 입력값 검증
    if (!sessionId || !exitPrice) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 포지션 종료
    const session = await gameService.closePosition(sessionId, exitPrice)

    return NextResponse.json({
      success: true,
      data: { session }
    })

  } catch (error) {
    console.error('Position close error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
