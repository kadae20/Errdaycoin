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

    const { symbol } = await request.json()

    // 새 게임 시작
    const result = await gameService.startNewGame(user.id, symbol)

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Game start error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}

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
    
    // 게임 히스토리 가져오기
    const history = await gameService.getUserGameHistory(user.id, 10)
    
    // 게임 통계 가져오기
    const stats = await gameService.getUserGameStats(user.id)

    return NextResponse.json({
      success: true,
      data: {
        tokens,
        history,
        stats
      }
    })

  } catch (error) {
    console.error('Game data fetch error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
