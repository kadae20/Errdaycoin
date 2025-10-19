import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/types/database'
import { DashboardData } from '@/lib/types/market'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
    )
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'ALL'

    // ?�장 개요 ?�이???�성 (?�제로는 ?��? API?�서 가?��?????
    const marketOverview = {
      totalMarketCap: 2.5e12, // $2.5T
      totalVolume24h: 95e9,   // $95B
      btcDominance: 52.3,
      activeAssets: 1247,
    }

    // ?�기 종목 가?�오�?(?�장 카테고리 ?�터�?
    let assetsQuery = supabase
      .from('asset')
      .select(`
        *,
        market_category:market_category_id(*)
      `)
      .eq('is_active', true)
      .limit(20)

    if (category !== 'ALL') {
      const { data: categoryData } = await supabase
        .from('market_category')
        .select('id')
        .eq('code', category)
        .single()

      if (categoryData) {
        assetsQuery = assetsQuery.eq('market_category_id', (categoryData as any).id)
      }
    }

    const { data: assets, error: assetsError } = await assetsQuery

    if (assetsError) {
      console.error('Assets query error:', assetsError)
    }

    // �??�산???�??가�??�보 가?�오�?(?�제로는 ?�시�?API?�서)
        const assetsWithPrices = (assets || []).map(asset => {
      const assetData = asset as any
      // ?�플 가�??�이???�성
      const basePrice = assetData.symbol.includes('BTC') ? 45000 :
                       assetData.symbol.includes('ETH') ? 3000 :
                       assetData.symbol === 'AAPL' ? 180 :
                       assetData.symbol === 'TSLA' ? 250 :
                       assetData.symbol === 'NVDA' ? 500 :
                       assetData.symbol === 'MSFT' ? 380 :
                       assetData.symbol === 'GOOGL' ? 2800 :
                       assetData.symbol === 'AMZN' ? 3200 :
                       assetData.symbol === 'META' ? 320 : 100

      const changePercent = (Math.random() - 0.5) * 10 // -5% to +5%
      
      return {
        ...assetData,
        current_price: {
          id: 1,
          asset_id: assetData.id,
          price: basePrice,
          change_amount: basePrice * (changePercent / 100),
          change_percent: changePercent,
          volume: Math.floor(Math.random() * 1000000),
          market_cap: null,
          high_24h: basePrice * 1.05,
          low_24h: basePrice * 0.95,
          timestamp: new Date().toISOString(),
          source: 'mock',
        }
      }
    })

    // ?�승�??�으�??�렬
    const topMovers = assetsWithPrices
      .sort((a, b) => (b.current_price?.change_percent || 0) - (a.current_price?.change_percent || 0))

    // ?�용??관?�종�?(?�증???�용?�의 경우)
    let userWatchlist: any[] = []
    const authHeader = request.headers.get('authorization')
    
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const { data: { user } } = await supabase.auth.getUser(token)
        
        if (user) {
          const { data: watchlist } = await supabase
            .from('user_watchlist')
            .select(`
              *,
              asset:asset_id(*)
            `)
            .eq('user_id', user.id)
            .limit(10)

          userWatchlist = (watchlist || []).map(item => ({
            ...(item as any).asset,
            current_price: topMovers.find(a => a.id === (item as any).asset.id)?.current_price || null
          }))
        }
      } catch (error) {
        console.log('Auth error (continuing without watchlist):', error)
      }
    }

    // 최근 커�??�티 게시글
    const { data: recentPosts } = await supabase
      .from('community_post')
      .select(`
        *,
        author:user_id(id, handle),
        asset:asset_id(*)
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    const postsWithAuthor = (recentPosts || []).map(post => ({
      ...(post as any),
      author: {
        id: (post as any).author?.id || '',
        handle: (post as any).author?.handle || null
      }
    }))

    const dashboardData: DashboardData = {
      topMovers: topMovers.slice(0, 10),
      userWatchlist,
      marketOverview,
      recentPosts: postsWithAuthor,
    }

    return NextResponse.json(dashboardData, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Edge runtime 제거 - Supabase 호환성을 위해
// export const runtime = 'edge'
