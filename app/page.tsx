'use client'

import { useState } from 'react'
import { useAuth } from './providers'
import AuthModal from '@/components/AuthModal'
import FuturesGame from '@/components/FuturesGameReal'

export default function HomePage() {
  const { user } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)

  // If user is logged in or game started, show the trading game
  if (user || gameStarted) {
    return <FuturesGame />
  }

  // Show ChartGame.com style landing page
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-green-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Chart Background Animation */}
        <div className="absolute inset-0 opacity-20">
          {/* Candlesticks */}
          <div className="flex items-end justify-center h-full space-x-2 px-20">
            {Array.from({ length: 40 }, (_, i) => (
              <div
                key={i}
                className={`w-3 ${Math.random() > 0.5 ? 'bg-green-400' : 'bg-red-400'} rounded-t`}
                style={{
                  height: `${Math.random() * 300 + 50}px`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
          
          {/* Floating Chart Lines */}
          <div className="absolute inset-0">
            {Array.from({ length: 20 }, (_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-green-400 rounded-full opacity-60 animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.3}s`
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Header */}
      <nav className="relative z-10 flex items-center justify-between p-6">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-3 h-8 bg-blue-500 rounded"></div>
            <div className="w-3 h-6 bg-green-500 rounded"></div>
            <div className="w-3 h-10 bg-purple-500 rounded"></div>
          </div>
          <span className="text-2xl font-bold text-white">ChartGame</span>
        </div>
        <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
          <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
        <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
          Learn How To Win
        </h1>
        
        <p className="text-xl text-gray-300 mb-4 max-w-2xl">
          Whether you're an expert or just starting, refine
        </p>
        <p className="text-xl text-gray-300 mb-4 max-w-2xl">
          your technical trading skills without risking your
        </p>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl">
          money.
        </p>
        
        <p className="text-lg text-gray-400 mb-4">
          Play on real intraday charts, monitor your
        </p>
        <p className="text-lg text-gray-400 mb-12">
          progress, and challenge your friends.
        </p>

        <button
          onClick={() => setShowAuthModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-12 rounded-lg text-xl transition-colors mb-8"
        >
          PLAY NOW
        </button>

        <p className="text-sm text-gray-500">
          No sign-up necessary, just pick a username and go.
        </p>
      </div>

      {/* Auth Modal with Blur Background */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Blurred Background */}
          <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>
          
          {/* Google Auth Modal */}
          <div className="relative bg-white rounded-2xl p-8 max-w-md mx-4 text-center">
            <div className="mb-6">
              <div className="text-4xl mb-4">🚀</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to ChartGame</h2>
              <p className="text-gray-600">
                Sign in with Google to start trading and save your progress
              </p>
            </div>
            
            <button
              onClick={() => {
                // For now, simulate login and start game
                setShowAuthModal(false)
                setGameStarted(true)
              }}
              className="w-full bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center space-x-3"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
            
            <button
              onClick={() => setShowAuthModal(false)}
              className="mt-4 text-gray-500 hover:text-gray-700 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}