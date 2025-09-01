'use client'

import { useTranslation } from 'react-i18next'
import { LeaderboardEntry } from '@/lib/types'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  className?: string
}

const LeaderboardTable = ({ entries, className = '' }: LeaderboardTableProps) => {
  const { t } = useTranslation()

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return `#${rank}`
    }
  }

  const getRankClass = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-50 border-yellow-200'
      case 2: return 'bg-gray-50 border-gray-200'
      case 3: return 'bg-orange-50 border-orange-200'
      default: return 'bg-white border-gray-200'
    }
  }

  if (entries.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          No entries yet
        </h3>
        <p className="text-gray-600">
          Be the first to appear on the leaderboard!
        </p>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      <div className="bg-primary-500 text-white px-6 py-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          🏆 {t('leaderboard')} - {t('this_week')}
        </h2>
      </div>

      <div className="divide-y divide-gray-200">
        {entries.map((entry) => (
          <div 
            key={`${entry.rank}-${entry.handleOrAnon}`}
            className={`px-6 py-4 border-l-4 ${getRankClass(entry.rank)}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold min-w-[3rem] text-center">
                  {getRankIcon(entry.rank)}
                </div>
                <div>
                  <div className="font-semibold text-gray-800">
                    {entry.handleOrAnon}
                  </div>
                  <div className="text-sm text-gray-500">
                    {entry.attempts} {t('attempts')} • {entry.correctRate.toFixed(1)}% {t('accuracy')}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-primary-600">
                  {entry.scoreSum.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">
                  {t('points')}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 px-6 py-4 text-center">
        <p className="text-sm text-gray-600">
          Updated every minute • Top 100 players shown
        </p>
      </div>
    </div>
  )
}

export default LeaderboardTable
