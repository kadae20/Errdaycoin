'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import LangSwitcher from '@/components/LangSwitcher'
import AuthButton from '@/components/AuthButton'
import AddToWatchlistModal from '@/components/watchlist/AddToWatchlistModal'
import WatchlistTable from '@/components/watchlist/WatchlistTable'
import { GetWatchlistResponse } from '@/lib/types/market'
import { useAnalytics } from '@/lib/utils/analytics'
import { createClient } from '@/lib/supabase/client'

export default function WatchlistPage() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [sortBy, setSortBy] = useState<'symbol' | 'price' | 'change'>('change')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterCategory, setFilterCategory] = useState('ALL')
  
  const { t } = useTranslation()
  const analytics = useAnalytics()
  const queryClient = useQueryClient()
  const supabase = createClient()

  // 사용자 인증 상태 확인
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      return session
    },
  })

  // 관심종목 데이터 가져오기
  const { data: watchlist, isLoading, error } = useQuery({
    queryKey: ['watchlist', session?.user?.id],
    queryFn: async (): Promise<GetWatchlistResponse> => {
      if (!session?.user?.id) return []
      
      const response = await fetch('/api/watchlist', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch watchlist')
      }
      
      return response.json()
    },
    enabled: !!session?.user?.id,
    refetchInterval: 30000, // 30초마다 새로고침
  })

  // 관심종목에서 제거
  const removeFromWatchlistMutation = useMutation({
    mutationFn: async (assetId: number) => {
      const response = await fetch(`/api/watchlist/${assetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to remove from watchlist')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] })
      analytics.track({
        name: 'watchlist_remove',
        properties: { source: 'watchlist_page' }
      })
    },
  })

  useEffect(() => {
    analytics.page({ path: '/watchlist', title: 'Watchlist' })
  }, [analytics])

  // 정렬된 관심종목
  const sortedWatchlist = watchlist ? [...watchlist].sort((a, b) => {
    let aValue: number | string = 0
    let bValue: number | string = 0
    
    switch (sortBy) {
      case 'symbol':
        aValue = a.asset.symbol
        bValue = b.asset.symbol
        break
      case 'price':
        aValue = a.price?.price || 0
        bValue = b.price?.price || 0
        break
      case 'change':
        aValue = a.price?.change_percent || 0
        bValue = b.price?.change_percent || 0
        break
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  }) : []

  // 카테고리 필터링
  const filteredWatchlist = sortedWatchlist.filter(item => {
    if (filterCategory === 'ALL') return true
    return item.asset.market_category?.code === filterCategory
  })

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <div className="text-2xl">📈</div>
                <h1 className="text-xl font-bold text-gray-800">AlphaSquare</h1>
              </Link>
              <div className="flex items-center gap-4">
                <AuthButton />
                <LangSwitcher />
              </div>
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <div className="text-6xl mb-6">🔒</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              로그인이 필요합니다
            </h2>
            <p className="text-gray-600 mb-6">
              관심종목을 저장하고 관리하려면 로그인해주세요.
            </p>
            <AuthButton />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 네비게이션 */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2">
                <div className="text-2xl">📈</div>
                <h1 className="text-xl font-bold text-gray-800">AlphaSquare</h1>
              </Link>
              
              <div className="hidden md:flex items-center gap-6">
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-800">
                  대시보드
                </Link>
                <Link href="/watchlist" className="text-primary-600 font-medium">
                  관심종목
                </Link>
                <Link href="/portfolio" className="text-gray-600 hover:text-gray-800">
                  포트폴리오
                </Link>
                <Link href="/community" className="text-gray-600 hover:text-gray-800">
                  커뮤니티
                </Link>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <AuthButton />
              <LangSwitcher />
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              ⭐ 관심종목
            </h1>
            <p className="text-gray-600">
              {filteredWatchlist.length}개의 종목을 관심종목으로 등록했습니다
            </p>
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 sm:mt-0 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <span>➕</span>
            종목 추가
          </button>
        </div>

        {/* 필터 및 정렬 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 justify-between">
            {/* 카테고리 필터 */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">카테고리:</span>
              {['ALL', 'US', 'CRYPTO', 'EU', 'ASIA'].map((category) => (
                <button
                  key={category}
                  onClick={() => setFilterCategory(category)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    filterCategory === category
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

            {/* 정렬 */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">정렬:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="change">변동률</option>
                <option value="symbol">종목명</option>
                <option value="price">가격</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {/* 관심종목 테이블 */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center">
              <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">관심종목을 불러오는 중...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-6xl mb-4">😵</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              데이터를 불러올 수 없습니다
            </h3>
            <p className="text-gray-600 mb-4">
              네트워크 연결을 확인하고 다시 시도해주세요.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              새로고침
            </button>
          </div>
        ) : filteredWatchlist.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-6">📊</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              {filterCategory === 'ALL' ? '관심종목이 없습니다' : '해당 카테고리에 종목이 없습니다'}
            </h3>
            <p className="text-gray-600 mb-6">
              관심 있는 종목을 추가해보세요.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              ➕ 종목 추가하기
            </button>
          </div>
        ) : (
          <WatchlistTable
            watchlist={filteredWatchlist}
            onRemove={(assetId) => removeFromWatchlistMutation.mutate(assetId)}
            isRemoving={removeFromWatchlistMutation.isPending}
          />
        )}
      </main>

      {/* 종목 추가 모달 */}
      {showAddModal && (
        <AddToWatchlistModal
          onClose={() => setShowAddModal(false)}
          onAdd={() => {
            queryClient.invalidateQueries({ queryKey: ['watchlist'] })
            setShowAddModal(false)
          }}
        />
      )}
    </div>
  )
}
