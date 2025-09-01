'use client'

import { useTranslation } from 'react-i18next'
import { PostAnswerResponse } from '@/lib/types'
import ScoreBadge from './ScoreBadge'

interface ResultCardProps {
  result: PostAnswerResponse
  className?: string
}

const ResultCard = ({ result, className = '' }: ResultCardProps) => {
  const { t } = useTranslation()

  const shareScore = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('title'),
          text: `I scored ${result.score} points on BuyOrSell Quiz! ${result.isCorrect ? '✅' : '❌'}`,
          url: `${window.location.origin}/result/${result.attemptId}`,
        })
      } catch (error) {
        // Fallback to clipboard
        copyToClipboard()
      }
    } else {
      copyToClipboard()
    }
  }

  const copyToClipboard = () => {
    const text = `I scored ${result.score} points on BuyOrSell Quiz! ${result.isCorrect ? '✅' : '❌'} ${window.location.origin}/result/${result.attemptId}`
    navigator.clipboard.writeText(text).then(() => {
      // Could show a toast notification here
      console.log('Score copied to clipboard!')
    })
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <ScoreBadge 
        score={result.score}
        isCorrect={result.isCorrect}
        className="mb-6"
      />
      
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {result.isCorrect ? '🎉 Great job!' : '💪 Keep trying!'}
          </h3>
          <p className="text-gray-600">
            {result.isCorrect 
              ? "You correctly predicted the market direction!" 
              : "Market prediction is challenging. Practice makes perfect!"
            }
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={shareScore}
            className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-3 px-4 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            📤 {t('share_score')}
          </button>
          
          <button
            onClick={() => window.location.href = '/play'}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            🔄 {t('play_again')}
          </button>
        </div>

        <div className="text-center">
          <a 
            href="/leaderboard"
            className="text-primary-500 hover:text-primary-600 font-medium text-sm"
          >
            📊 {t('leaderboard')}
          </a>
        </div>
      </div>
    </div>
  )
}

export default ResultCard
