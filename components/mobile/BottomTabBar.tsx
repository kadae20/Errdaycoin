'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const BottomTabBar = () => {
  const pathname = usePathname()

  const tabs = [
    { href: '/dashboard', label: '홈', icon: '🏠', activeIcon: '🏠' },
    { href: '/watchlist', label: '관심', icon: '⭐', activeIcon: '⭐' },
    { href: '/portfolio', label: '포트폴리오', icon: '💼', activeIcon: '💼' },
    { href: '/community', label: '커뮤니티', icon: '💬', activeIcon: '💬' },
    { href: '/analysis', label: 'AI', icon: '🤖', activeIcon: '🤖' },
  ]

  const isActive = (href: string) => {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 md:hidden">
      <div className="flex">
        {tabs.map((tab) => {
          const active = isActive(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center py-2 px-1 transition-colors ${
                active 
                  ? 'text-primary-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="text-lg mb-1">
                {active ? tab.activeIcon : tab.icon}
              </div>
              <div className={`text-xs font-medium ${
                active ? 'text-primary-600' : 'text-gray-500'
              }`}>
                {tab.label}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default BottomTabBar
