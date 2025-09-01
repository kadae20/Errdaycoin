'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import LangSwitcher from '@/components/LangSwitcher'
import AuthButton from '@/components/AuthButton'
import MarketOverview from '@/components/dashboard/MarketOverview'
import WatchlistPanel from '@/components/dashboard/WatchlistPanel'
import TrendingStocks from '@/components/dashboard/TrendingStocks'
import CommunityFeed from '@/components/dashboard/CommunityFeed'
import QuickChart from '@/components/dashboard/QuickChart'
import LiveCryptoPrices from '@/components/dashboard/LiveCryptoPrices'
import { DashboardData } from '@/lib/types/market'
import { useAnalytics } from '@/lib/utils/analytics'
import AppLayout from '@/components/layout/AppLayout'

export default function DashboardPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const { t } = useTranslation()
  const analytics = useAnalytics()

  // 대시보드 데이터 가져오기
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard', selectedCategory],
    queryFn: async (): Promise<DashboardData> => {
      const response = await fetch(`/api/dashboard?category=${selectedCategory}`)
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }
      return response.json()
    },
    refetchInterval: 30000, // 30초마다 새로고침
  })

  useEffect(() => {
    analytics.page({ path: '/dashboard', title: 'Dashboard' })
  }, [analytics])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            데이터를 불러올 수 없습니다
          </h2>
          <p className="text-gray-600 mb-6">
            네트워크 연결을 확인하고 다시 시도해주세요.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            새로고침
          </button>
        </div>
      </div>
    )
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* 왼쪽 메인 영역 */}
          <div className="xl:col-span-3 space-y-6">
            {/* 시장 개요 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  📊 시장 개요
                </h2>
                <div className="flex items-center gap-2">
                  {['ALL', 'US', 'CRYPTO'].map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategory === category
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {category === 'ALL' ? '전체' : category === 'US' ? '미국주식' : '암호화폐'}
                    </button>
                  ))}
                </div>
              </div>
              
              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded mb-1"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <MarketOverview data={dashboardData?.marketOverview} />
              )}
            </div>

            {/* 인기 종목 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  🔥 인기 종목
                </h2>
                <div className="flex items-center gap-2">
                  {['1D', '1W', '1M'].map((timeframe) => (
                    <button
                      key={timeframe}
                      onClick={() => setSelectedTimeframe(timeframe)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        selectedTimeframe === timeframe
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {timeframe}
                    </button>
                  ))}
                </div>
              </div>
              
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-12"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <TrendingStocks 
                  assets={dashboardData?.topMovers || []}
                  timeframe={selectedTimeframe}
                />
              )}
            </div>

            {/* 퀵 차트 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                📈 차트
              </h2>
              <QuickChart />
            </div>
          </div>

          {/* 오른쪽 사이드바 */}
          <div className="space-y-6">
            {/* 실시간 암호화폐 가격 */}
            <LiveCryptoPrices />

            {/* 관심종목 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  ⭐ 관심종목
                </h3>
                <Link 
                  href="/watchlist"
                  className="text-sm text-primary-500 hover:text-primary-600"
                >
                  전체보기
                </Link>
              </div>
              
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex justify-between animate-pulse">
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-12"></div>
                      </div>
                      <div className="text-right">
                        <div className="h-4 bg-gray-200 rounded w-12 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-8"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <WatchlistPanel watchlist={dashboardData?.userWatchlist || []} />
              )}
            </div>

            {/* 커뮤니티 피드 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  💬 커뮤니티
                </h3>
                <Link 
                  href="/community"
                  className="text-sm text-primary-500 hover:text-primary-600"
                >
                  전체보기
                </Link>
              </div>
              
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <CommunityFeed posts={dashboardData?.recentPosts || []} />
              )}
            </div>

            {/* 퀴즈 게임 링크 */}
            <div className="bg-gradient-to-r from-primary-500 to-blue-600 rounded-lg p-6 text-white">
              <div className="text-center">
                <div className="text-3xl mb-2">🎮</div>
                <h3 className="text-lg font-semibold mb-2">
                  차트 퀴즈 게임
                </h3>
                <p className="text-sm text-primary-100 mb-4">
                  차트 방향을 맞춰보고 점수를 획득하세요!
                </p>
                <Link
                  href="/play"
                  className="inline-block bg-white text-primary-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  지금 플레이
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
