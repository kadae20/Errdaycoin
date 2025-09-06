'use client'

import { AssetWithPrice } from '@/lib/types/market'
import Link from 'next/link'

interface WatchlistPanelProps {
  watchlist: AssetWithPrice[]
}

const WatchlistPanel = ({ watchlist }: WatchlistPanelProps) => {
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

  if (watchlist.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="text-3xl mb-2">⭐</div>
        <p className="text-sm text-gray-500 mb-3">
          아직 관심종목이 없습니다
        </p>
        <Link 
          href="/markets"
          className="text-xs text-primary-500 hover:text-primary-600"
        >
          종목 추가하기
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {watchlist.slice(0, 5).map((asset) => (
        <Link
          key={asset.id}
          href={`/asset/${asset.symbol}`}
          className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors group"
        >
          <div>
            <div className="font-medium text-gray-800 group-hover:text-primary-600 transition-colors text-sm">
              {asset.symbol}
            </div>
            <div className="text-xs text-gray-500">
              {asset.name_ko || asset.name}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm font-medium text-gray-800">
              {formatPrice(asset.current_price?.price || 0, asset.currency)}
            </div>
            <div className={`text-xs font-medium ${
              getChangeColor(asset.current_price?.change_percent || null)
            }`}>
              {formatChange(asset.current_price?.change_percent || null)}
            </div>
          </div>
        </Link>
      ))}
      
      {watchlist.length > 5 && (
        <div className="pt-2 border-t">
          <Link 
            href="/watchlist"
            className="block text-center text-xs text-primary-500 hover:text-primary-600"
          >
            +{watchlist.length - 5}개 더보기
          </Link>
        </div>
      )}
    </div>
  )
}

export default WatchlistPanel
