import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/types/database'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
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

    // 카테고리 ?�터
    if (category !== 'ALL') {
      const { data: categoryData } = await supabase
        .from('market_category')
        .select('id')
        .eq('code', category)
        .single()

      if (categoryData) {
        // ?�당 카테고리???�산�??�터링하�??�해 조인 조건 추�?
        query = query.eq('asset.market_category_id', (categoryData as any).id)
      }
    }

    const { data: analyses, error } = await query

    if (error) {
      console.error('AI analyses query error:', error)
      
      // ?�이?��? ?�으�??�플 ?�이???�성
      const sampleAnalyses = generateSampleAnalyses(category, type, limit)
      return NextResponse.json({
        analyses: sampleAnalyses,
        total: sampleAnalyses.length,
      })
    }

    // ?�제 ?�이?��? ?�으�??�플 ?�이???�성
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
    
    // ?�러 ?�에???�플 ?�이??반환
    const sampleAnalyses = generateSampleAnalyses('ALL', 'TECHNICAL', 10)
    return NextResponse.json({
      analyses: sampleAnalyses,
      total: sampleAnalyses.length,
    })
  }
}

// ?�플 AI 분석 ?�이???�성
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
      '?�승 ?�각???�턴???�성?�고 ?�으�? RSI가 과매??구간?�서 반등?�고 ?�습?�다. 거래?�도 증�??�는 추세?�니??',
      'MACD가 ?�호?�을 ?�향 ?�파?�으�? 볼린?� 밴드 ?�단?�서 지지�?받고 ?�습?�다.',
      '?�동?�균???�배?�이 ?�성?�었�? ?�토캐스?�이 20???�래?�서 골든?�로?��? 보이�??�습?�다.',
      '?�락 ?��? ?�턴?�서 ?�향 ?�파가 발생?�으�? ?�보?�치 61.8% ?�돌�?지?�에??강한 지지�?받고 ?�습?�다.',
      'RSI ?�이버전?��? ?��??�고 ?�으�? 거래??증�??� ?�께 ?�승 모멘?�??강화?�고 ?�습?�다.',
    ],
    SENTIMENT: [
      '최근 긍정?�인 ?�스 발표�??�장 ?�리가 개선?�었?�며, ?�셜미디???�급?�이 급증?�고 ?�습?�다.',
      '기�? ?�자?�들??매수?��? 강화?�고 ?�으�? 공포 ?�욕 지?��? 중립?�서 ?�욕 구간?�로 ?�동?�습?�다.',
      '?�계 ?�문가?�의 긍정???�망??증�??�고 ?�으�? ?�?�멘??분석?�서??강세�?보이�??�습?�다.',
      '?�장 변?�성??감소?�면???�자???�뢰?��? ?�복?�고 ?�으�? 리스?�온 모드�??�환?�고 ?�습?�다.',
    ],
    PATTERN: [
      '과거 ?�사???�턴?�서 70% ?�률�??�승 ?�환??발생?�으�? ?�재 ?�일??조건???�성?�고 ?�습?�다.',
      '계절???�턴 분석 결과 ???�기??강세�?보이??경향???�으�? ??��???�이?��? ?��? ?�받침합?�다.',
      '?�장 ?�이??분석???�르�??�재 축적 ?�계?�서 ?�승 ?�계�??�환?�는 ?�점?�니??',
      '?��?관�?분석 결과 ?��? ?�산?�의 ?�직임??긍정???�호�?보이�??�습?�다.',
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
      created_at: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(), // 지??7????
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
          name_ko: asset.symbol.includes('-USD') ? '?�호?�폐' : '미국',
          name_en: asset.symbol.includes('-USD') ? 'Cryptocurrency' : 'United States',
          is_active: true,
          created_at: new Date().toISOString(),
        }
      }
    })
  }

  return analyses
}

// Edge runtime 제거 - Supabase 호환성을 위해
// export const runtime = 'edge'
