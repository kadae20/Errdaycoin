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

    // 게임 재시작 (retry_token 소모)
    await gameService.restartGame(user.id)

    // 새 게임 세션 시작
    const { symbol } = await request.json()
    const result = await gameService.startNewGame(user.id, symbol)

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Game restart error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
