'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ChartPreview from '@/components/ChartPreview'
import Countdown from '@/components/Countdown'
import ChoiceButtons from '@/components/ChoiceButtons'
import ResultCard from '@/components/ResultCard'
import LangSwitcher from '@/components/LangSwitcher'
import AuthButton from '@/components/AuthButton'
import { GetQuizResponse, PostAnswerRequest, PostAnswerResponse, QuizChoice } from '@/lib/types'
import { useAnalytics } from '@/lib/utils/analytics'

export default function PlayPage() {
  const [countdownComplete, setCountdownComplete] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [result, setResult] = useState<PostAnswerResponse | null>(null)
  const [showReveal, setShowReveal] = useState(false)
  const { t } = useTranslation()
  const router = useRouter()
  const analytics = useAnalytics()

  // Fetch quiz data
  const { data: quizData, isLoading: isLoadingQuiz, error: quizError, refetch } = useQuery({
    queryKey: ['quiz', 'next'],
    queryFn: async (): Promise<GetQuizResponse> => {
      const response = await fetch('/api/quiz/next?difficulty=1')
      if (!response.ok) {
        throw new Error('Failed to fetch quiz')
      }
      return response.json()
    },
    staleTime: 0, // Always fetch fresh quiz
  })

  // Submit answer mutation
  const answerMutation = useMutation({
    mutationFn: async (request: PostAnswerRequest): Promise<PostAnswerResponse> => {
      const response = await fetch('/api/quiz/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })
      
      if (!response.ok) {
        throw new Error('Failed to submit answer')
      }
      
      return response.json()
    },
    onSuccess: (data) => {
      setResult(data)
      setTimeout(() => {
        setShowReveal(true)
      }, 1000)
      
      analytics.track({
        name: 'quiz_answered',
        properties: {
          quizId: quizData?.quiz.id,
          isCorrect: data.isCorrect,
          score: data.score,
        },
      })
    },
  })

  useEffect(() => {
    analytics.page({ path: '/play', title: 'Play Quiz' })
  }, [analytics])

  const handleCountdownComplete = () => {
    setCountdownComplete(true)
    setStartTime(Date.now())
  }

  const handleChoice = (choice: QuizChoice) => {
    if (!quizData || !startTime) return

    const tookMs = Date.now() - startTime

    answerMutation.mutate({
      quizId: quizData.quiz.id,
      choice,
      tookMs,
    })
  }

  const resetQuiz = () => {
    setCountdownComplete(false)
    setStartTime(null)
    setResult(null)
    setShowReveal(false)
    refetch()
  }

  const navigateToResult = () => {
    if (result) {
      router.push(`/result/${result.attemptId}`)
    }
  }

  if (quizError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😵</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Oops! Something went wrong
          </h2>
          <p className="text-gray-600 mb-6">
            Failed to load quiz. Please try again.
          </p>
          <button
            onClick={() => refetch()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    )
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
          {isLoadingQuiz ? (
            <div className="text-center py-12">
              <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">{t('loading')}</p>
            </div>
          ) : quizData ? (
            <div className="space-y-8">
              {/* Chart */}
              <div className="card">
                <ChartPreview
                  previewCandles={quizData.quiz.preview}
                  revealCandles={showReveal ? result?.reveal : undefined}
                  symbol={quizData.quiz.symbol}
                />
              </div>

              {/* Game State */}
              {!result ? (
                <div className="space-y-6">
                  {/* Countdown */}
                  {!countdownComplete && (
                    <div className="card">
                      <Countdown
                        duration={5}
                        onComplete={handleCountdownComplete}
                      />
                    </div>
                  )}

                  {/* Choice Buttons */}
                  <div className="card">
                    <ChoiceButtons
                      disabled={!countdownComplete || answerMutation.isPending}
                      onChoice={handleChoice}
                    />
                    
                    {answerMutation.isPending && (
                      <div className="text-center mt-4">
                        <div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
                        <p className="text-gray-600 mt-2">Submitting answer...</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Result */
                <div className="space-y-6">
                  <ResultCard result={result} />
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={resetQuiz}
                      className="btn-primary"
                    >
                      🔄 {t('next_quiz')}
                    </button>
                    
                    <button
                      onClick={navigateToResult}
                      className="btn-secondary"
                    >
                      📊 View Details
                    </button>
                    
                    <Link href="/leaderboard" className="btn-secondary text-center">
                      🏆 {t('leaderboard')}
                    </Link>
                  </div>
                </div>
              )}

              {/* Game Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                  <span>ℹ️</span>
                  <span className="font-semibold">How to Play</span>
                </div>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>1. Wait for the 5-second countdown to finish</p>
                  <p>2. Predict if the price will go UP, DOWN, or stay FLAT</p>
                  <p>3. Faster and more accurate answers earn higher scores!</p>
                  <p>4. Login to save your score and appear on the leaderboard</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  )
}
