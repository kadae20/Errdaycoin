'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import LangSwitcher from '@/components/LangSwitcher'
import AuthButton from '@/components/AuthButton'
import PostCard from '@/components/community/PostCard'
import CreatePostModal from '@/components/community/CreatePostModal'
import { PostWithAuthor, GetCommunityPostsRequest } from '@/lib/types/market'
import { useAnalytics } from '@/lib/utils/analytics'

export default function CommunityPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedType, setSelectedType] = useState<'ALL' | 'ANALYSIS' | 'NEWS' | 'DISCUSSION' | 'QUESTION'>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  
  const { t } = useTranslation()
  const analytics = useAnalytics()

  // 게시글 목록 가져오기
  const { data: posts, isLoading, error, refetch } = useQuery({
    queryKey: ['community-posts', selectedType, searchTerm, page],
    queryFn: async (): Promise<{ posts: PostWithAuthor[], total: number }> => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })
      
      if (selectedType !== 'ALL') {
        params.append('type', selectedType)
      }
      
      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/community/posts?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch posts')
      }
      
      return response.json()
    },
    refetchInterval: 30000, // 30초마다 새로고침
  })

  useEffect(() => {
    analytics.page({ path: '/community', title: 'Community' })
  }, [analytics])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    refetch()
  }

  const postTypes = [
    { key: 'ALL', label: '전체', icon: '📝' },
    { key: 'ANALYSIS', label: '분석', icon: '📊' },
    { key: 'NEWS', label: '뉴스', icon: '📰' },
    { key: 'DISCUSSION', label: '토론', icon: '💬' },
    { key: 'QUESTION', label: '질문', icon: '❓' },
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
                <Link href="/community" className="text-primary-600 font-medium">
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
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              💬 커뮤니티
            </h1>
            <p className="text-gray-600">
              투자 아이디어를 공유하고 다른 투자자들과 소통해보세요
            </p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <span>✍️</span>
            글 작성하기
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* 메인 콘텐츠 */}
          <div className="flex-1">
            {/* 필터 및 검색 */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex flex-col lg:flex-row gap-4 justify-between">
                {/* 카테고리 필터 */}
                <div className="flex flex-wrap gap-2">
                  {postTypes.map((type) => (
                    <button
                      key={type.key}
                      onClick={() => {
                        setSelectedType(type.key)
                        setPage(1)
                      }}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedType === type.key
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span>{type.icon}</span>
                      {type.label}
                    </button>
                  ))}
                </div>

                {/* 검색 */}
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="제목 또는 내용 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-w-[250px]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors"
                  >
                    🔍
                  </button>
                </form>
              </div>
            </div>

            {/* 게시글 목록 */}
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-6 h-6 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <div className="text-6xl mb-4">😵</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  게시글을 불러올 수 없습니다
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
            ) : !posts || posts.posts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="text-6xl mb-6">📝</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  {searchTerm ? '검색 결과가 없습니다' : '아직 게시글이 없습니다'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm ? '다른 검색어로 시도해보세요' : '첫 번째 게시글을 작성해보세요!'}
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary"
                >
                  ✍️ 글 작성하기
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.posts.map((post) => (
                  <PostCard 
                    key={post.id} 
                    post={post}
                    onUpdate={() => refetch()}
                  />
                ))}
                
                {/* 페이지네이션 */}
                {posts.total > 20 && (
                  <div className="flex justify-center gap-2 mt-8">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      이전
                    </button>
                    
                    <span className="px-4 py-2 bg-primary-500 text-white rounded-lg">
                      {page}
                    </span>
                    
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page * 20 >= posts.total}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      다음
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 사이드바 */}
          <div className="lg:w-80 space-y-6">
            {/* 인기 태그 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                🏷️ 인기 태그
              </h3>
              <div className="flex flex-wrap gap-2">
                {['비트코인', '이더리움', '애플', '테슬라', '기술분석', '차트', '투자전략', '암호화폐'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSearchTerm(tag)
                      setPage(1)
                      refetch()
                    }}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            {/* 커뮤니티 가이드 */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">
                📋 커뮤니티 가이드
              </h3>
              <ul className="text-sm text-blue-700 space-y-2">
                <li>• 정확한 정보를 바탕으로 작성해주세요</li>
                <li>• 서로 존중하는 댓글 문화를 만들어요</li>
                <li>• 투자 권유보다는 정보 공유 위주로</li>
                <li>• 개인적인 욕설이나 비방은 금지입니다</li>
                <li>• 관련 종목을 태그로 표시해주세요</li>
              </ul>
            </div>

            {/* 최근 활동 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                ⚡ 최근 활동
              </h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div>새로운 게시글 {posts?.total || 0}개</div>
                <div>오늘 활성 사용자 247명</div>
                <div>이번 주 인기 태그: #비트코인</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 글 작성 모달 */}
      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            refetch()
          }}
        />
      )}
    </div>
  )
}
