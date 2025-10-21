'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from './providers'
import AuthModal from '@/components/AuthModal'
import BitgetBanner, { BitgetFloatingBanner } from '@/components/BitgetBanner'
import StructuredData from '@/components/StructuredData'
import { referralService } from '@/lib/services/referral-service'

export default function HomePageClient() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showAuthModal, setShowAuthModal] = useState(false)

  // 추천 코드 처리: 방문 시 저장, 로그인 후 적용
  const referralCode = searchParams.get('ref')

  // 방문 시 ref 코드 로컬 저장
  useEffect(() => {
    if (referralCode) {
      try {
        localStorage.setItem('errdaycoin_pending_ref', referralCode)
      } catch {}
    }
  }, [referralCode])

  // 로그인 완료 시 보류된 ref 처리
  useEffect(() => {
    if (!user) return
    try {
      const pending = localStorage.getItem('errdaycoin_pending_ref')
      if (pending) {
        handleReferralSignup(pending)
        localStorage.removeItem('errdaycoin_pending_ref')
      }
    } catch {}
  }, [user])

  // 로그인 후 게임 시작 처리
  useEffect(() => {
    if (user && showAuthModal) {
      setShowAuthModal(false)
      router.push('/play')
    }
  }, [user, showAuthModal, router])

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
    console.log('Start Game clicked, user:', user)
    if (user) {
      router.push('/play')
    } else {
      setShowAuthModal(true)
    }
  }

  return (
    <>
      <StructuredData />
      
      {/* Bitget Banner */}
      <BitgetBanner />
      
      {/* 전체 화면을 꽉 채우기 위해 고정 HEX 컬러 그라데이션 사용 */}
      <div className="min-h-screen w-screen bg-gradient-to-br from-[#1f1300] via-[#7a3e00] to-[#c25a00] relative overflow-hidden">

      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Crypto Chart Background Animation */}
        <div className="absolute inset-0 opacity-15">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-8 bg-orange-400 opacity-30 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        
        {/* Floating particles */}
        <div className="absolute inset-0">
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full opacity-20 animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center p-6">
        <div className="flex items-center space-x-4">
          <img src="/logo.jpg" alt="ErrdayCoin Logo" className="w-10 h-10 rounded-lg object-cover" />
          <span className="text-white text-xl font-bold">ErrdayCoin</span>
        </div>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-white text-sm">Welcome, {user.email}</span>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Main Content - 전체 화면 꽉 채우기 */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-4 w-full">
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
        
        {/* Game Modes - 숨김 처리 */}
        <div className="hidden">
          <h3 className="text-xl font-bold text-yellow-400 mb-4">🎮 Two Ways to Play</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-700 bg-opacity-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-green-400 mb-2">👤 Guest Mode</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• 1 free token to start</li>
                <li>• Game ends when token runs out</li>
                <li>• Watch ads to get more chances</li>
                <li>• No account required</li>
              </ul>
            </div>
            <div className="bg-gray-700 bg-opacity-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-blue-400 mb-2">🔐 Login Mode</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• 15 tokens daily</li>
                <li>• Progress saved</li>
                <li>• Real Trading 100x Leverage on Bitget</li>
                <li>• Invite friends for +3 tokens each</li>
              </ul>
            </div>
          </div>
        </div>
        
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

        {/* How It Works - 숨김 처리 */}
        <div className="hidden">
          <h3 className="text-lg font-bold text-yellow-400 mb-4">🎯 How It Works</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-300">
            <div className="text-center">
              <div className="text-2xl mb-2">📈</div>
              <div className="font-semibold text-white mb-1">1. Analyze Charts</div>
              <div>Study historical price data and make predictions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">⚡</div>
              <div className="font-semibold text-white mb-1">2. Place Trades</div>
              <div>Go long or short with up to 100x leverage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <div className="font-semibold text-white mb-1">3. See Results</div>
              <div>Check your PnL and learn from your trades</div>
            </div>
          </div>
        </div>

        {/* Features Section - 숨김 처리 */}
        <div className="hidden">
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl">
            <div className="bg-gray-800 bg-opacity-40 rounded-xl p-6">
              <h3 className="text-lg font-bold text-yellow-400 mb-3">
                🎮 Free Trading Simulator
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                Practice futures trading without risking real money. Learn leverage trading concepts with realistic market data.
              </p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Real Binance historical data</li>
                <li>• Up to 100x leverage simulation</li>
                <li>• Liquidation price calculation</li>
                <li>• Next-day PnL tracking</li>
              </ul>
            </div>
            
            <div className="bg-gray-800 bg-opacity-40 rounded-xl p-6">
              <h3 className="text-lg font-bold text-yellow-400 mb-3">
                🏆 Referral Rewards
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                Invite friends and earn rewards together. Both you and your friend get bonus tokens and daily limits.
              </p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• +3 retry tokens for both</li>
                <li>• +3 daily limit increase</li>
                <li>• Unique referral codes</li>
                <li>• Track your referrals</li>
              </ul>
            </div>
            
            <div className="bg-gray-800 bg-opacity-40 rounded-xl p-6">
              <h3 className="text-lg font-bold text-yellow-400 mb-3">
                📚 Educational Content
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                Learn about futures trading, leverage, and risk management through interactive gameplay.
              </p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Interactive tutorials</li>
                <li>• Real market scenarios</li>
                <li>• Risk management lessons</li>
                <li>• Trading psychology insights</li>
              </ul>
            </div>
            
            <div className="bg-gray-800 bg-opacity-40 rounded-xl p-6">
              <h3 className="text-lg font-bold text-yellow-400 mb-3">
                🔗 Real Trading Integration
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                Ready for real trading? Get started with Bitget using our referral link for fee discounts.
              </p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Bitget referral benefits</li>
                <li>• Fee discount rewards</li>
                <li>• Seamless transition</li>
                <li>• 100x leverage available</li>
              </ul>
            </div>
          </div>
        </div>
      </div>


      {/* Floating Bitget Banner */}
      <BitgetFloatingBanner />
      </div>

      {showAuthModal && (
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)}
          onGuestMode={() => {
            setShowAuthModal(false)
            router.push('/play')
          }}
        />
      )}
    </>
  )
}
