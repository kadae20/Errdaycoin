import { NextRequest, NextResponse } from 'next/server'
import { binanceAPI } from '@/lib/services/binance-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    const previewDays = parseInt(searchParams.get('previewDays') || '5')
    const totalDays = parseInt(searchParams.get('totalDays') || '10')

    // 입력값 검증
    if (previewDays < 1 || previewDays > 30) {
      return NextResponse.json(
        { error: 'Preview days must be between 1 and 30' },
        { status: 400 }
      )
    }

    if (totalDays < previewDays || totalDays > 50) {
      return NextResponse.json(
        { error: 'Total days must be between preview days and 50' },
        { status: 400 }
      )
    }

    // 랜덤 차트 데이터 가져오기
    const chartData = await binanceAPI.getRandomGameChart(
      symbol || undefined,
      previewDays,
      totalDays
    )

    return NextResponse.json({
      success: true,
      data: chartData
    })

  } catch (error) {
    console.error('Random chart fetch error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { symbol, startDate, days } = await request.json()

    if (!symbol || !startDate) {
      return NextResponse.json(
        { error: 'Symbol and start date are required' },
        { status: 400 }
      )
    }

    // 특정 날짜부터 차트 데이터 가져오기
    const chartData = await binanceAPI.getHistoricalChart(
      symbol,
      new Date(startDate),
      days || 10
    )

    return NextResponse.json({
      success: true,
      data: {
        symbol,
        chartData,
        startDate,
        days: days || 10
      }
    })

  } catch (error) {
    console.error('Historical chart fetch error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
