import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ExecuteTradeRequestSchema } from '@/lib/types/market'
import { Database } from '@/lib/types/database'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient<Database>(
      "https://xuqwdkzpvowhigowecwj.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1cXdka3pwdm93aGlnb3dlY3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NDA3NDcsImV4cCI6MjA3MjIxNjc0N30.UcbPHTCxNC1Qc90Pzg8N2Nuh2SuiJ0FX2mVrdf8V4Y0"
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

    const body = await request.json()
    const { portfolioId, assetId, type, quantity, price } = ExecuteTradeRequestSchema.parse(body)

    // 포트폴리오 소유자 확인
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
      const { data: holding, error: holdingError } = await supabase
        .from('portfolio_holding')
        .select('quantity')
        .eq('portfolio_id', portfolioId)
        .eq('asset_id', assetId)
        .single()

      if (holdingError || !holding || (holding as any).quantity < quantity) {
        return NextResponse.json(
          { error: '보유 수량이 부족합니다' },
          { status: 400 }
        )
      }
    }

    // 거래 내역 기록
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
      } as any)

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
        // 기존 보유 종목 추가
        const newQuantity = (existingHolding as any).quantity + quantity
        const newTotalInvested = (existingHolding as any).total_invested + totalAmount
        const newAvgPrice = newTotalInvested / newQuantity

        await (supabase as any)
          .from('portfolio_holding')
          .update({
            quantity: newQuantity,
            avg_buy_price: newAvgPrice,
            total_invested: newTotalInvested,
            last_updated: new Date().toISOString(),
          })
          .eq('id', (existingHolding as any).id)
      } else {
        // 새로운 보유 종목 추가
        await (supabase as any)
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
        const newQuantity = (existingHolding as any).quantity - quantity
        
        if (newQuantity <= 0) {
          // 모든 수량 매도 - 보유 종목 삭제
          await supabase
            .from('portfolio_holding')
            .delete()
            .eq('id', (existingHolding as any).id)
        } else {
          // 일부 매도 - 수량 업데이트
          const soldRatio = quantity / (existingHolding as any).quantity
          const newTotalInvested = (existingHolding as any).total_invested * (1 - soldRatio)

          await (supabase as any)
            .from('portfolio_holding')
            .update({
              quantity: newQuantity,
              total_invested: newTotalInvested,
              last_updated: new Date().toISOString(),
            })
            .eq('id', (existingHolding as any).id)
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

// Edge runtime 제거 - Supabase 호환성을 위해
// export const runtime = 'edge'
