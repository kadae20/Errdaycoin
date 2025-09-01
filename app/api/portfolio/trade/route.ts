import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ExecuteTradeRequestSchema } from '@/lib/types/market'
import { Database } from '@/lib/types/database'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
    const { portfolioId, assetId, type, quantity, price } = ExecuteTradeRequestSchema.parse(body)

    // 포트폴리오 소유권 확인
    const { data: portfolio, error: portfolioError } = await supabase
      .from('user_portfolio')
      .select('*')
      .eq('id', portfolioId)
      .eq('user_id', user.id)
      .single()

    if (portfolioError || !portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found or access denied' },
        { status: 404 }
      )
    }

    // 자산 정보 확인
    const { data: asset, error: assetError } = await supabase
      .from('asset')
      .select('*')
      .eq('id', assetId)
      .single()

    if (assetError || !asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      )
    }

    const totalAmount = quantity * price
    const fee = totalAmount * 0.001 // 0.1% 수수료

    // 매도의 경우 보유 수량 확인
    if (type === 'SELL') {
      const { data: holding } = await supabase
        .from('portfolio_holding')
        .select('quantity')
        .eq('portfolio_id', portfolioId)
        .eq('asset_id', assetId)
        .single()

      if (!holding || holding.quantity < quantity) {
        return NextResponse.json(
          { error: '보유 수량이 부족합니다' },
          { status: 400 }
        )
      }
    }

    // 거래 내역 저장
    const { error: transactionError } = await supabase
      .from('transaction_history')
      .insert({
        user_id: user.id,
        portfolio_id: portfolioId,
        asset_id: assetId,
        transaction_type: type,
        quantity,
        price,
        total_amount: totalAmount,
        fee,
      })

    if (transactionError) {
      console.error('Transaction insert error:', transactionError)
      return NextResponse.json(
        { error: 'Failed to record transaction' },
        { status: 500 }
      )
    }

    // 포트폴리오 보유 종목 업데이트
    const { data: existingHolding } = await supabase
      .from('portfolio_holding')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .eq('asset_id', assetId)
      .single()

    if (type === 'BUY') {
      if (existingHolding) {
        // 기존 보유 종목에 추가
        const newQuantity = existingHolding.quantity + quantity
        const newTotalInvested = existingHolding.total_invested + totalAmount
        const newAvgPrice = newTotalInvested / newQuantity

        await supabase
          .from('portfolio_holding')
          .update({
            quantity: newQuantity,
            avg_buy_price: newAvgPrice,
            total_invested: newTotalInvested,
            last_updated: new Date().toISOString(),
          })
          .eq('id', existingHolding.id)
      } else {
        // 새로운 보유 종목 추가
        await supabase
          .from('portfolio_holding')
          .insert({
            portfolio_id: portfolioId,
            asset_id: assetId,
            quantity,
            avg_buy_price: price,
            total_invested: totalAmount,
          })
      }
    } else { // SELL
      if (existingHolding) {
        const newQuantity = existingHolding.quantity - quantity
        
        if (newQuantity <= 0) {
          // 모든 수량 매도 - 보유 종목 삭제
          await supabase
            .from('portfolio_holding')
            .delete()
            .eq('id', existingHolding.id)
        } else {
          // 일부 매도 - 수량 업데이트
          const soldRatio = quantity / existingHolding.quantity
          const newTotalInvested = existingHolding.total_invested * (1 - soldRatio)

          await supabase
            .from('portfolio_holding')
            .update({
              quantity: newQuantity,
              total_invested: newTotalInvested,
              last_updated: new Date().toISOString(),
            })
            .eq('id', existingHolding.id)
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `${type === 'BUY' ? '매수' : '매도'} 주문이 체결되었습니다` 
    })

  } catch (error) {
    console.error('Trade execution error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const runtime = 'edge'
