'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { CreatePostRequest, Asset, PostType } from '@/lib/types/market'
import { createClient } from '@/lib/supabase/client'

interface CreatePostModalProps {
  onClose: () => void
  onSuccess: () => void
}

const CreatePostModal = ({ onClose, onSuccess }: CreatePostModalProps) => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [postType, setPostType] = useState<PostType>('DISCUSSION')
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [assetSearch, setAssetSearch] = useState('')
  
  const supabase = createClient()

  // 자산 검색
  const { data: searchResults } = useQuery({
    queryKey: ['asset-search-community', assetSearch],
    queryFn: async (): Promise<Asset[]> => {
      if (!assetSearch) return []
      
      const { data, error } = await supabase
        .from('asset')
        .select('*')
        .eq('is_active', true)
        .or(`symbol.ilike.%${assetSearch}%,name.ilike.%${assetSearch}%,name_ko.ilike.%${assetSearch}%`)
        .limit(10)
      
      if (error) throw error
      return data || []
    },
    enabled: assetSearch.length > 0,
  })

  // 게시글 작성
  const createPostMutation = useMutation({
    mutationFn: async (request: CreatePostRequest) => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('로그인이 필요합니다')
      }

      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create post')
      }

      return response.json()
    },
    onSuccess: () => {
      onSuccess()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 입력해주세요')
      return
    }

    createPostMutation.mutate({
      title: title.trim(),
      content: content.trim(),
      postType,
      assetId: selectedAsset?.id,
      tags: tags.length > 0 ? tags : undefined,
    })
  }

  const addTag = () => {
    const tag = tagInput.trim()
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const postTypes: { key: PostType; label: string; icon: string; description: string }[] = [
    { key: 'DISCUSSION', label: '토론', icon: '💬', description: '자유로운 의견 교환' },
    { key: 'ANALYSIS', label: '분석', icon: '📊', description: '차트 분석 및 기술적 분석' },
    { key: 'NEWS', label: '뉴스', icon: '📰', description: '시장 뉴스 및 정보 공유' },
    { key: 'QUESTION', label: '질문', icon: '❓', description: '궁금한 것을 물어보세요' },
  ]

  const getAssetIcon = (symbol: string, logoUrl?: string | null) => {
    if (logoUrl) {
      return (
        <img 
          src={logoUrl} 
          alt={symbol}
          className="w-6 h-6 rounded-full"
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
      <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-xs font-medium">
        {iconMap[symbol] || symbol.charAt(0)}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            ✍️ 새 게시글 작성
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 게시글 유형 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              게시글 유형
            </label>
            <div className="grid grid-cols-2 gap-3">
              {postTypes.map((type) => (
                <button
                  key={type.key}
                  type="button"
                  onClick={() => setPostType(type.key)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    postType === type.key
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span>{type.icon}</span>
                    <span className="font-medium">{type.label}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {type.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 관련 종목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              관련 종목 (선택사항)
            </label>
            
            {selectedAsset ? (
              <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    {getAssetIcon(selectedAsset.symbol, selectedAsset.logo_url)}
                    <div className="hidden w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                      {selectedAsset.symbol.charAt(0)}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-sm">{selectedAsset.symbol}</div>
                    <div className="text-xs text-gray-500">
                      {selectedAsset.name_ko || selectedAsset.name}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAsset(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  제거
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  placeholder="종목명 또는 심볼 검색..."
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                
                {searchResults && searchResults.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded-lg max-h-32 overflow-y-auto">
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() => {
                          setSelectedAsset(result)
                          setAssetSearch('')
                        }}
                        className="w-full p-2 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0"
                      >
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            {getAssetIcon(result.symbol, result.logo_url)}
                            <div className="hidden w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                              {result.symbol.charAt(0)}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-sm">{result.symbol}</div>
                            <div className="text-xs text-gray-500">
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

          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제목 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="게시글 제목을 입력하세요"
              maxLength={200}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
            <div className="text-xs text-gray-500 mt-1">
              {title.length}/200자
            </div>
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              내용 *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="게시글 내용을 입력하세요"
              rows={8}
              maxLength={5000}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              required
            />
            <div className="text-xs text-gray-500 mt-1">
              {content.length}/5000자
            </div>
          </div>

          {/* 태그 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              태그 (최대 5개)
            </label>
            
            {/* 기존 태그 */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-primary-600 hover:text-primary-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            
            {/* 태그 입력 */}
            {tags.length < 5 && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                  placeholder="태그 입력 후 Enter"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors"
                >
                  추가
                </button>
              </div>
            )}
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !content.trim() || createPostMutation.isPending}
              className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createPostMutation.isPending ? '작성 중...' : '게시글 작성'}
            </button>
          </div>
        </form>

        {createPostMutation.error && (
          <div className="px-6 pb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="text-red-800 text-sm">
                {createPostMutation.error.message}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CreatePostModal
