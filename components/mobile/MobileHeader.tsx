'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import AuthButton from '@/components/AuthButton'
import MobileNavigation from './MobileNavigation'

interface MobileHeaderProps {
  title?: string
  showBack?: boolean
  actions?: React.ReactNode
}

const MobileHeader = ({ title, showBack = false, actions }: MobileHeaderProps) => {
  const pathname = usePathname()

  const getPageTitle = () => {
    if (title) return title
    
    switch (pathname) {
      case '/dashboard':
        return '대시보드'
      case '/watchlist':
        return '관심종목'
      case '/portfolio':
        return '포트폴리오'
      case '/community':
        return '커뮤니티'
      case '/analysis':
        return 'AI 분석'
      case '/play':
        return '퀴즈 게임'
      case '/legal':
        return '법적고지'
      default:
        if (pathname.startsWith('/result/')) return '퀴즈 결과'
        if (pathname.startsWith('/community/post/')) return '게시글'
        return 'AlphaSquare'
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 py-3">
        {/* 왼쪽 영역 */}
        <div className="flex items-center gap-3">
          {showBack ? (
            <button
              onClick={() => window.history.back()}
              className="p-2 -ml-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ← 뒤로
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <MobileNavigation />
              
              {/* 로고 (홈이 아닐 때만) */}
              {pathname !== '/dashboard' && (
                <Link href="/dashboard" className="flex items-center gap-2">
                  <div className="text-xl">📈</div>
                  <h1 className="text-lg font-bold text-gray-800">
                    AlphaSquare
                  </h1>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* 중앙 제목 */}
        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold text-gray-800 truncate">
            {getPageTitle()}
          </h1>
        </div>

        {/* 오른쪽 영역 */}
        <div className="flex items-center gap-2">
          {actions}
          
          {/* 기본 액션들 */}
          <div className="flex items-center gap-1">
            <AuthButton />
          </div>
        </div>
      </div>
    </header>
  )
}

export default MobileHeader
