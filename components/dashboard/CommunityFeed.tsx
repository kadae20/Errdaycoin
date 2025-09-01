'use client'

import { PostWithAuthor } from '@/lib/types/market'
import Link from 'next/link'

interface CommunityFeedProps {
  posts: PostWithAuthor[]
}

const CommunityFeed = ({ posts }: CommunityFeedProps) => {
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return '방금 전'
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`
    return `${Math.floor(diffInMinutes / 1440)}일 전`
  }

  const getPostTypeIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      'ANALYSIS': '📊',
      'NEWS': '📰',
      'DISCUSSION': '💬',
      'QUESTION': '❓',
    }
    return iconMap[type] || '💬'
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

  if (posts.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="text-3xl mb-2">💬</div>
        <p className="text-sm text-gray-500 mb-3">
          최근 게시글이 없습니다
        </p>
        <Link 
          href="/community"
          className="text-xs text-primary-500 hover:text-primary-600"
        >
          커뮤니티 둘러보기
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {posts.slice(0, 3).map((post) => (
        <Link
          key={post.id}
          href={`/community/post/${post.id}`}
          className="block p-3 rounded-lg hover:bg-gray-50 transition-colors group"
        >
          <div className="flex items-center gap-2 mb-2">
            <span 
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                getPostTypeColor(post.post_type)
              }`}
            >
              {getPostTypeIcon(post.post_type)}
              <span className="ml-1">
                {post.post_type === 'ANALYSIS' ? '분석' :
                 post.post_type === 'NEWS' ? '뉴스' :
                 post.post_type === 'DISCUSSION' ? '토론' : '질문'}
              </span>
            </span>
            
            {post.asset && (
              <span className="text-xs text-primary-600 font-medium">
                #{post.asset.symbol}
              </span>
            )}
          </div>
          
          <h4 className="font-medium text-gray-800 group-hover:text-primary-600 transition-colors mb-1 line-clamp-2">
            {post.title}
          </h4>
          
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
            {post.content}
          </p>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-3">
              <span>
                👤 {post.author.handle || '익명'}
              </span>
              <span>
                👍 {post.like_count}
              </span>
              <span>
                💬 {post.comment_count}
              </span>
            </div>
            <span>
              {formatTimeAgo(post.created_at)}
            </span>
          </div>
        </Link>
      ))}
      
      <div className="pt-2 border-t">
        <Link 
          href="/community"
          className="block text-center text-xs text-primary-500 hover:text-primary-600"
        >
          더 많은 게시글 보기 →
        </Link>
      </div>
    </div>
  )
}

export default CommunityFeed
