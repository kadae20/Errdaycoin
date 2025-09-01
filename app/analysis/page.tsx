'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import LangSwitcher from '@/components/LangSwitcher'
import AuthButton from '@/components/AuthButton'
import AIAnalysisCard from '@/components/analysis/AIAnalysisCard'
import AssetAnalysisChart from '@/components/analysis/AssetAnalysisChart'
import TechnicalIndicators from '@/components/analysis/TechnicalIndicators'
import { AIAnalysis, Asset } from '@/lib/types/market'
import { useAnalytics } from '@/lib/utils/analytics'

export default function AnalysisPage() {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [analysisType, setAnalysisType] = useState<'TECHNICAL' | 'SENTIMENT' | 'PATTERN'>('TECHNICAL')
  
  const { t } = useTranslation()
  const analytics = useAnalytics()

  // AI 분석 결과 가져오기
  const { data: analyses, isLoading, error, refetch } = useQuery({
    queryKey: ['ai-analyses', selectedCategory, analysisType],
    queryFn: async (): Promise<{ analyses: (AIAnalysis & { asset: Asset })[], total: number }> => {
      const params = new URLSearchParams({
        category: selectedCategory,
        type: analysisType,
        limit: '20',
      })

      const response = await fetch(`/api/analysis?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch analyses')
      }
      
      return response.json()
    },
    refetchInterval: 300000, // 5분마다 새로고침
  })

  // 인기 자산 목록
  const { data: popularAssets } = useQuery({
    queryKey: ['popular-assets'],
    queryFn: async (): Promise<Asset[]> => {
      const response = await fetch('/api/assets/popular')
      if (!response.ok) {
        throw new Error('Failed to fetch popular assets')
      }
      return response.json()
    },
  })

  useEffect(() => {
    analytics.page({ path: '/analysis', title: 'AI Analysis' })
  }, [analytics])

  const categories = [
    { key: 'ALL', label: '전체', icon: '🌍' },
    { key: 'US', label: '미국주식', icon: '🇺🇸' },
    { key: 'CRYPTO', label: '암호화폐', icon: '₿' },
    { key: 'EU', label: '유럽', icon: '🇪🇺' },
    { key: 'ASIA', label: '아시아', icon: '🌏' },
  ]

  const analysisTypes = [
    { key: 'TECHNICAL', label: '기술적 분석', icon: '📊', description: '차트 패턴 및 지표 분석' },
    { key: 'SENTIMENT', label: '감정 분석', icon: '💭', description: '시장 심리 및 뉴스 분석' },
    { key: 'PATTERN', label: '패턴 분석', icon: '🔍', description: '가격 패턴 및 트렌드 분석' },
  ] as const

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
                <Link href="/portfolio" className="text-gray-600 hover:text-gray-800">
                  포트폴리오
                </Link>
                <Link href="/community" className="text-gray-600 hover:text-gray-800">
                  커뮤니티
                </Link>
                <Link href="/analysis" className="text-primary-600 font-medium">
                  AI 분석
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🤖 AI 투자 분석
          </h1>
          <p className="text-gray-600">
            인공지능이 분석한 시장 동향과 투자 아이디어를 확인하세요
          </p>
        </div>

        <div className="flex flex-col xl:flex-row gap-8">
          {/* 메인 콘텐츠 */}
          <div className="flex-1">
            {/* 필터 */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* 카테고리 */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">시장</h3>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category.key}
                        onClick={() => setSelectedCategory(category.key)}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedCategory === category.key
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <span>{category.icon}</span>
                        {category.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 분석 유형 */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">분석 유형</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysisTypes.map((type) => (
                      <button
                        key={type.key}
                        onClick={() => setAnalysisType(type.key)}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          analysisType === type.key
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <span>{type.icon}</span>
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 선택된 종목 분석 차트 */}
            {selectedAsset && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">
                    📈 {selectedAsset.symbol} 상세 분석
                  </h2>
                  <button
                    onClick={() => setSelectedAsset(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕ 닫기
                  </button>
                </div>
                
                <AssetAnalysisChart asset={selectedAsset} />
              </div>
            )}

            {/* AI 분석 결과 */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-800">
                    🤖 AI 분석 결과
                  </h2>
                  <button
                    onClick={() => refetch()}
                    className="text-sm text-primary-500 hover:text-primary-600 font-medium"
                  >
                    🔄 새로고침
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {analysisTypes.find(t => t.key === analysisType)?.description}
                </p>
              </div>

              <div className="p-6">
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                            <div>
                              <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                              <div className="h-3 bg-gray-200 rounded w-16"></div>
                            </div>
                          </div>
                          <div className="h-6 bg-gray-200 rounded w-16"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">😵</div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      분석 데이터를 불러올 수 없습니다
                    </h3>
                    <p className="text-gray-600 mb-4">
                      네트워크 연결을 확인하고 다시 시도해주세요.
                    </p>
                    <button
                      onClick={() => refetch()}
                      className="btn-primary"
                    >
                      새로고침
                    </button>
                  </div>
                ) : !analyses || analyses.analyses.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-6">🤖</div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      분석 결과가 없습니다
                    </h3>
                    <p className="text-gray-600">
                      선택한 조건에 맞는 AI 분석 결과를 찾을 수 없습니다.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analyses.analyses.map((analysis) => (
                      <AIAnalysisCard
                        key={analysis.id}
                        analysis={analysis}
                        onAssetClick={setSelectedAsset}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 사이드바 */}
          <div className="xl:w-80 space-y-6">
            {/* 인기 종목 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                🔥 AI 주목 종목
              </h3>
              
              {popularAssets ? (
                <div className="space-y-3">
                  {popularAssets.slice(0, 5).map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => setSelectedAsset(asset)}
                      className="w-full p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-800">
                            {asset.symbol}
                          </div>
                          <div className="text-sm text-gray-500">
                            {asset.name_ko || asset.name}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-600">
                            BUY
                          </div>
                          <div className="text-xs text-gray-500">
                            신뢰도 85%
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="animate-pulse p-3 border border-gray-200 rounded-lg">
                      <div className="flex justify-between">
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-20"></div>
                        </div>
                        <div className="text-right">
                          <div className="h-4 bg-gray-200 rounded w-12 mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 기술적 지표 요약 */}
            <TechnicalIndicators />

            {/* AI 분석 가이드 */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">
                🤖 AI 분석 가이드
              </h3>
              <ul className="text-sm text-blue-700 space-y-2">
                <li>• <strong>기술적 분석:</strong> 차트 패턴과 지표를 기반으로 한 분석</li>
                <li>• <strong>감정 분석:</strong> 뉴스와 소셜미디어 감정을 분석</li>
                <li>• <strong>패턴 분석:</strong> 과거 데이터에서 반복되는 패턴 발견</li>
                <li>• 신뢰도가 높을수록 정확도가 높습니다</li>
                <li>• 투자 결정은 여러 요소를 종합적으로 고려하세요</li>
              </ul>
            </div>

            {/* 면책조항 */}
            <div className="bg-yellow-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                ⚠️ 투자 유의사항
              </h3>
              <p className="text-sm text-yellow-700">
                AI 분석은 참고용이며, 투자 결정에 대한 책임은 투자자 본인에게 있습니다. 
                투자 전 충분한 검토를 하시기 바랍니다.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
