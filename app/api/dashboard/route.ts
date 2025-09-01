import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/types/database'
import { DashboardData } from '@/lib/types/market'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'ALL'

    // 시장 개요 데이터 생성 (실제로는 외부 API에서 가져와야 함)
    const marketOverview = {
      totalMarketCap: 2.5e12, // $2.5T
      totalVolume24h: 95e9,   // $95B
      btcDominance: 52.3,
      activeAssets: 1247,
    }

    // 인기 종목 가져오기 (시장 카테고리 필터링)
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
        assetsQuery = assetsQuery.eq('market_category_id', categoryData.id)
      }
    }

    const { data: assets, error: assetsError } = await assetsQuery

    if (assetsError) {
      console.error('Assets query error:', assetsError)
    }

    // 각 자산에 대한 가격 정보 가져오기 (실제로는 실시간 API에서)
    const assetsWithPrices = (assets || []).map(asset => {
      // 샘플 가격 데이터 생성
      const basePrice = asset.symbol.includes('BTC') ? 45000 : 
                       asset.symbol.includes('ETH') ? 3000 :
                       asset.symbol === 'AAPL' ? 180 :
                       asset.symbol === 'TSLA' ? 250 :
                       asset.symbol === 'NVDA' ? 500 :
                       asset.symbol === 'MSFT' ? 380 :
                       asset.symbol === 'GOOGL' ? 2800 :
                       asset.symbol === 'AMZN' ? 3200 :
                       asset.symbol === 'META' ? 320 : 100

      const changePercent = (Math.random() - 0.5) * 10 // -5% to +5%
      
      return {
        ...asset,
        current_price: {
          id: 1,
          asset_id: asset.id,
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

    // 상승률 순으로 정렬
    const topMovers = assetsWithPrices
      .sort((a, b) => (b.current_price?.change_percent || 0) - (a.current_price?.change_percent || 0))

    // 사용자 관심종목 (인증된 사용자의 경우)
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
            ...item.asset,
            current_price: topMovers.find(a => a.id === item.asset.id)?.current_price || null
          }))
        }
      } catch (error) {
        console.log('Auth error (continuing without watchlist):', error)
      }
    }

    // 최근 커뮤니티 게시글
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
      ...post,
      author: {
        id: post.author?.id || '',
        handle: post.author?.handle || null
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

export const runtime = 'edge'
