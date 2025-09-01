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
    const limit = parseInt(searchParams.get('limit') || '10')

    // 인기 자산 가져오기 (실제로는 거래량, 관심종목 등록 수 등을 기준으로)
    const { data: assets, error } = await supabase
      .from('asset')
      .select(`
        *,
        market_category:market_category_id(*)
      `)
      .eq('is_active', true)
      .limit(limit)

    if (error) {
      console.error('Popular assets query error:', error)
      
      // 에러 시 샘플 데이터 반환
      const sampleAssets = generateSamplePopularAssets(limit)
      return NextResponse.json(sampleAssets)
    }

    // 데이터가 없으면 샘플 데이터 반환
    if (!assets || assets.length === 0) {
      const sampleAssets = generateSamplePopularAssets(limit)
      return NextResponse.json(sampleAssets)
    }

    return NextResponse.json(assets)

  } catch (error) {
    console.error('Popular assets API error:', error)
    
    // 에러 시 샘플 데이터 반환
    const sampleAssets = generateSamplePopularAssets(10)
    return NextResponse.json(sampleAssets)
  }
}

// 샘플 인기 자산 데이터 생성
function generateSamplePopularAssets(limit: number) {
  const popularAssets = [
    {
      id: 1,
      symbol: 'BTC-USD',
      name: 'Bitcoin',
      name_ko: '비트코인',
      market_category_id: 1,
      asset_type: 'CRYPTO',
      exchange: 'BINANCE',
      currency: 'USD',
      logo_url: null,
      description: 'The world\'s first cryptocurrency',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      symbol: 'ETH-USD',
      name: 'Ethereum',
      name_ko: '이더리움',
      market_category_id: 1,
      asset_type: 'CRYPTO',
      exchange: 'BINANCE',
      currency: 'USD',
      logo_url: null,
      description: 'Decentralized platform for smart contracts',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 3,
      symbol: 'AAPL',
      name: 'Apple Inc.',
      name_ko: '애플',
      market_category_id: 2,
      asset_type: 'STOCK',
      exchange: 'NASDAQ',
      currency: 'USD',
      logo_url: 'https://logo.clearbit.com/apple.com',
      description: 'Technology company',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 4,
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      name_ko: '테슬라',
      market_category_id: 2,
      asset_type: 'STOCK',
      exchange: 'NASDAQ',
      currency: 'USD',
      logo_url: 'https://logo.clearbit.com/tesla.com',
      description: 'Electric vehicle and clean energy company',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 5,
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      name_ko: '엔비디아',
      market_category_id: 2,
      asset_type: 'STOCK',
      exchange: 'NASDAQ',
      currency: 'USD',
      logo_url: 'https://logo.clearbit.com/nvidia.com',
      description: 'Graphics processing units and AI chips',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 6,
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      name_ko: '마이크로소프트',
      market_category_id: 2,
      asset_type: 'STOCK',
      exchange: 'NASDAQ',
      currency: 'USD',
      logo_url: 'https://logo.clearbit.com/microsoft.com',
      description: 'Software and cloud services',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 7,
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      name_ko: '알파벳',
      market_category_id: 2,
      asset_type: 'STOCK',
      exchange: 'NASDAQ',
      currency: 'USD',
      logo_url: 'https://logo.clearbit.com/google.com',
      description: 'Internet services and products',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 8,
      symbol: 'AMZN',
      name: 'Amazon.com Inc.',
      name_ko: '아마존',
      market_category_id: 2,
      asset_type: 'STOCK',
      exchange: 'NASDAQ',
      currency: 'USD',
      logo_url: 'https://logo.clearbit.com/amazon.com',
      description: 'E-commerce and cloud computing',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 9,
      symbol: 'META',
      name: 'Meta Platforms Inc.',
      name_ko: '메타',
      market_category_id: 2,
      asset_type: 'STOCK',
      exchange: 'NASDAQ',
      currency: 'USD',
      logo_url: 'https://logo.clearbit.com/meta.com',
      description: 'Social media and virtual reality',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 10,
      symbol: 'BNB-USD',
      name: 'Binance Coin',
      name_ko: '바이낸스코인',
      market_category_id: 1,
      asset_type: 'CRYPTO',
      exchange: 'BINANCE',
      currency: 'USD',
      logo_url: null,
      description: 'Binance exchange token',
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ]

  return popularAssets.slice(0, limit)
}

export const runtime = 'edge'
