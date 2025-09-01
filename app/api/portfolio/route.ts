import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GetPortfolioResponse } from '@/lib/types/market'
import { Database } from '@/lib/types/database'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    // 사용자의 기본 포트폴리오 가져오기 (없으면 생성)
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
        })
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
      .eq('portfolio_id', portfolio.id)

    if (holdingsError) {
      console.error('Holdings query error:', holdingsError)
      return NextResponse.json(
        { error: 'Failed to fetch holdings' },
        { status: 500 }
      )
    }

    // 각 보유 종목의 현재 가격 및 손익 계산
    const holdingsWithPrices = (holdings || []).map(holding => {
      // 현재 가격 (실제로는 외부 API에서)
      const basePrice = holding.asset.symbol.includes('BTC') ? 45000 : 
                       holding.asset.symbol.includes('ETH') ? 3000 :
                       holding.asset.symbol === 'AAPL' ? 180 :
                       holding.asset.symbol === 'TSLA' ? 250 :
                       holding.asset.symbol === 'NVDA' ? 500 :
                       holding.asset.symbol === 'MSFT' ? 380 :
                       holding.asset.symbol === 'GOOGL' ? 2800 :
                       holding.asset.symbol === 'AMZN' ? 3200 :
                       holding.asset.symbol === 'META' ? 320 : 100

      const changePercent = (Math.random() - 0.5) * 10 // -5% to +5%
      const currentPrice = basePrice * (1 + changePercent / 100)
      
      const currentValue = holding.quantity * currentPrice
      const profitLoss = currentValue - holding.total_invested
      const profitLossPercent = (profitLoss / holding.total_invested) * 100

      return {
        ...holding,
        current_value: currentValue,
        profit_loss: profitLoss,
        profit_loss_percent: profitLossPercent,
        current_price: {
          id: 1,
          asset_id: holding.asset.id,
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
    await supabase
      .from('user_portfolio')
      .update({ total_value: totalValue })
      .eq('id', portfolio.id)

    const response: GetPortfolioResponse = {
      portfolio,
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

export const runtime = 'edge'
