'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import LangSwitcher from '@/components/LangSwitcher'
import AuthButton from '@/components/AuthButton'
import PortfolioOverview from '@/components/portfolio/PortfolioOverview'
import HoldingsTable from '@/components/portfolio/HoldingsTable'
import TransactionModal from '@/components/portfolio/TransactionModal'
import TransactionHistory from '@/components/portfolio/TransactionHistory'
import { GetPortfolioResponse } from '@/lib/types/market'
import { useAnalytics } from '@/lib/utils/analytics'
import { createClient } from '@/lib/supabase/client'

export default function PortfolioPage() {
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'holdings' | 'history'>('holdings')
  
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

  // 포트폴리오 데이터 가져오기
  const { data: portfolio, isLoading, error } = useQuery({
    queryKey: ['portfolio', session?.user?.id],
    queryFn: async (): Promise<GetPortfolioResponse> => {
      if (!session?.user?.id) throw new Error('Not authenticated')
      
      const response = await fetch('/api/portfolio', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio')
      }
      
      return response.json()
    },
    enabled: !!session?.user?.id,
    refetchInterval: 30000, // 30초마다 새로고침
  })

  // 거래 내역
  const { data: transactions } = useQuery({
    queryKey: ['transactions', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return []
      
      const response = await fetch('/api/portfolio/transactions', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
      
      if (!response.ok) return []
      return response.json()
    },
    enabled: !!session?.user?.id,
  })

  useEffect(() => {
    analytics.page({ path: '/portfolio', title: 'Portfolio' })
  }, [analytics])

  const handleTrade = (asset: any, type: 'BUY' | 'SELL') => {
    setSelectedAsset({ ...asset, tradeType: type })
    setShowTransactionModal(true)
  }

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
              포트폴리오를 관리하려면 로그인해주세요.
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
                <Link href="/watchlist" className="text-gray-600 hover:text-gray-800">
                  관심종목
                </Link>
                <Link href="/portfolio" className="text-primary-600 font-medium">
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
              💼 포트폴리오
            </h1>
            <p className="text-gray-600">
              모의 투자 포트폴리오를 관리하고 성과를 추적하세요
            </p>
          </div>
          
          <button
            onClick={() => {
              setSelectedAsset({ tradeType: 'BUY' })
              setShowTransactionModal(true)
            }}
            className="mt-4 sm:mt-0 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <span>💰</span>
            종목 매수
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {/* 로딩 상태 */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i}>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
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
        ) : (
          <div className="space-y-6">
            {/* 포트폴리오 개요 */}
            <PortfolioOverview portfolio={portfolio} />

            {/* 탭 네비게이션 */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab('holdings')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'holdings'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    보유 종목 ({portfolio?.holdings.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'history'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    거래 내역 ({transactions?.length || 0})
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'holdings' ? (
                  portfolio?.holdings.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-6">📊</div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        보유 종목이 없습니다
                      </h3>
                      <p className="text-gray-600 mb-6">
                        첫 번째 투자를 시작해보세요!
                      </p>
                      <button
                        onClick={() => {
                          setSelectedAsset({ tradeType: 'BUY' })
                          setShowTransactionModal(true)
                        }}
                        className="btn-primary"
                      >
                        💰 종목 매수하기
                      </button>
                    </div>
                  ) : (
                    <HoldingsTable
                      holdings={portfolio?.holdings || []}
                      onTrade={handleTrade}
                    />
                  )
                ) : (
                  <TransactionHistory transactions={transactions || []} />
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 거래 모달 */}
      {showTransactionModal && (
        <TransactionModal
          asset={selectedAsset}
          portfolioId={portfolio?.portfolio.id}
          onClose={() => {
            setShowTransactionModal(false)
            setSelectedAsset(null)
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['portfolio'] })
            queryClient.invalidateQueries({ queryKey: ['transactions'] })
            setShowTransactionModal(false)
            setSelectedAsset(null)
          }}
        />
      )}
    </div>
  )
}
