'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ErrdayCoinGame from '@/components/ErrdayCoinGame'
import AuthModal from '@/components/AuthModal'
import { SidebarAd, BannerAd } from '@/components/GoogleAdSense'
import { useAuth } from '@/app/providers'
import { referralService } from '@/lib/services/referral-service'

export default function PlayPageClient() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isGuestMode, setIsGuestMode] = useState(false)

  // 게스트 모드 확인
  const mode = searchParams.get('mode')
  const referralCode = searchParams.get('ref')

  useEffect(() => {
    if (mode === 'guest') {
      setIsGuestMode(true)
    }
  }, [mode])

  // 추천 코드 처리
  useEffect(() => {
    if (user && referralCode) {
      handleReferralSignup(referralCode)
    }
  }, [user, referralCode])

  const handleReferralSignup = async (code: string) => {
    try {
      await referralService.handleReferralSignup(user!.id, code)
      // URL에서 ref 파라미터 제거
      const url = new URL(window.location.href)
      url.searchParams.delete('ref')
      router.replace(url.pathname)
      
      alert('Referral signup complete! Rewards have been distributed.')
    } catch (error) {
      console.error('Referral signup failed:', error)
    }
  }

  const handleShowAuth = () => {
    setShowAuthModal(true)
  }

  const handleGameComplete = () => {
    // 게임 완료 후 처리
    console.log('Game completed')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 배너 광고 */}
      <BannerAd className="w-full" />
      
      <div className="flex max-w-7xl mx-auto px-4 py-6">
        {/* 왼쪽 사이드바 광고 */}
        <div className="hidden lg:block w-48 mr-6">
          <SidebarAd className="sticky top-6" />
        </div>
        
        {/* 메인 게임 영역 */}
        <div className="flex-1">
          <ErrdayCoinGame 
            onShowAuth={handleShowAuth}
            onGameComplete={handleGameComplete}
            isGuestMode={isGuestMode}
          />
        </div>
        
        {/* 오른쪽 사이드바 광고 */}
        <div className="hidden lg:block w-48 ml-6">
          <SidebarAd className="sticky top-6" />
        </div>
      </div>
      
      {/* 하단 배너 광고 */}
      <BannerAd className="w-full" />
      
      {showAuthModal && (
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)}
          onGuestMode={() => {
            setShowAuthModal(false)
            setIsGuestMode(true)
          }}
        />
      )}
    </div>
  )
}
