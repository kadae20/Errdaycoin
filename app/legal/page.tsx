'use client'

import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import Link from 'next/link'
import LangSwitcher from '@/components/LangSwitcher'
import AuthButton from '@/components/AuthButton'
import { useAnalytics } from '@/lib/utils/analytics'

export default function LegalPage() {
  const { t } = useTranslation()
  const analytics = useAnalytics()

  useEffect(() => {
    analytics.page({ path: '/legal', title: 'Legal Notice' })
  }, [analytics])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="text-2xl">📈</div>
              <h1 className="text-xl font-bold text-gray-800">
                {t('title')}
              </h1>
            </Link>
            <div className="flex items-center gap-4">
              <AuthButton />
              <LangSwitcher />
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              📋 {t('legal_notice')}
            </h2>
            <p className="text-gray-600">
              Important disclaimers and terms of use
            </p>
          </div>

          {/* Main Disclaimer */}
          <div className="bg-red-50 border-l-4 border-red-400 p-6 mb-8">
            <div className="flex items-center gap-2 text-red-800 mb-3">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-xl font-bold">
                {t('educational_only')}
              </h3>
            </div>
            <p className="text-red-700 text-lg font-medium">
              {t('not_financial_advice')}. This application is designed purely for educational and entertainment purposes.
            </p>
          </div>

          {/* Legal Content */}
          <div className="space-y-8">
            <section className="card">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                1. Educational Purpose Only
              </h3>
              <div className="text-gray-700 space-y-3">
                <p>
                  BuyOrSell Quiz is an educational game designed to help users learn about market patterns 
                  and chart reading through interactive gameplay. All content, including historical price 
                  data, charts, and quiz questions, is provided solely for educational purposes.
                </p>
                <p>
                  This application does <strong>NOT</strong>:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Provide investment advice or recommendations</li>
                  <li>Guarantee any investment outcomes</li>
                  <li>Involve real money or trading</li>
                  <li>Create any financial obligations</li>
                  <li>Constitute professional financial services</li>
                </ul>
              </div>
            </section>

            <section className="card">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                2. No Financial Advice
              </h3>
              <div className="text-gray-700 space-y-3">
                <p>
                  Nothing in this application should be construed as financial, investment, trading, 
                  or professional advice. The information provided is for general educational purposes 
                  only and should not be relied upon for making investment decisions.
                </p>
                <p>
                  Users should consult with qualified financial professionals before making any 
                  investment decisions. Past performance shown in historical data does not guarantee 
                  future results.
                </p>
              </div>
            </section>

            <section className="card">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                3. Data and Accuracy
              </h3>
              <div className="text-gray-700 space-y-3">
                <p>
                  While we strive to use accurate historical market data, we make no warranties 
                  regarding the completeness, accuracy, or timeliness of the data presented. 
                  Market data is used for educational simulation purposes only.
                </p>
                <p>
                  The quiz results and scoring system are designed for gamification and learning, 
                  not as indicators of real trading performance or market prediction ability.
                </p>
              </div>
            </section>

            <section className="card">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                4. Risk Warning
              </h3>
              <div className="text-gray-700 space-y-3">
                <p>
                  Trading and investing in financial markets involves substantial risk of loss. 
                  Markets can be volatile and unpredictable. Users should be aware that:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>All investments carry risk of loss</li>
                  <li>Past performance does not guarantee future results</li>
                  <li>Market conditions can change rapidly</li>
                  <li>Professional advice should be sought before trading</li>
                </ul>
              </div>
            </section>

            <section className="card">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                5. User Responsibilities
              </h3>
              <div className="text-gray-700 space-y-3">
                <p>
                  By using this application, users acknowledge that they:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Understand this is for educational purposes only</li>
                  <li>Will not rely on quiz results for investment decisions</li>
                  <li>Are responsible for their own investment choices</li>
                  <li>Will seek professional advice for financial matters</li>
                  <li>Use the application at their own risk</li>
                </ul>
              </div>
            </section>

            <section className="card">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                6. Privacy and Data
              </h3>
              <div className="text-gray-700 space-y-3">
                <p>
                  We collect minimal user data necessary for the application to function, including:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Email addresses for authentication (if you choose to log in)</li>
                  <li>Quiz attempt data and scores</li>
                  <li>Basic usage analytics</li>
                </ul>
                <p>
                  We do not sell or share personal data with third parties. Data is stored securely 
                  and used only to provide the educational gaming experience.
                </p>
              </div>
            </section>

            <section className="card">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                7. Limitation of Liability
              </h3>
              <div className="text-gray-700 space-y-3">
                <p>
                  The creators and operators of BuyOrSell Quiz shall not be liable for any direct, 
                  indirect, incidental, or consequential damages arising from the use of this 
                  application or any decisions made based on information provided herein.
                </p>
              </div>
            </section>

            <section className="card">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                8. Changes to Terms
              </h3>
              <div className="text-gray-700 space-y-3">
                <p>
                  We reserve the right to update these terms at any time. Continued use of the 
                  application constitutes acceptance of any changes.
                </p>
                <p className="text-sm text-gray-600">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </div>
            </section>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link href="/" className="btn-primary text-center">
              🏠 Back to Home
            </Link>
            <Link href="/play" className="btn-secondary text-center">
              🎮 {t('play_now')}
            </Link>
          </div>

          {/* Final Reminder */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8">
            <div className="flex items-center gap-2 text-yellow-800 mb-2">
              <span>💡</span>
              <span className="font-semibold">Remember</span>
            </div>
            <p className="text-yellow-700">
              This is a game designed to help you learn about market patterns. 
              Always consult with financial professionals before making real investment decisions.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
