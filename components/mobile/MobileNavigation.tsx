'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const MobileNavigation = () => {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard', label: '대시보드', icon: '📊' },
    { href: '/watchlist', label: '관심종목', icon: '⭐' },
    { href: '/portfolio', label: '포트폴리오', icon: '💼' },
    { href: '/community', label: '커뮤니티', icon: '💬' },
    { href: '/analysis', label: 'AI 분석', icon: '🤖' },
    { href: '/play', label: '퀴즈', icon: '🎮' },
  ]

  const isActive = (href: string) => {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
  }

  return (
    <>
      {/* 모바일 햄버거 메뉴 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="메뉴 열기"
      >
        <div className="w-6 h-6 flex flex-col justify-center items-center">
          <span className={`block h-0.5 w-6 bg-gray-600 transition-all duration-300 ${
            isOpen ? 'rotate-45 translate-y-1' : ''
          }`}></span>
          <span className={`block h-0.5 w-6 bg-gray-600 transition-all duration-300 mt-1 ${
            isOpen ? 'opacity-0' : ''
          }`}></span>
          <span className={`block h-0.5 w-6 bg-gray-600 transition-all duration-300 mt-1 ${
            isOpen ? '-rotate-45 -translate-y-1' : ''
          }`}></span>
        </div>
      </button>

      {/* 모바일 메뉴 오버레이 */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 모바일 사이드 메뉴 */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 md:hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6">
          {/* 로고 */}
          <div className="flex items-center gap-2 mb-8">
            <div className="text-2xl">📈</div>
            <h1 className="text-xl font-bold text-gray-800">AlphaSquare</h1>
          </div>

          {/* 네비게이션 메뉴 */}
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary-100 text-primary-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* 추가 메뉴 */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <Link
              href="/legal"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 hover:text-gray-800 rounded-lg transition-colors"
            >
              <span className="text-xl">📋</span>
              <span>법적고지</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default MobileNavigation
