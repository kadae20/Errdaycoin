import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GetPortfolioResponse } from '@/lib/types/market'
import { Database } from '@/lib/types/database'

// Vercel 함수 타임아웃 설정 (최대 30초)
export const maxDuration = 30

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key"
    )
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

    // 사용자의 기본 포트폴리오 가져오기(없으면 생성)
    let { data: portfolio, error: portfolioError } = await supabase
      .from('user_portfolio')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single()

    if (portfolioError || !portfolio) {
      // 기본 포트폴리오 생성
      const { data: newPortfolio, error: createError } = await supabase
        .from('user_portfolio')
        .insert({
          user_id: user.id,
          name: 'My Portfolio',
          is_default: true,
        } as any)
        .select('*')
        .single()

      if (createError || !newPortfolio) {
        console.error('Failed to create portfolio:', createError)
        return NextResponse.json(
          { error: 'Failed to create portfolio' },
          { status: 500 }
        )
      }

      portfolio = newPortfolio
    }

    // 포트폴리오의 보유 종목 가져오기
    const { data: holdings, error: holdingsError } = await supabase
      .from('portfolio_holding')
      .select(`
        *,
        asset:asset_id(*)
      `)
      .eq('portfolio_id', (portfolio as any)?.id || 0)

    if (holdingsError) {
      console.error('Holdings query error:', holdingsError)
      return NextResponse.json(
        { error: 'Failed to fetch holdings' },
        { status: 500 }
      )
    }

    // 각 보유 종목의 현재 가격과 수익 계산
        const holdingsWithPrices = (holdings || []).map(holding => {
      const holdingData = holding as any
      // 현재 가격(실제로는 외부 API에서)
      const basePrice = holdingData.asset.symbol.includes('BTC') ? 45000 :
                       holdingData.asset.symbol.includes('ETH') ? 3000 :
                       holdingData.asset.symbol === 'AAPL' ? 180 :
                       holdingData.asset.symbol === 'TSLA' ? 250 :
                       holdingData.asset.symbol === 'NVDA' ? 500 :
                       holdingData.asset.symbol === 'MSFT' ? 380 :
                       holdingData.asset.symbol === 'GOOGL' ? 2800 :
                       holdingData.asset.symbol === 'AMZN' ? 3200 :
                       holdingData.asset.symbol === 'META' ? 320 : 100

      const changePercent = (Math.random() - 0.5) * 10 // -5% to +5%
      const currentPrice = basePrice * (1 + changePercent / 100)
      
      const currentValue = holdingData.quantity * currentPrice
      const profitLoss = currentValue - holdingData.total_invested
      const profitLossPercent = (profitLoss / holdingData.total_invested) * 100

      return {
        ...holdingData,
        current_value: currentValue,
        profit_loss: profitLoss,
        profit_loss_percent: profitLossPercent,
        current_price: {
          id: 1,
          asset_id: holdingData.asset.id,
          price: currentPrice,
          change_amount: basePrice * (changePercent / 100),
          change_percent: changePercent,
          volume: Math.floor(Math.random() * 1000000),
          market_cap: null,
          high_24h: currentPrice * 1.05,
          low_24h: currentPrice * 0.95,
          timestamp: new Date().toISOString(),
          source: 'mock',
        }
      }
    })

    // 포트폴리오 총계 계산
    const totalValue = holdingsWithPrices.reduce((sum, h) => sum + (h.current_value || 0), 0)
    const totalInvested = holdingsWithPrices.reduce((sum, h) => sum + h.total_invested, 0)
    const totalProfitLoss = totalValue - totalInvested
    const totalProfitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0

    // 포트폴리오 업데이트
    await (supabase as any)
      .from('user_portfolio')
      .update({ total_value: totalValue })
      .eq('id', (portfolio as any).id)

    const response: GetPortfolioResponse = {
      portfolio: portfolio as any,
      holdings: holdingsWithPrices,
      total_value: totalValue,
      total_profit_loss: totalProfitLoss,
      total_profit_loss_percent: totalProfitLossPercent,
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Portfolio API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Edge runtime 제거 - Supabase 호환성을 위해
// export const runtime = 'edge'
