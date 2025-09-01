'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Asset } from '@/lib/types/market'
import { createClient } from '@/lib/supabase/client'

interface AddToWatchlistModalProps {
  onClose: () => void
  onAdd: () => void
}

const AddToWatchlistModal = ({ onClose, onAdd }: AddToWatchlistModalProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const supabase = createClient()

  // 검색 가능한 자산 목록
  const { data: assets, isLoading } = useQuery({
    queryKey: ['assets', selectedCategory, searchTerm],
    queryFn: async (): Promise<Asset[]> => {
      let query = supabase
        .from('asset')
        .select(`
          *,
          market_category:market_category_id(*)
        `)
        .eq('is_active', true)
        .order('symbol')

      if (selectedCategory !== 'ALL') {
        const { data: categoryData } = await supabase
          .from('market_category')
          .select('id')
          .eq('code', selectedCategory)
          .single()

        if (categoryData) {
          query = query.eq('market_category_id', categoryData.id)
        }
      }

      if (searchTerm) {
        query = query.or(`symbol.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%,name_ko.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query.limit(50)
      
      if (error) throw error
      return data || []
    },
    enabled: true,
  })

  // 관심종목 추가
  const addToWatchlistMutation = useMutation({
    mutationFn: async (assetId: number) => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('로그인이 필요합니다')
      }

      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ assetId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to add to watchlist')
      }
    },
    onSuccess: () => {
      onAdd()
    },
  })

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            관심종목에 추가
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* 검색 및 필터 */}
        <div className="p-6 border-b">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="종목명 또는 심볼 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-2">
              {['ALL', 'US', 'CRYPTO', 'EU', 'ASIA'].map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category === 'ALL' ? '전체' : 
                   category === 'US' ? '미국' :
                   category === 'CRYPTO' ? '암호화폐' :
                   category === 'EU' ? '유럽' : '아시아'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 자산 목록 */}
        <div className="overflow-y-auto max-h-96">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">검색 중...</p>
            </div>
          ) : !assets || assets.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-gray-600">
                {searchTerm ? '검색 결과가 없습니다' : '표시할 종목이 없습니다'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {assets.map((asset) => (
                <div 
                  key={asset.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {getAssetIcon(asset.symbol, asset.logo_url)}
                        <div className="hidden w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                          {asset.symbol.charAt(0)}
                        </div>
                      </div>
                      
                      <div>
                        <div className="font-semibold text-gray-800">
                          {asset.symbol}
                        </div>
                        <div className="text-sm text-gray-500">
                          {asset.name_ko || asset.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {asset.exchange} • {asset.asset_type}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => addToWatchlistMutation.mutate(asset.id)}
                      disabled={addToWatchlistMutation.isPending}
                      className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addToWatchlistMutation.isPending ? '추가 중...' : '추가'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddToWatchlistModal
