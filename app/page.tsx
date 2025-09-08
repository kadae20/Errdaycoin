'use client'

import { useState } from 'react'
import { useAuth } from './providers'
import AuthModal from '@/components/AuthModal'
import FuturesGame from '@/components/FuturesGame'

export default function HomePage() {
  const { user, logout } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  // If user is logged in, show the trading game
  if (user) {
    return (
      <div className="min-h-screen bg-gray-900">
        {/* Top bar with user info */}
        <div className="border-b border-gray-800 p-4">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-green-400">Errdaycoin</h1>
              <div className="text-sm text-gray-400">
                Welcome back, {user.email}
              </div>
            </div>
            <button
              onClick={logout}
              className="text-gray-400 hover:text-white text-sm"
            >
              Logout
            </button>
          </div>
        </div>
        
        <FuturesGame />
      </div>
    )
  }

  // Landing page for non-logged in users
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">📈</div>
              <h1 className="text-2xl font-bold text-green-400">
                Errdaycoin
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowAuthModal(true)}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-6xl font-bold text-white mb-8">
            Master the Art of
            <span className="text-green-400 block">Futures Trading</span>
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            Experience leveraged crypto futures trading with historical data. 
            Use tokens to advance time, manage risk, and avoid liquidation!
          </p>
          
          <button
            onClick={() => setShowAuthModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white text-lg px-12 py-4 rounded-lg font-semibold transition-colors mb-16 inline-flex items-center gap-3"
          >
            Start Trading Game
            <span className="text-2xl">🚀</span>
          </button>

          {/* Demo Chart Preview */}
          <div className="bg-gray-800 rounded-xl p-8 mb-16">
            <h3 className="text-2xl font-semibold mb-6 text-green-400">Futures Trading Chart</h3>
            <div className="bg-gray-900 rounded-lg p-6 relative overflow-hidden">
              {/* Simulated chart lines */}
              <div className="h-64 flex items-end justify-between gap-1">
                {Array.from({ length: 50 }, (_, i) => (
                  <div
                    key={i}
                    className="bg-green-400 opacity-70 rounded-t"
                    style={{
                      height: `${Math.random() * 200 + 20}px`,
                      width: '100%'
                    }}
                  />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-mono text-green-400 mb-2">
                    $52,847.32
                  </div>
                  <div className="text-green-400 text-sm">
                    +2.45% ↗
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-800 p-8 rounded-xl border border-gray-700">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-xl font-semibold mb-4 text-green-400">Leverage Trading</h3>
              <p className="text-gray-300">
                Trade with up to 50x leverage on Bitcoin and altcoins. 
                Experience the thrill of futures trading with risk management.
              </p>
            </div>
            
            <div className="bg-gray-800 p-8 rounded-xl border border-gray-700">
              <div className="text-4xl mb-4">🪙</div>
              <h3 className="text-xl font-semibold mb-4 text-green-400">Token System</h3>
              <p className="text-gray-300">
                Use game tokens to advance through historical candles. 
                Plan your moves strategically and time the market perfectly.
              </p>
            </div>
            
            <div className="bg-gray-800 p-8 rounded-xl border border-gray-700">
              <div className="text-4xl mb-4">💥</div>
              <h3 className="text-xl font-semibold mb-4 text-green-400">Avoid Liquidation</h3>
              <p className="text-gray-300">
                Manage your positions carefully to avoid liquidation. 
                Choose from various altcoins with different difficulty levels.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-20 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-12">
            <h3 className="text-3xl font-bold mb-4">Ready to Start Trading?</h3>
            <p className="text-lg mb-8 text-green-100">
              Join thousands of traders practicing their skills on Errdaycoin
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-white text-gray-900 text-lg px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Create Free Account
            </button>
          </div>
        </div>
      </main>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  )
}