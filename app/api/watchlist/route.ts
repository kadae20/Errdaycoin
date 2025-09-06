import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { AddToWatchlistRequestSchema, GetWatchlistResponse } from '@/lib/types/market'
import { Database } from '@/lib/types/database'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key"
)

// 관심종목 목록 가져오기
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // 사용자의 관심종목 가져오기
    const { data: watchlist, error } = await supabase
      .from('user_watchlist')
      .select(`
        *,
        asset:asset_id(
          *,
          market_category:market_category_id(*)
        )
      `)
      .eq('user_id', user.id)
      .order('added_at', { ascending: false })

    if (error) {
      console.error('Watchlist query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch watchlist' },
        { status: 500 }
      )
    }

    // 각 자산의 현재 가격정보 추가 (실제로는 외부 API에서)
        const watchlistWithPrices: GetWatchlistResponse = (watchlist || []).map(item => {
      const itemData = item as any
      // 샘플 가격 데이터
      const basePrice = itemData.asset.symbol.includes('BTC') ? 45000 :
                       itemData.asset.symbol.includes('ETH') ? 3000 :
                       itemData.asset.symbol === 'AAPL' ? 180 :
                       itemData.asset.symbol === 'TSLA' ? 250 :
                       itemData.asset.symbol === 'NVDA' ? 500 :
                       itemData.asset.symbol === 'MSFT' ? 380 :
                       itemData.asset.symbol === 'GOOGL' ? 2800 :
                       itemData.asset.symbol === 'AMZN' ? 3200 :
                       itemData.asset.symbol === 'META' ? 320 : 100

      const changePercent = (Math.random() - 0.5) * 10 // -5% to +5%

      return {
        ...itemData,
        price: {
          id: 1,
          asset_id: itemData.asset.id,
          price: basePrice,
          change_amount: basePrice * (changePercent / 100),
          change_percent: changePercent,
          volume: Math.floor(Math.random() * 1000000),
          market_cap: Math.floor(Math.random() * 1000000000000),
          high_24h: basePrice * 1.05,
          low_24h: basePrice * 0.95,
          timestamp: new Date().toISOString(),
          source: 'mock',
        }
      }
    })

    return NextResponse.json(watchlistWithPrices)

  } catch (error) {
    console.error('Watchlist GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 관?�종목에 추�?
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { assetId } = AddToWatchlistRequestSchema.parse(body)

    // 이미 관심종목에 있는지 확인
    const { data: existing } = await supabase
      .from('user_watchlist')
      .select('id')
      .eq('user_id', user.id)
      .eq('asset_id', assetId)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: '이미 관심종목에 추가된 종목입니다' },
        { status: 400 }
      )
    }

    // 관심종목에 추가
    const { error: insertError } = await supabase
      .from('user_watchlist')
      .insert({
        user_id: user.id,
        asset_id: assetId,
      } as any)

    if (insertError) {
      console.error('Insert watchlist error:', insertError)
      return NextResponse.json(
        { error: 'Failed to add to watchlist' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Watchlist POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Edge runtime 제거 - Supabase 호환성을 위해
// export const runtime = 'edge'
