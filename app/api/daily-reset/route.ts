// 일일 리셋 API - 크론잡이나 외부 서비스에서 호출

import { NextRequest, NextResponse } from 'next/server'
import { dailyResetService } from '@/lib/services/daily-reset-service'

export async function POST(request: NextRequest) {
  try {
    // API 키 검증 (선택사항)
    const authHeader = request.headers.get('authorization')
    const expectedKey = process.env.DAILY_RESET_API_KEY
    
    if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 일일 리셋 실행
    await dailyResetService.checkAndResetDailyTokens()

    return NextResponse.json({ 
      success: true, 
      message: 'Daily reset completed successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Daily reset failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Daily reset failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET 요청으로 수동 리셋 테스트
export async function GET() {
  try {
    await dailyResetService.checkAndResetDailyTokens()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Manual daily reset completed',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Manual daily reset failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Manual daily reset failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
