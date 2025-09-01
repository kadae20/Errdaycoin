'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Asset, ExecuteTradeRequest } from '@/lib/types/market'
import { createClient } from '@/lib/supabase/client'

interface TransactionModalProps {
  asset?: Asset & { tradeType?: 'BUY' | 'SELL' }
  portfolioId?: number
  onClose: () => void
  onSuccess: () => void
}

const TransactionModal = ({ asset, portfolioId, onClose, onSuccess }: TransactionModalProps) => {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(asset || null)
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>(asset?.tradeType || 'BUY')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  
  const supabase = createClient()

  // 자산 검색 (매수 시에만)
  const { data: searchResults } = useQuery({
    queryKey: ['asset-search', searchTerm],
    queryFn: async (): Promise<Asset[]> => {
      if (!searchTerm || selectedAsset) return []
      
      const { data, error } = await supabase
        .from('asset')
        .select('*')
        .eq('is_active', true)
        .or(`symbol.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%,name_ko.ilike.%${searchTerm}%`)
        .limit(10)
      
      if (error) throw error
      return data || []
    },
    enabled: tradeType === 'BUY' && !selectedAsset && searchTerm.length > 0,
  })

  // 현재 가격 가져오기 (실제로는 실시간 API)
  const currentPrice = selectedAsset ? (
    selectedAsset.symbol.includes('BTC') ? 45000 : 
    selectedAsset.symbol.includes('ETH') ? 3000 :
    selectedAsset.symbol === 'AAPL' ? 180 :
    selectedAsset.symbol === 'TSLA' ? 250 :
    selectedAsset.symbol === 'NVDA' ? 500 :
    selectedAsset.symbol === 'MSFT' ? 380 :
    selectedAsset.symbol === 'GOOGL' ? 2800 :
    selectedAsset.symbol === 'AMZN' ? 3200 :
    selectedAsset.symbol === 'META' ? 320 : 100
  ) : 0

  // 거래 실행
  const executeTradeMutation = useMutation({
    mutationFn: async (request: ExecuteTradeRequest) => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('로그인이 필요합니다')
      }

      const response = await fetch('/api/portfolio/trade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to execute trade')
      }

      return response.json()
    },
    onSuccess: () => {
      onSuccess()
    },
  })

  useEffect(() => {
    if (selectedAsset && currentPrice) {
      setPrice(currentPrice.toString())
    }
  }, [selectedAsset, currentPrice])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedAsset || !portfolioId || !quantity || !price) {
      alert('모든 필드를 입력해주세요')
      return
    }

    const quantityNum = parseFloat(quantity)
    const priceNum = parseFloat(price)

    if (quantityNum <= 0 || priceNum <= 0) {
      alert('수량과 가격은 0보다 커야 합니다')
      return
    }

    executeTradeMutation.mutate({
      portfolioId,
      assetId: selectedAsset.id,
      type: tradeType,
      quantity: quantityNum,
      price: priceNum,
    })
  }

  const totalAmount = quantity && price ? (parseFloat(quantity) * parseFloat(price)) : 0

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            {tradeType === 'BUY' ? '💰 매수 주문' : '💸 매도 주문'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 거래 유형 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              거래 유형
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTradeType('BUY')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  tradeType === 'BUY'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                매수
              </button>
              <button
                type="button"
                onClick={() => setTradeType('SELL')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  tradeType === 'SELL'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                매도
              </button>
            </div>
          </div>

          {/* 종목 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              종목
            </label>
            
            {selectedAsset ? (
              <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {getAssetIcon(selectedAsset.symbol, selectedAsset.logo_url)}
                    <div className="hidden w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                      {selectedAsset.symbol.charAt(0)}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">
                      {selectedAsset.symbol}
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedAsset.name_ko || selectedAsset.name}
                    </div>
                  </div>
                </div>
                
                {tradeType === 'BUY' && (
                  <button
                    type="button"
                    onClick={() => setSelectedAsset(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    변경
                  </button>
                )}
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  placeholder="종목명 또는 심볼 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                
                {searchResults && searchResults.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() => {
                          setSelectedAsset(result)
                          setSearchTerm('')
                        }}
                        className="w-full p-3 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            {getAssetIcon(result.symbol, result.logo_url)}
                            <div className="hidden w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                              {result.symbol.charAt(0)}
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">
                              {result.symbol}
                            </div>
                            <div className="text-sm text-gray-500">
                              {result.name_ko || result.name}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 현재가 표시 */}
          {selectedAsset && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-blue-600 mb-1">현재가</div>
              <div className="text-xl font-bold text-blue-800">
                ${currentPrice.toLocaleString()}
              </div>
            </div>
          )}

          {/* 수량 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              수량
            </label>
            <input
              type="number"
              step="0.00000001"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          {/* 가격 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              가격 (USD)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          {/* 총 금액 */}
          {totalAmount > 0 && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">총 {tradeType === 'BUY' ? '매수' : '매도'} 금액</div>
              <div className="text-xl font-bold text-gray-800">
                ${totalAmount.toLocaleString(undefined, { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </div>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!selectedAsset || !quantity || !price || executeTradeMutation.isPending}
              className={`flex-1 px-4 py-2 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                tradeType === 'BUY'
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              {executeTradeMutation.isPending 
                ? '처리 중...' 
                : tradeType === 'BUY' ? '매수 주문' : '매도 주문'
              }
            </button>
          </div>
        </form>

        {executeTradeMutation.error && (
          <div className="px-6 pb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="text-red-800 text-sm">
                {executeTradeMutation.error.message}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TransactionModal
