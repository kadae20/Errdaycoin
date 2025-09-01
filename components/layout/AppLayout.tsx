'use client'

import { usePathname } from 'next/navigation'
import MobileHeader from '@/components/mobile/MobileHeader'
import BottomTabBar from '@/components/mobile/BottomTabBar'
import Link from 'next/link'
import AuthButton from '@/components/AuthButton'
import LangSwitcher from '@/components/LangSwitcher'

interface AppLayoutProps {
  children: React.ReactNode
  title?: string
  showBack?: boolean
  actions?: React.ReactNode
}

const AppLayout = ({ children, title, showBack, actions }: AppLayoutProps) => {
  const pathname = usePathname()

  // 특별한 레이아웃이 필요한 페이지들 (퀴즈 게임, 결과 페이지 등)
  const specialLayoutPages = ['/play', '/result']
  const isSpecialLayout = specialLayoutPages.some(page => pathname.startsWith(page))

  // 랜딩 페이지
  const isLandingPage = pathname === '/'

  if (isLandingPage || isSpecialLayout) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 데스크톱 네비게이션 */}
      <nav className="hidden md:block bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="text-2xl">📈</div>
                <h1 className="text-xl font-bold text-gray-800">AlphaSquare</h1>
              </Link>
              
              <div className="flex items-center gap-6">
                <Link 
                  href="/dashboard" 
                  className={`transition-colors ${
                    pathname === '/dashboard' 
                      ? 'text-primary-600 font-medium' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  대시보드
                </Link>
                <Link 
                  href="/watchlist" 
                  className={`transition-colors ${
                    pathname.startsWith('/watchlist') 
                      ? 'text-primary-600 font-medium' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  관심종목
                </Link>
                <Link 
                  href="/portfolio" 
                  className={`transition-colors ${
                    pathname.startsWith('/portfolio') 
                      ? 'text-primary-600 font-medium' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  포트폴리오
                </Link>
                <Link 
                  href="/community" 
                  className={`transition-colors ${
                    pathname.startsWith('/community') 
                      ? 'text-primary-600 font-medium' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  커뮤니티
                </Link>
                <Link 
                  href="/analysis" 
                  className={`transition-colors ${
                    pathname.startsWith('/analysis') 
                      ? 'text-primary-600 font-medium' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  AI 분석
                </Link>
                <Link 
                  href="/play" 
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  🎮 퀴즈
                </Link>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* 검색 (일부 페이지에서만) */}
              {(pathname.startsWith('/community') || pathname.startsWith('/watchlist')) && (
                <div className="hidden lg:block">
                  <input
                    type="text"
                    placeholder="검색..."
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
                  />
                </div>
              )}
              
              <AuthButton />
              <LangSwitcher />
            </div>
          </div>
        </div>
      </nav>

      {/* 모바일 헤더 */}
      <div className="md:hidden">
        <MobileHeader 
          title={title} 
          showBack={showBack}
          actions={actions}
        />
      </div>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 pb-16 md:pb-0">
        {children}
      </main>

      {/* 모바일 하단 탭바 */}
      <BottomTabBar />
    </div>
  )
}

export default AppLayout
