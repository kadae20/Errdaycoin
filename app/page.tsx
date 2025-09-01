'use client'

import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import Link from 'next/link'
import LangSwitcher from '@/components/LangSwitcher'
import AuthButton from '@/components/AuthButton'
import { useAnalytics } from '@/lib/utils/analytics'
import StructuredData from '@/components/seo/StructuredData'

export default function HomePage() {
  const { t } = useTranslation()
  const analytics = useAnalytics()

  useEffect(() => {
    analytics.page({ path: '/', title: 'Home' })
  }, [analytics])

  return (
    <>
      <StructuredData />
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50">
        {/* Navigation */}
        <nav className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-2xl">📈</div>
                          <h1 className="text-xl font-bold text-gray-800">
              Errdaycoin
            </h1>
            </div>
            <div className="flex items-center gap-4">
              <AuthButton />
              <LangSwitcher />
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
              Ultimate Chart Game & Trading Simulator
            </h2>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
              Master trading with <strong>Errdaycoin</strong>! Play the ultimate <strong>chart game</strong>, 
              <strong>stock trading simulator</strong>, <strong>crypto trading game</strong>, and <strong>forex simulator</strong>. 
              <strong>Learn day trading</strong>, <strong>practice trading stocks</strong> with our 
              <strong>virtual trading platform</strong>!
            </p>

            {/* Key Features */}
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Real-Time Charts
                </h3>
                <p className="text-gray-600">
                  Live cryptocurrency data from Binance. Practice with real market movements and candlestick patterns.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="text-4xl mb-4">🎮</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Trading Games
                </h3>
                <p className="text-gray-600">
                  Stock trading game, crypto trading game, forex simulator, paper trading app, and buy or sell game challenges.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  AI Analysis
                </h3>
                <p className="text-gray-600">
                  Advanced pattern recognition and market sentiment analysis to improve your trading skills.
                </p>
              </div>
            </div>

            {/* Game Preview */}
            <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
              <h3 className="text-2xl font-semibold text-gray-800 mb-6">
                How to Play the Chart Game
              </h3>
              <div className="grid md:grid-cols-3 gap-6 text-left">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Study the Chart</h4>
                    <p className="text-gray-600 text-sm">Analyze real candlestick patterns</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Predict Direction</h4>
                    <p className="text-gray-600 text-sm">Choose UP, DOWN, or FLAT</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">See Results</h4>
                    <p className="text-gray-600 text-sm">Get scored and climb the leaderboard</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="mb-12 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-3 bg-primary-500 hover:bg-primary-600 text-white text-xl font-bold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <span>📊</span>
                Start Trading Simulator
              </Link>
              
              <Link
                href="/play"
                className="inline-flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white text-xl font-bold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <span>🎮</span>
                Play Chart Game
              </Link>
            </div>

            {/* SEO Keywords Section */}
            <div className="bg-white rounded-lg shadow-lg p-8 mb-12 text-left">
              <h3 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
                Why Choose Errdaycoin?
              </h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">🎯 Perfect for Beginners</h4>
                  <ul className="text-gray-600 space-y-2 text-sm">
                    <li>• <strong>Stock trading game</strong> with no real money risk</li>
                    <li>• <strong>Paper trading web</strong> for safe practice</li>
                    <li>• <strong>Learn day trading</strong> with interactive tutorials</li>
                    <li>• <strong>Practice trading stocks</strong> step-by-step</li>
                    <li>• <strong>Buy or sell game</strong> challenges</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">⚡ Advanced Features</h4>
                  <ul className="text-gray-600 space-y-2 text-sm">
                    <li>• <strong>Crypto trading game</strong> with major coins</li>
                    <li>• <strong>Forex trading simulator</strong> with live data</li>
                    <li>• <strong>Futures trading simulator</strong> for advanced users</li>
                    <li>• <strong>Virtual trading platform</strong> with AI analysis</li>
                    <li>• <strong>Trading challenge</strong> competitions</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-gray-500">
              <div className="flex items-center gap-2">
                <span>🔒</span>
                <span className="text-sm">100% Free</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📱</span>
                <span className="text-sm">Mobile Friendly</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🌍</span>
                <span className="text-sm">6 Languages</span>
              </div>
              <div className="flex items-center gap-2">
                <span>⚡</span>
                <span className="text-sm">Real-Time Data</span>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-8 text-center text-gray-600 border-t">
          <div className="flex flex-wrap justify-center gap-6 mb-4">
            <Link href="/legal" className="hover:text-gray-800 transition-colors">
              Legal & Disclaimer
            </Link>
            <Link href="/community" className="hover:text-gray-800 transition-colors">
              Community
            </Link>
            <Link href="/analysis" className="hover:text-gray-800 transition-colors">
              AI Analysis
            </Link>
          </div>
          <p className="text-sm">
            © 2024 Errdaycoin. Educational trading game for learning purposes only.
            Not financial advice.
          </p>
        </footer>
      </div>
    </>
  )
}