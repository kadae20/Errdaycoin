'use client'

import { HoldingWithAsset } from '@/lib/types/market'
import Link from 'next/link'

interface HoldingsTableProps {
  holdings: HoldingWithAsset[]
  onTrade: (asset: any, type: 'BUY' | 'SELL') => void
}

const HoldingsTable = ({ holdings, onTrade }: HoldingsTableProps) => {
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`
  }

  const formatPercent = (percent: number | null) => {
    if (percent === null) return '0.00%'
    const sign = percent >= 0 ? '+' : ''
    return `${sign}${percent.toFixed(2)}%`
  }

  const formatQuantity = (quantity: number) => {
    return quantity.toLocaleString(undefined, { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 8 
    })
  }

  const getColorClass = (value: number | null) => {
    if (value === null || value === 0) return 'text-gray-500'
    return value > 0 ? 'text-green-600' : 'text-red-600'
  }

  const getBgColorClass = (value: number | null) => {
    if (value === null || value === 0) return 'bg-gray-100'
    return value > 0 ? 'bg-green-100' : 'bg-red-100'
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
    <div className="overflow-hidden">
      {/* 데스크톱 테이블 */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left py-4 px-6 font-semibold text-gray-800">종목</th>
              <th className="text-right py-4 px-6 font-semibold text-gray-800">보유수량</th>
              <th className="text-right py-4 px-6 font-semibold text-gray-800">평균단가</th>
              <th className="text-right py-4 px-6 font-semibold text-gray-800">현재가</th>
              <th className="text-right py-4 px-6 font-semibold text-gray-800">평가금액</th>
              <th className="text-right py-4 px-6 font-semibold text-gray-800">평가손익</th>
              <th className="text-right py-4 px-6 font-semibold text-gray-800">수익률</th>
              <th className="text-center py-4 px-6 font-semibold text-gray-800">거래</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding) => (
              <tr 
                key={holding.id}
                className="border-b hover:bg-gray-50 transition-colors"
              >
                <td className="py-4 px-6">
                  <Link 
                    href={`/asset/${holding.asset.symbol}`}
                    className="flex items-center gap-3 hover:text-primary-600 transition-colors"
                  >
                    <div className="relative">
                      {getAssetIcon(holding.asset.symbol, holding.asset.logo_url)}
                      <div className="hidden w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                        {holding.asset.symbol.charAt(0)}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">
                        {holding.asset.symbol}
                      </div>
                      <div className="text-sm text-gray-500">
                        {holding.asset.name_ko || holding.asset.name}
                      </div>
                    </div>
                  </Link>
                </td>
                
                <td className="py-4 px-6 text-right font-medium text-gray-800">
                  {formatQuantity(holding.quantity)}
                </td>
                
                <td className="py-4 px-6 text-right text-gray-600">
                  {formatCurrency(holding.avg_buy_price)}
                </td>
                
                <td className="py-4 px-6 text-right font-semibold text-gray-800">
                  {formatCurrency(holding.current_price?.price || 0)}
                </td>
                
                <td className="py-4 px-6 text-right font-semibold text-gray-800">
                  {formatCurrency(holding.current_value || 0)}
                </td>
                
                <td className="py-4 px-6 text-right">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${
                    getBgColorClass(holding.profit_loss)
                  } ${getColorClass(holding.profit_loss)}`}>
                    {formatCurrency(holding.profit_loss || 0)}
                  </div>
                </td>
                
                <td className="py-4 px-6 text-right">
                  <div className={`font-semibold ${getColorClass(holding.profit_loss_percent)}`}>
                    {formatPercent(holding.profit_loss_percent)}
                  </div>
                </td>
                
                <td className="py-4 px-6 text-center">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => onTrade(holding.asset, 'BUY')}
                      className="text-green-600 hover:text-green-800 font-medium text-sm px-2 py-1 rounded hover:bg-green-50 transition-colors"
                    >
                      매수
                    </button>
                    <button
                      onClick={() => onTrade(holding.asset, 'SELL')}
                      className="text-red-600 hover:text-red-800 font-medium text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      매도
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모바일 카드 */}
      <div className="lg:hidden space-y-4">
        {holdings.map((holding) => (
          <div key={holding.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <Link 
                href={`/asset/${holding.asset.symbol}`}
                className="flex items-center gap-3 flex-1 hover:text-primary-600 transition-colors"
              >
                <div className="relative">
                  {getAssetIcon(holding.asset.symbol, holding.asset.logo_url)}
                  <div className="hidden w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                    {holding.asset.symbol.charAt(0)}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-gray-800">
                    {holding.asset.symbol}
                  </div>
                  <div className="text-sm text-gray-500">
                    {holding.asset.name_ko || holding.asset.name}
                  </div>
                </div>
              </Link>
              
              <div className="flex gap-2">
                <button
                  onClick={() => onTrade(holding.asset, 'BUY')}
                  className="text-green-600 hover:text-green-800 text-sm px-3 py-1 rounded border border-green-300 hover:bg-green-50 transition-colors"
                >
                  매수
                </button>
                <button
                  onClick={() => onTrade(holding.asset, 'SELL')}
                  className="text-red-600 hover:text-red-800 text-sm px-3 py-1 rounded border border-red-300 hover:bg-red-50 transition-colors"
                >
                  매도
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500 mb-1">보유수량</div>
                <div className="font-medium text-gray-800">
                  {formatQuantity(holding.quantity)}
                </div>
              </div>
              
              <div>
                <div className="text-gray-500 mb-1">평균단가</div>
                <div className="font-medium text-gray-800">
                  {formatCurrency(holding.avg_buy_price)}
                </div>
              </div>
              
              <div>
                <div className="text-gray-500 mb-1">현재가</div>
                <div className="font-semibold text-gray-800">
                  {formatCurrency(holding.current_price?.price || 0)}
                </div>
              </div>
              
              <div>
                <div className="text-gray-500 mb-1">평가금액</div>
                <div className="font-semibold text-gray-800">
                  {formatCurrency(holding.current_value || 0)}
                </div>
              </div>
              
              <div>
                <div className="text-gray-500 mb-1">평가손익</div>
                <div className={`font-semibold ${getColorClass(holding.profit_loss)}`}>
                  {formatCurrency(holding.profit_loss || 0)}
                </div>
              </div>
              
              <div>
                <div className="text-gray-500 mb-1">수익률</div>
                <div className={`font-semibold ${getColorClass(holding.profit_loss_percent)}`}>
                  {formatPercent(holding.profit_loss_percent)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default HoldingsTable
