'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ChartPreview from '@/components/ChartPreview'
import ScoreBadge from '@/components/ScoreBadge'
import AuthButton from '@/components/AuthButton'
import { createClient } from '@/lib/supabase/client'
import { Candle } from '@/lib/types'
import { useAnalytics } from '@/lib/utils/analytics'

interface AttemptData {
  id: number
  choice: string
  is_correct: boolean
  score: number
  took_ms: number
  created_at: string
  quiz: {
    symbol: string
    timeframe: string
    preview_candles: Candle[]
    answer_candles: Candle[]
    answer: string
  }
}

export default function ResultPage() {
  const [attempt, setAttempt] = useState<AttemptData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { attemptId } = useParams()
  const analytics = useAnalytics()
  const supabase = createClient()

  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        const { data, error } = await supabase
          .from('quiz_attempt')
          .select(`
            id,
            choice,
            is_correct,
            score,
            took_ms,
            created_at,
            quiz_bank (
              symbol,
              timeframe,
              preview_candles,
              answer_candles,
              answer
            )
          `)
          .eq('id', attemptId)
          .single()

        if (error || !data) {
          setError('Attempt not found')
          return
        }

        const quizData = Array.isArray((data as any).quiz_bank) ? (data as any).quiz_bank[0] : (data as any).quiz_bank
        const attemptData: AttemptData = {
          id: (data as any).id,
          choice: (data as any).choice,
          is_correct: (data as any).is_correct,
          score: (data as any).score,
          took_ms: (data as any).took_ms,
          created_at: (data as any).created_at,
          quiz: {
            symbol: quizData.symbol,
            timeframe: quizData.timeframe,
            preview_candles: quizData.preview_candles,
            answer_candles: quizData.answer_candles,
            answer: quizData.answer,
          }
        }
        setAttempt(attemptData)

        analytics.page({ 
          path: `/result/${attemptId}`, 
          title: 'Result',
          properties: { attemptId, isCorrect: (data as any).is_correct }
        })
      } catch (err) {
        setError('Failed to load result')
        console.error('Error fetching attempt:', err)
      } finally {
        setLoading(false)
      }
    }

    if (attemptId) {
      fetchAttempt()
    }
  }, [attemptId, supabase, analytics])

  const shareResult = async () => {
    if (!attempt) return

    const shareText = `I scored ${attempt.score} points on BuyOrSell Quiz! ${attempt.is_correct ? '✅' : '❌'}`
    const shareUrl = `${window.location.origin}/result/${attempt.id}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ErrdayCoin - Crypto Futures Trading Game',
          text: shareText,
          url: shareUrl,
        })
        
        analytics.track({
          name: 'result_shared',
          properties: { attemptId: attempt.id, method: 'native' }
        })
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
        analytics.track({
          name: 'result_shared',
          properties: { attemptId: attempt.id, method: 'clipboard' }
        })
        // Could show a toast here
        alert('Result copied to clipboard!')
      } catch (error) {
        console.error('Failed to copy to clipboard:', error)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !attempt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😵</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Result not found
          </h2>
          <p className="text-gray-600 mb-6">
            {error || 'The result you are looking for does not exist.'}
          </p>
          <Link href="/play" className="btn-primary">
            Play New Quiz
          </Link>
        </div>
      </div>
    )
  }

  const formatTime = (ms: number) => {
    const seconds = (ms / 1000).toFixed(1)
    return `${seconds}s`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="text-2xl">📈</div>
              <h1 className="text-xl font-bold text-gray-800">
                ErrdayCoin
              </h1>
            </Link>
            <div className="flex items-center gap-4">
              <AuthButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Result Header */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Quiz Result
            </h2>
            <ScoreBadge 
              score={attempt.score}
              isCorrect={attempt.is_correct}
              showAnimation={false}
            />
          </div>

          {/* Chart with full reveal */}
          <div className="card">
            <ChartPreview
              previewCandles={attempt.quiz.preview_candles}
              revealCandles={attempt.quiz.answer_candles}
              symbol={attempt.quiz.symbol}
            />
          </div>

          {/* Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                📊 Quiz Details
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Symbol:</span>
                  <span className="font-medium">{attempt.quiz.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Timeframe:</span>
                  <span className="font-medium">{attempt.quiz.timeframe}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Correct Answer:</span>
                  <span className="font-medium">{attempt.quiz.answer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Your Choice:</span>
                  <span className={`font-medium ${attempt.is_correct ? 'text-success' : 'text-danger'}`}>
                    {attempt.choice}
                  </span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                ⏱️ Performance
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Response Time:</span>
                  <span className="font-medium">{formatTime(attempt.took_ms)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Result:</span>
                  <span className={`font-medium ${attempt.is_correct ? 'text-success' : 'text-danger'}`}>
                    {attempt.is_correct ? 'Correct' : 'Wrong'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Points Earned:</span>
                  <span className="font-bold text-primary-600">{attempt.score}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">
                    {new Date(attempt.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={shareResult}
              className="btn-primary"
            >
              📤 Share Score
            </button>
            
            <Link href="/play" className="btn-primary text-center">
              🎮 Play Again
            </Link>
            
            <Link href="/leaderboard" className="btn-secondary text-center">
              🏆 Leaderboard
            </Link>
          </div>

          {/* Educational Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-800 mb-2">
              <span>💡</span>
              <span className="font-semibold">Learning Tip</span>
            </div>
            <p className="text-sm text-blue-700">
              {attempt.is_correct 
                ? "Great prediction! Notice how the price movement matches your choice. Look for similar patterns in future quizzes."
                : "Don't worry! Market prediction is challenging even for professionals. Study the revealed pattern and try to identify what you might have missed."
              }
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
