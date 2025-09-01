'use client'

import { Transaction, Asset } from '@/lib/types/market'
import Link from 'next/link'

interface TransactionWithAsset extends Transaction {
  asset: Asset
}

interface TransactionHistoryProps {
  transactions: TransactionWithAsset[]
}

const TransactionHistory = ({ transactions }: TransactionHistoryProps) => {
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`
  }

  const formatQuantity = (quantity: number) => {
    return quantity.toLocaleString(undefined, { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 8 
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTransactionTypeColor = (type: string) => {
    return type === 'BUY' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
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

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-6">📊</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          거래 내역이 없습니다
        </h3>
        <p className="text-gray-600">
          첫 번째 거래를 시작해보세요!
        </p>
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
              <th className="text-center py-4 px-6 font-semibold text-gray-800">구분</th>
              <th className="text-right py-4 px-6 font-semibold text-gray-800">수량</th>
              <th className="text-right py-4 px-6 font-semibold text-gray-800">가격</th>
              <th className="text-right py-4 px-6 font-semibold text-gray-800">총 금액</th>
              <th className="text-right py-4 px-6 font-semibold text-gray-800">수수료</th>
              <th className="text-right py-4 px-6 font-semibold text-gray-800">거래일시</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr 
                key={transaction.id}
                className="border-b hover:bg-gray-50 transition-colors"
              >
                <td className="py-4 px-6">
                  <Link 
                    href={`/asset/${transaction.asset.symbol}`}
                    className="flex items-center gap-3 hover:text-primary-600 transition-colors"
                  >
                    <div className="relative">
                      {getAssetIcon(transaction.asset.symbol, transaction.asset.logo_url)}
                      <div className="hidden w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                        {transaction.asset.symbol.charAt(0)}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">
                        {transaction.asset.symbol}
                      </div>
                      <div className="text-sm text-gray-500">
                        {transaction.asset.name_ko || transaction.asset.name}
                      </div>
                    </div>
                  </Link>
                </td>
                
                <td className="py-4 px-6 text-center">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    getTransactionTypeColor(transaction.transaction_type)
                  }`}>
                    {transaction.transaction_type === 'BUY' ? '매수' : '매도'}
                  </span>
                </td>
                
                <td className="py-4 px-6 text-right font-medium text-gray-800">
                  {formatQuantity(transaction.quantity)}
                </td>
                
                <td className="py-4 px-6 text-right text-gray-600">
                  {formatCurrency(transaction.price)}
                </td>
                
                <td className="py-4 px-6 text-right font-semibold text-gray-800">
                  {formatCurrency(transaction.total_amount)}
                </td>
                
                <td className="py-4 px-6 text-right text-gray-600">
                  {formatCurrency(transaction.fee)}
                </td>
                
                <td className="py-4 px-6 text-right text-gray-600 text-sm">
                  {formatDate(transaction.executed_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모바일 카드 */}
      <div className="lg:hidden space-y-4">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <Link 
                href={`/asset/${transaction.asset.symbol}`}
                className="flex items-center gap-3 flex-1 hover:text-primary-600 transition-colors"
              >
                <div className="relative">
                  {getAssetIcon(transaction.asset.symbol, transaction.asset.logo_url)}
                  <div className="hidden w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                    {transaction.asset.symbol.charAt(0)}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-gray-800">
                    {transaction.asset.symbol}
                  </div>
                  <div className="text-sm text-gray-500">
                    {transaction.asset.name_ko || transaction.asset.name}
                  </div>
                </div>
              </Link>
              
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                getTransactionTypeColor(transaction.transaction_type)
              }`}>
                {transaction.transaction_type === 'BUY' ? '매수' : '매도'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500 mb-1">수량</div>
                <div className="font-medium text-gray-800">
                  {formatQuantity(transaction.quantity)}
                </div>
              </div>
              
              <div>
                <div className="text-gray-500 mb-1">가격</div>
                <div className="font-medium text-gray-800">
                  {formatCurrency(transaction.price)}
                </div>
              </div>
              
              <div>
                <div className="text-gray-500 mb-1">총 금액</div>
                <div className="font-semibold text-gray-800">
                  {formatCurrency(transaction.total_amount)}
                </div>
              </div>
              
              <div>
                <div className="text-gray-500 mb-1">거래일시</div>
                <div className="text-gray-600">
                  {formatDate(transaction.executed_at)}
                </div>
              </div>
            </div>
            
            {transaction.fee > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">수수료</span>
                  <span className="text-gray-600">{formatCurrency(transaction.fee)}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default TransactionHistory
