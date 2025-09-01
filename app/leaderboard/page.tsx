'use client'

import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import Link from 'next/link'
import LeaderboardTable from '@/components/LeaderboardTable'
import LangSwitcher from '@/components/LangSwitcher'
import AuthButton from '@/components/AuthButton'
import { GetLeaderboardResponse } from '@/lib/types'
import { useAnalytics } from '@/lib/utils/analytics'

export default function LeaderboardPage() {
  const { t } = useTranslation()
  const analytics = useAnalytics()

  const { data: leaderboard, isLoading, error } = useQuery({
    queryKey: ['leaderboard', 'weekly'],
    queryFn: async (): Promise<GetLeaderboardResponse> => {
      const response = await fetch('/api/leaderboard?range=weekly')
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard')
      }
      return response.json()
    },
    refetchInterval: 60000, // Refetch every minute
  })

  useEffect(() => {
    analytics.page({ path: '/leaderboard', title: 'Leaderboard' })
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
              🏆 {t('leaderboard')}
            </h2>
            <p className="text-gray-600">
              Weekly rankings updated in real-time
            </p>
          </div>

          {/* Play CTA for anonymous users */}
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 mb-8">
            <div className="text-center">
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="text-xl font-semibold text-primary-800 mb-2">
                Ready to compete?
              </h3>
              <p className="text-primary-700 mb-4">
                {t('login_to_save')} and appear on this leaderboard!
              </p>
              <Link
                href="/play"
                className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                <span>🎮</span>
                {t('play_now')}
              </Link>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">{t('loading')}</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">😵</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Failed to load leaderboard
              </h3>
              <p className="text-gray-600 mb-6">
                Please try again later or check your connection.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Retry
              </button>
            </div>
          )}

          {/* Leaderboard */}
          {leaderboard && (
            <LeaderboardTable entries={leaderboard} />
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link href="/play" className="btn-primary text-center">
              🎮 {t('play_now')}
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary"
            >
              🔄 Refresh
            </button>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
            <div className="flex items-center gap-2 text-blue-800 mb-2">
              <span>ℹ️</span>
              <span className="font-semibold">How Rankings Work</span>
            </div>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Rankings reset every Monday at 00:00 UTC</p>
              <p>• Score is calculated based on correctness, speed, and difficulty</p>
              <p>• Faster correct answers earn bonus points</p>
              <p>• Must be logged in to appear on the leaderboard</p>
              <p>• Anonymous players show as "Player-XXXX"</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
