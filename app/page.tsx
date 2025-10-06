'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from './providers'
import AuthModal from '@/components/AuthModal'
import BitgetBanner, { BitgetFloatingBanner } from '@/components/BitgetBanner'
import { referralService } from '@/lib/services/referral-service'

export default function HomePage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showAuthModal, setShowAuthModal] = useState(false)

  // 추천 코드 처리
  const referralCode = searchParams.get('ref')
  
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

  const startGame = () => {
    // 게스트 모드로 게임 시작 (로그인 없이)
    router.push('/play?mode=guest')
  }

  return (
    <>
      {/* Bitget Banner */}
      <BitgetBanner />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-yellow-900 to-orange-900 relative overflow-hidden">

      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Crypto Chart Background Animation */}
        <div className="absolute inset-0 opacity-15">
          {/* Bitcoin-style Candlesticks */}
          <div className="flex items-end justify-center h-full space-x-1 px-10">
            {Array.from({ length: 60 }, (_, i) => (
              <div
                key={i}
                className={`w-2 ${Math.random() > 0.6 ? 'bg-green-400' : 'bg-red-400'} rounded-sm opacity-70`}
                style={{
                  height: `${Math.random() * 400 + 50}px`,
                  animationDelay: `${i * 0.05}s`
                }}
              />
            ))}
          </div>
          
          {/* Floating Crypto Icons */}
          <div className="absolute inset-0">
            {Array.from({ length: 15 }, (_, i) => (
              <div
                key={i}
                className="absolute text-2xl opacity-30 animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: `${3 + Math.random() * 2}s`
                }}
              >
                {['₿', '⟠', '📈', '📊', '💎'][Math.floor(Math.random() * 5)]}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Header */}
      <nav className="relative z-10 flex items-center justify-between p-6">
        <div className="flex items-center space-x-3">
          <img 
            src="/logo.jpg" 
            alt="ErrdayCoin Logo" 
            className="w-12 h-12 rounded-lg object-cover"
          />
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-yellow-400">ErrdayCoin</span>
            <span className="text-xs text-gray-400">Futures Trading Simulator</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-300 hidden md:block">Free • No Download • Web-based</span>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
          Realistic
          <span className="text-yellow-400 block">Futures Trading Game</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-300 mb-6 max-w-3xl">
          Learn everything about leverage trading with historical charts
        </p>
        <p className="text-lg text-gray-400 mb-8 max-w-2xl">
          Experience position management and risk with up to 100x leverage
        </p>
        
        <div className="flex flex-wrap justify-center gap-4 mb-12 text-sm text-gray-300">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">✓</span>
            <span>Real Binance Charts</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">✓</span>
            <span>Up to 100x Leverage</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">✓</span>
            <span>Free Practice Trading</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">✓</span>
            <span>Friend Referral Rewards</span>
          </div>
        </div>

        <button
          onClick={startGame}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-4 px-12 rounded-xl text-xl transition-all transform hover:scale-105 mb-8 shadow-lg"
        >
          ⚡ Start Game
        </button>

        <p className="text-sm text-gray-500">
          Futures trading simulator enjoyed by thousands • Completely Free
        </p>
        
        {/* Features Section */}
        <div className="mt-16 max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-white mb-6">Why Choose ErrdayCoin?</h2>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="bg-gray-800 bg-opacity-50 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-yellow-400 mb-3">📊 Real Chart Data</h3>
              <p className="text-gray-300 text-sm">
                Practice with real historical charts from Binance. 
                Experience real market volatility without risk.
              </p>
            </div>
            <div className="bg-gray-800 bg-opacity-50 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-yellow-400 mb-3">⚡ 100x Leverage</h3>
              <p className="text-gray-300 text-sm">
                Learn futures trading with up to 100x leverage. 
                Master risk management and position sizing in a safe environment.
              </p>
            </div>
            <div className="bg-gray-800 bg-opacity-50 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-yellow-400 mb-3">🎯 Token Reward System</h3>
              <p className="text-gray-300 text-sm">
                Invite friends and earn tokens. 
                Get tokens to continue playing the game.
              </p>
          </div>
        </div>
      </div>

        {/* Educational Disclaimer */}
        <div className="mt-20 pt-8 border-t border-gray-800">
          <p className="text-center text-sm text-gray-500 max-w-2xl mx-auto">
            This is an educational simulation game. No real trading. No financial advice.
              </p>
            </div>
          </div>

      
      {/* Floating Banner */}
      <BitgetFloatingBanner />
        </div>
    
    {/* Auth Modal */}
    {showAuthModal && (
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      )}
  </>
  )
}