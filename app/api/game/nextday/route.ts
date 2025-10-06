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

    const { sessionId, currentCandleIndex, newPrice } = await request.json()

    // 입력값 검증
    if (!sessionId || currentCandleIndex === undefined || !newPrice) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 다음 날 공개
    const result = await gameService.revealNextDay(
      sessionId,
      currentCandleIndex,
      newPrice
    )

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Next day reveal error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
