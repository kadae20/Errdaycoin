'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { PostWithAuthor } from '@/lib/types/market'
import { createClient } from '@/lib/supabase/client'

interface PostCardProps {
  post: PostWithAuthor
  onUpdate: () => void
}

const PostCard = ({ post, onUpdate }: PostCardProps) => {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.like_count)
  const queryClient = useQueryClient()
  const supabase = createClient()

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return '방금 전'
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}일 전`
    return date.toLocaleDateString('ko-KR')
  }

  const getPostTypeIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      'ANALYSIS': '📊',
      'NEWS': '📰',
      'DISCUSSION': '💬',
      'QUESTION': '❓',
    }
    return iconMap[type] || '📝'
  }

  const getPostTypeLabel = (type: string) => {
    const labelMap: Record<string, string> = {
      'ANALYSIS': '분석',
      'NEWS': '뉴스',
      'DISCUSSION': '토론',
      'QUESTION': '질문',
    }
    return labelMap[type] || type
  }

  const getPostTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'ANALYSIS': 'bg-blue-100 text-blue-800',
      'NEWS': 'bg-green-100 text-green-800',
      'DISCUSSION': 'bg-gray-100 text-gray-800',
      'QUESTION': 'bg-yellow-100 text-yellow-800',
    }
    return colorMap[type] || 'bg-gray-100 text-gray-800'
  }

  // 좋아요 토글
  const likeMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('로그인이 필요합니다')
      }

      const response = await fetch(`/api/community/posts/${post.id}/like`, {
        method: isLiked ? 'DELETE' : 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('좋아요 처리에 실패했습니다')
      }

      return response.json()
    },
    onSuccess: () => {
      setIsLiked(!isLiked)
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1)
    },
    onError: (error) => {
      console.error('Like error:', error)
      alert('로그인이 필요합니다')
    }
  })

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-4">
        <span 
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            getPostTypeColor(post.post_type)
          }`}
        >
          {getPostTypeIcon(post.post_type)}
          <span className="ml-1">{getPostTypeLabel(post.post_type)}</span>
        </span>
        
        {post.asset && (
          <Link
            href={`/asset/${post.asset.symbol}`}
            className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs font-medium hover:bg-primary-200 transition-colors"
          >
            #{post.asset.symbol}
          </Link>
        )}
        
        {post.is_featured && (
          <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
            ⭐ 추천
          </span>
        )}
      </div>

      {/* 제목 */}
      <Link 
        href={`/community/post/${post.id}`}
        className="block hover:text-primary-600 transition-colors"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-3 line-clamp-2">
          {post.title}
        </h3>
      </Link>

      {/* 내용 미리보기 */}
      <p className="text-gray-600 mb-4 line-clamp-3">
        {truncateContent(post.content)}
      </p>

      {/* 태그 */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
            >
              #{tag}
            </span>
          ))}
          {post.tags.length > 3 && (
            <span className="text-xs text-gray-500">
              +{post.tags.length - 3}개 더
            </span>
          )}
        </div>
      )}

      {/* 푸터 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <span>👤</span>
            <span>{post.author.handle || '익명'}</span>
          </div>
          
          <button
            onClick={() => likeMutation.mutate()}
            disabled={likeMutation.isPending}
            className={`flex items-center gap-1 hover:text-red-500 transition-colors ${
              isLiked ? 'text-red-500' : ''
            }`}
          >
            <span>{isLiked ? '❤️' : '🤍'}</span>
            <span>{likeCount}</span>
          </button>
          
          <Link
            href={`/community/post/${post.id}`}
            className="flex items-center gap-1 hover:text-primary-500 transition-colors"
          >
            <span>💬</span>
            <span>{post.comment_count}</span>
          </Link>
          
          <div className="flex items-center gap-1">
            <span>👁️</span>
            <span>{post.view_count}</span>
          </div>
        </div>
        
        <div className="text-sm text-gray-500">
          {formatTimeAgo(post.created_at)}
        </div>
      </div>
    </div>
  )
}

export default PostCard
