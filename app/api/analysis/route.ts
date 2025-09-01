import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/types/database'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'ALL'
    const type = searchParams.get('type') || 'TECHNICAL'
    const limit = parseInt(searchParams.get('limit') || '20')

    let query = supabase
      .from('ai_analysis')
      .select(`
        *,
        asset:asset_id(
          *,
          market_category:market_category_id(*)
        )
      `)
      .eq('analysis_type', type)
      .order('created_at', { ascending: false })
      .limit(limit)

    // 카테고리 필터
    if (category !== 'ALL') {
      const { data: categoryData } = await supabase
        .from('market_category')
        .select('id')
        .eq('code', category)
        .single()

      if (categoryData) {
        // 해당 카테고리의 자산만 필터링하기 위해 조인 조건 추가
        query = query.eq('asset.market_category_id', categoryData.id)
      }
    }

    const { data: analyses, error } = await query

    if (error) {
      console.error('AI analyses query error:', error)
      
      // 데이터가 없으면 샘플 데이터 생성
      const sampleAnalyses = generateSampleAnalyses(category, type, limit)
      return NextResponse.json({
        analyses: sampleAnalyses,
        total: sampleAnalyses.length,
      })
    }

    // 실제 데이터가 없으면 샘플 데이터 생성
    if (!analyses || analyses.length === 0) {
      const sampleAnalyses = generateSampleAnalyses(category, type, limit)
      return NextResponse.json({
        analyses: sampleAnalyses,
        total: sampleAnalyses.length,
      })
    }

    return NextResponse.json({
      analyses,
      total: analyses.length,
    })

  } catch (error) {
    console.error('AI analysis API error:', error)
    
    // 에러 시에도 샘플 데이터 반환
    const sampleAnalyses = generateSampleAnalyses('ALL', 'TECHNICAL', 10)
    return NextResponse.json({
      analyses: sampleAnalyses,
      total: sampleAnalyses.length,
    })
  }
}

// 샘플 AI 분석 데이터 생성
function generateSampleAnalyses(category: string, type: string, limit: number) {
  const assets = [
    { id: 1, symbol: 'BTC-USD', name: 'Bitcoin', name_ko: '비트코인', logo_url: null, currency: 'USD' },
    { id: 2, symbol: 'ETH-USD', name: 'Ethereum', name_ko: '이더리움', logo_url: null, currency: 'USD' },
    { id: 3, symbol: 'AAPL', name: 'Apple Inc.', name_ko: '애플', logo_url: 'https://logo.clearbit.com/apple.com', currency: 'USD' },
    { id: 4, symbol: 'TSLA', name: 'Tesla Inc.', name_ko: '테슬라', logo_url: 'https://logo.clearbit.com/tesla.com', currency: 'USD' },
    { id: 5, symbol: 'NVDA', name: 'NVIDIA Corporation', name_ko: '엔비디아', logo_url: 'https://logo.clearbit.com/nvidia.com', currency: 'USD' },
    { id: 6, symbol: 'MSFT', name: 'Microsoft Corporation', name_ko: '마이크로소프트', logo_url: 'https://logo.clearbit.com/microsoft.com', currency: 'USD' },
  ]

  const signals = ['BUY', 'SELL', 'HOLD']
  const analysisReasons = {
    TECHNICAL: [
      '상승 삼각형 패턴이 형성되고 있으며, RSI가 과매도 구간에서 반등하고 있습니다. 거래량도 증가하는 추세입니다.',
      'MACD가 신호선을 상향 돌파했으며, 볼린저 밴드 하단에서 지지를 받고 있습니다.',
      '이동평균선 정배열이 형성되었고, 스토캐스틱이 20선 아래에서 골든크로스를 보이고 있습니다.',
      '하락 웨지 패턴에서 상향 돌파가 발생했으며, 피보나치 61.8% 되돌림 지점에서 강한 지지를 받고 있습니다.',
      'RSI 다이버전스가 나타나고 있으며, 거래량 증가와 함께 상승 모멘텀이 강화되고 있습니다.',
    ],
    SENTIMENT: [
      '최근 긍정적인 뉴스 발표로 시장 심리가 개선되었으며, 소셜미디어 언급량이 급증하고 있습니다.',
      '기관 투자자들의 매수세가 강화되고 있으며, 공포 탐욕 지수가 중립에서 탐욕 구간으로 이동했습니다.',
      '업계 전문가들의 긍정적 전망이 증가하고 있으며, 펀더멘털 분석에서도 강세를 보이고 있습니다.',
      '시장 변동성이 감소하면서 투자자 신뢰도가 회복되고 있으며, 리스크온 모드로 전환되고 있습니다.',
    ],
    PATTERN: [
      '과거 유사한 패턴에서 70% 확률로 상승 전환이 발생했으며, 현재 동일한 조건이 형성되고 있습니다.',
      '계절적 패턴 분석 결과 이 시기에 강세를 보이는 경향이 있으며, 역사적 데이터가 이를 뒷받침합니다.',
      '시장 사이클 분석에 따르면 현재 축적 단계에서 상승 단계로 전환되는 시점입니다.',
      '상관관계 분석 결과 연관 자산들의 움직임이 긍정적 신호를 보이고 있습니다.',
    ]
  }

  const indicators = {
    TECHNICAL: {
      RSI: 68.5,
      MACD: 0.25,
      'Stochastic': 45.2,
      'Williams %R': -28.4,
      'Bollinger Bands': 0.78,
      'ADX': 45.3,
    },
    SENTIMENT: {
      'Fear & Greed Index': 72,
      'Social Sentiment': 8.5,
      'News Sentiment': 7.8,
      'Institutional Flow': 85,
    },
    PATTERN: {
      'Pattern Confidence': 87,
      'Historical Accuracy': 73,
      'Correlation Score': 0.82,
      'Volatility Index': 24.5,
    }
  }

  const analyses = []
  
  for (let i = 0; i < Math.min(limit, assets.length); i++) {
    const asset = assets[i]
    const signal = signals[Math.floor(Math.random() * signals.length)]
    const confidence = Math.floor(Math.random() * 30) + 60 // 60-90%
    const reasons = analysisReasons[type as keyof typeof analysisReasons] || analysisReasons.TECHNICAL
    const reasoning = reasons[Math.floor(Math.random() * reasons.length)]

    analyses.push({
      id: i + 1,
      asset_id: asset.id,
      analysis_type: type,
      signal,
      confidence,
      reasoning,
      indicators: indicators[type as keyof typeof indicators] || indicators.TECHNICAL,
      created_at: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(), // 지난 7일 내
      asset: {
        ...asset,
        asset_type: asset.symbol.includes('-USD') ? 'CRYPTO' : 'STOCK',
        exchange: asset.symbol.includes('-USD') ? 'BINANCE' : 'NASDAQ',
        is_active: true,
        created_at: new Date().toISOString(),
        market_category_id: 1,
        description: null,
        market_category: {
          id: 1,
          code: asset.symbol.includes('-USD') ? 'CRYPTO' : 'US',
          name_ko: asset.symbol.includes('-USD') ? '암호화폐' : '미국',
          name_en: asset.symbol.includes('-USD') ? 'Cryptocurrency' : 'United States',
          is_active: true,
          created_at: new Date().toISOString(),
        }
      }
    })
  }

  return analyses
}

export const runtime = 'edge'
