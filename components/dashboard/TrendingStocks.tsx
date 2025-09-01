'use client'

import { AssetWithPrice } from '@/lib/types/market'
import Link from 'next/link'

interface TrendingStocksProps {
  assets: AssetWithPrice[]
  timeframe: string
}

const TrendingStocks = ({ assets, timeframe }: TrendingStocksProps) => {
  const formatPrice = (price: number, currency = 'USD') => {
    if (currency === 'USD') {
      return `$${price.toLocaleString(undefined, { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}`
    }
    return price.toLocaleString()
  }

  const formatChange = (change: number | null) => {
    if (change === null) return '0.00%'
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(2)}%`
  }

  const getChangeColor = (change: number | null) => {
    if (change === null || change === 0) return 'text-gray-500'
    return change > 0 ? 'text-green-600' : 'text-red-600'
  }

  const getAssetIcon = (symbol: string, logoUrl?: string | null) => {
    if (logoUrl) {
      return (
        <img 
          src={logoUrl} 
          alt={symbol}
          className="w-10 h-10 rounded-full"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
            target.nextElementSibling?.classList.remove('hidden')
          }}
        />
      )
    }
    
    // 기본 아이콘
    const iconMap: Record<string, string> = {
      'BTC-USD': '₿',
      'ETH-USD': 'Ξ',
      'AAPL': '🍎',
      'MSFT': '🪟',
      'GOOGL': '🔍',
      'AMZN': '📦',
      'TSLA': '🚗',
      'NVDA': '🎮',
      'META': '📘',
    }
    
    return (
      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-lg">
        {iconMap[symbol] || symbol.charAt(0)}
      </div>
    )
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">📈</div>
        <p className="text-gray-500">표시할 데이터가 없습니다</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {assets.slice(0, 10).map((asset, index) => (
        <Link 
          key={asset.id}
          href={`/asset/${asset.symbol}`}
          className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-400 font-mono w-6">
              #{index + 1}
            </div>
            
            <div className="relative">
              {getAssetIcon(asset.symbol, asset.logo_url)}
              <div className="hidden w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                {asset.symbol.charAt(0)}
              </div>
            </div>
            
            <div>
              <div className="font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">
                {asset.symbol}
              </div>
              <div className="text-sm text-gray-500">
                {asset.name_ko || asset.name}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="font-semibold text-gray-800">
              {formatPrice(asset.current_price?.price || 0, asset.currency)}
            </div>
            <div className={`text-sm font-medium ${
              getChangeColor(asset.current_price?.change_percent)
            }`}>
              {formatChange(asset.current_price?.change_percent)}
            </div>
          </div>
        </Link>
      ))}
      
      <div className="pt-4 border-t">
        <Link 
          href="/markets"
          className="block text-center text-primary-500 hover:text-primary-600 font-medium"
        >
          더 많은 종목 보기 →
        </Link>
      </div>
    </div>
  )
}

export default TrendingStocks
