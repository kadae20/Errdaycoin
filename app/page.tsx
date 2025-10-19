'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from './providers'
import AuthModal from '@/components/AuthModal'
import BitgetBanner, { BitgetFloatingBanner } from '@/components/BitgetBanner'
import StructuredData from '@/components/StructuredData'
import { referralService } from '@/lib/services/referral-service'

export default function HomePage() {
  const { user, logout } = useAuth()
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
    // 로그인 상태 확인
    if (!user) {
      // 로그인하지 않은 경우 로그인 모달 표시
      console.log('No user, showing auth modal')
      setShowAuthModal(true)
    } else {
      // 로그인한 경우 바로 게임 시작
      console.log('User exists, redirecting to game')
      router.push('/play')
    }
  }

  return (
    <>
      {/* Structured Data */}
      <StructuredData />
      
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
          {user ? (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-300">
                Welcome, {user.email?.split('@')[0] || 'User'}
              </span>
              <button
                onClick={logout}
                className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
              >
                Logout
              </button>
            </div>
          ) : (
            <span className="text-sm text-gray-300 hidden md:block">Free • No Download • Web-based</span>
          )}
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
        
        {/* Game Modes */}
        <div className="bg-gray-800 bg-opacity-60 rounded-xl p-6 mb-8 max-w-4xl">
          <h3 className="text-xl font-bold text-yellow-400 mb-4">🎮 Two Ways to Play</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-700 bg-opacity-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-green-400 mb-2">👤 Guest Mode</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• 1 free token to start</li>
                <li>• Game ends when token runs out</li>
                <li>• Watch ads to get more chances</li>
                <li>• Perfect for trying the game</li>
              </ul>
            </div>
            <div className="bg-gray-700 bg-opacity-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-blue-400 mb-2">🔐 Login Mode</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• 15 tokens + 15 daily limit</li>
                <li>• Progress saved permanently</li>
                <li>• Invite friends for +3 tokens each</li>
                <li>• Daily reset at midnight (US time)</li>
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

        {/* How It Works */}
        <div className="bg-gray-800 bg-opacity-40 rounded-xl p-6 mb-8 max-w-4xl">
          <h3 className="text-lg font-bold text-yellow-400 mb-4">🎯 How It Works</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-300">
            <div className="text-center">
              <div className="text-2xl mb-2">📈</div>
              <div className="font-semibold text-white mb-1">1. Analyze Charts</div>
              <div>Study historical price data and make predictions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">⚖️</div>
              <div className="font-semibold text-white mb-1">2. Set Position</div>
              <div>Choose Long/Short, leverage, and position size</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🎲</div>
              <div className="font-semibold text-white mb-1">3. Reveal Results</div>
              <div>See if your prediction was correct and earn rewards</div>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-500">
          Futures trading simulator enjoyed by thousands • Completely Free
        </p>
        
        {/* Features Section */}
        <div className="mt-16 max-w-6xl text-center">
          <h2 className="text-2xl font-bold text-white mb-8">🚀 Key Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
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
              <h3 className="text-lg font-bold text-yellow-400 mb-3">💰 Profit Persistence</h3>
              <p className="text-gray-300 text-sm">
                Login mode saves your profits permanently. 
                Build your virtual trading account over time.
              </p>
            </div>
            <div className="bg-gray-800 bg-opacity-50 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-yellow-400 mb-3">👥 Friend Referrals</h3>
              <p className="text-gray-300 text-sm">
                Invite friends and both get +3 tokens + 3 limit increase. 
                Win-win referral system for everyone.
              </p>
            </div>
            <div className="bg-gray-800 bg-opacity-50 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-yellow-400 mb-3">🔄 Daily Reset</h3>
              <p className="text-gray-300 text-sm">
                Get fresh tokens every day at midnight (US time). 
                Never run out of chances to practice.
              </p>
            </div>
            <div className="bg-gray-800 bg-opacity-50 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-yellow-400 mb-3">📱 Ad Rewards</h3>
              <p className="text-gray-300 text-sm">
                Watch short ads to get extra chances. 
                Both guest and login users can earn more tokens.
              </p>
            </div>
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
    
      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)}
          onGuestMode={() => {
            setShowAuthModal(false)
            router.push('/play?mode=guest')
          }}
        />
      )}
    </>
  )
}