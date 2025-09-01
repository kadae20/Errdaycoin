import { QuizChoice, Candle } from '@/lib/types'

/**
 * Calculate the quiz answer based on price movement
 */
export function calculateQuizAnswer(
  previewCandles: Candle[],
  answerCandles: Candle[],
  threshold: number = 0.002 // 0.2%
): QuizChoice {
  if (previewCandles.length === 0 || answerCandles.length === 0) {
    return 'FLAT'
  }

  const startPrice = previewCandles[previewCandles.length - 1].c
  const endPrice = answerCandles[answerCandles.length - 1].c
  
  const priceChange = (endPrice - startPrice) / startPrice

  if (priceChange > threshold) {
    return 'UP'
  } else if (priceChange < -threshold) {
    return 'DOWN'
  } else {
    return 'FLAT'
  }
}

/**
 * Calculate quiz score based on correctness, speed, and difficulty
 */
export function calculateScore(
  isCorrect: boolean,
  tookMs: number,
  difficulty: number
): number {
  if (!isCorrect) {
    return 0
  }

  // Base score for correct answer
  const baseScore = 100

  // Speed bonus: up to 50 points for faster answers
  // Assume 30 seconds is max time, linear scale
  const maxTimeMs = 30000
  const speedBonus = Math.max(0, Math.min(50, 50 * (1 - tookMs / maxTimeMs)))

  // Difficulty multiplier
  const difficultyMultiplier = 1 + 0.25 * (difficulty - 1)

  const finalScore = Math.round((baseScore + speedBonus) * difficultyMultiplier)
  
  return Math.max(0, finalScore)
}

/**
 * Calculate difficulty based on candle volatility
 */
export function calculateDifficulty(candles: Candle[]): number {
  if (candles.length < 2) {
    return 1
  }

  // Calculate price volatility (standard deviation of returns)
  const returns = []
  for (let i = 1; i < candles.length; i++) {
    const ret = (candles[i].c - candles[i - 1].c) / candles[i - 1].c
    returns.push(ret)
  }

  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length
  const volatility = Math.sqrt(variance)

  // Calculate wick ratio (measure of indecision)
  const avgWickRatio = candles.reduce((sum, candle) => {
    const bodySize = Math.abs(candle.c - candle.o)
    const totalRange = candle.h - candle.l
    const wickRatio = totalRange > 0 ? 1 - (bodySize / totalRange) : 0
    return sum + wickRatio
  }, 0) / candles.length

  // Combine volatility and wick ratio to determine difficulty
  const volatilityScore = Math.min(3, volatility * 1000) // Scale volatility
  const wickScore = avgWickRatio * 2 // Scale wick ratio
  
  const combinedScore = (volatilityScore + wickScore) / 2

  if (combinedScore < 0.5) return 1
  if (combinedScore < 1.5) return 2
  return 3
}
