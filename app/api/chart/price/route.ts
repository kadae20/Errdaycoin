import { NextRequest, NextResponse } from 'next/server'
import { binanceAPI } from '@/lib/services/binance-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    const interval = searchParams.get('interval') || '1d'
    const limit = parseInt(searchParams.get('limit') || '100')

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      )
    }

    if (limit < 1 || limit > 1000) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 1000' },
        { status: 400 }
      )
    }

    // 캔들스틱 데이터 가져오기
    const candles = await binanceAPI.getKlines(symbol, interval, limit)

    return NextResponse.json({
      success: true,
      data: {
        symbol,
        interval,
        candles
      }
    })

  } catch (error) {
    console.error('Price data fetch error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { symbols } = await request.json()

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json(
        { error: 'Symbols array is required' },
        { status: 400 }
      )
    }

    if (symbols.length > 20) {
      return NextResponse.json(
        { error: 'Maximum 20 symbols allowed' },
        { status: 400 }
      )
    }

    // 여러 심볼의 현재 가격 가져오기
    const prices: Record<string, number> = {}
    
    await Promise.all(
      symbols.map(async (symbol: string) => {
        try {
          const price = await binanceAPI.getPrice(symbol)
          prices[symbol] = price
        } catch (error) {
          console.error(`Failed to fetch price for ${symbol}:`, error)
          prices[symbol] = 0
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: { prices }
    })

  } catch (error) {
    console.error('Multiple price fetch error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
