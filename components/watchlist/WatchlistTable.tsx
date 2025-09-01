'use client'

import { GetWatchlistResponse } from '@/lib/types/market'
import Link from 'next/link'

interface WatchlistTableProps {
  watchlist: GetWatchlistResponse
  onRemove: (assetId: number) => void
  isRemoving: boolean
}

const WatchlistTable = ({ watchlist, onRemove, isRemoving }: WatchlistTableProps) => {
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

  const formatVolume = (volume: number | null) => {
    if (!volume) return '-'
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(1)}B`
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(1)}M`
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`
    return volume.toLocaleString()
  }

  const getChangeColor = (change: number | null) => {
    if (change === null || change === 0) return 'text-gray-500'
    return change > 0 ? 'text-green-600' : 'text-red-600'
  }

  const getChangeBgColor = (change: number | null) => {
    if (change === null || change === 0) return 'bg-gray-100'
    return change > 0 ? 'bg-green-100' : 'bg-red-100'
  }

  const getAssetIcon = (symbol: string, logoUrl?: string | null) => {
    if (logoUrl) {
      return (
        <img 
          src={logoUrl} 
          alt={symbol}
          className="w-8 h-8 rounded-full"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
            target.nextElementSibling?.classList.remove('hidden')
          }}
        />
      )
    }
    
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
      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-sm font-medium">
        {iconMap[symbol] || symbol.charAt(0)}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* 데스크톱 테이블 */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left py-4 px-6 font-semibold text-gray-800">종목</th>
              <th className="text-right py-4 px-6 font-semibold text-gray-800">현재가</th>
              <th className="text-right py-4 px-6 font-semibold text-gray-800">변동률</th>
              <th className="text-right py-4 px-6 font-semibold text-gray-800">거래량</th>
              <th className="text-right py-4 px-6 font-semibold text-gray-800">시가총액</th>
              <th className="text-center py-4 px-6 font-semibold text-gray-800">액션</th>
            </tr>
          </thead>
          <tbody>
            {watchlist.map((item) => (
              <tr 
                key={item.id}
                className="border-b hover:bg-gray-50 transition-colors"
              >
                <td className="py-4 px-6">
                  <Link 
                    href={`/asset/${item.asset.symbol}`}
                    className="flex items-center gap-3 hover:text-primary-600 transition-colors"
                  >
                    <div className="relative">
                      {getAssetIcon(item.asset.symbol, item.asset.logo_url)}
                      <div className="hidden w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                        {item.asset.symbol.charAt(0)}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">
                        {item.asset.symbol}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.asset.name_ko || item.asset.name}
                      </div>
                    </div>
                  </Link>
                </td>
                
                <td className="py-4 px-6 text-right">
                  <div className="font-semibold text-gray-800">
                    {formatPrice(item.price?.price || 0, item.asset.currency)}
                  </div>
                </td>
                
                <td className="py-4 px-6 text-right">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${
                    getChangeBgColor(item.price?.change_percent)
                  } ${getChangeColor(item.price?.change_percent)}`}>
                    {formatChange(item.price?.change_percent)}
                  </div>
                </td>
                
                <td className="py-4 px-6 text-right text-gray-600">
                  {formatVolume(item.price?.volume)}
                </td>
                
                <td className="py-4 px-6 text-right text-gray-600">
                  {item.price?.market_cap ? formatVolume(item.price.market_cap) : '-'}
                </td>
                
                <td className="py-4 px-6 text-center">
                  <button
                    onClick={() => onRemove(item.asset.id)}
                    disabled={isRemoving}
                    className="text-red-500 hover:text-red-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모바일 카드 */}
      <div className="lg:hidden divide-y">
        {watchlist.map((item) => (
          <div key={item.id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <Link 
                href={`/asset/${item.asset.symbol}`}
                className="flex items-center gap-3 flex-1 hover:text-primary-600 transition-colors"
              >
                <div className="relative">
                  {getAssetIcon(item.asset.symbol, item.asset.logo_url)}
                  <div className="hidden w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                    {item.asset.symbol.charAt(0)}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-gray-800">
                    {item.asset.symbol}
                  </div>
                  <div className="text-sm text-gray-500">
                    {item.asset.name_ko || item.asset.name}
                  </div>
                </div>
              </Link>
              
              <button
                onClick={() => onRemove(item.asset.id)}
                disabled={isRemoving}
                className="text-red-500 hover:text-red-700 p-2 disabled:opacity-50"
              >
                🗑️
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500 mb-1">현재가</div>
                <div className="font-semibold text-gray-800">
                  {formatPrice(item.price?.price || 0, item.asset.currency)}
                </div>
              </div>
              
              <div>
                <div className="text-gray-500 mb-1">변동률</div>
                <div className={`font-semibold ${getChangeColor(item.price?.change_percent)}`}>
                  {formatChange(item.price?.change_percent)}
                </div>
              </div>
              
              <div>
                <div className="text-gray-500 mb-1">거래량</div>
                <div className="text-gray-600">
                  {formatVolume(item.price?.volume)}
                </div>
              </div>
              
              <div>
                <div className="text-gray-500 mb-1">시가총액</div>
                <div className="text-gray-600">
                  {item.price?.market_cap ? formatVolume(item.price.market_cap) : '-'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default WatchlistTable
