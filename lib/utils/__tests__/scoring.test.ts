import { calculateQuizAnswer, calculateScore, calculateDifficulty } from '../scoring'
import { Candle } from '@/lib/types'

describe('Scoring utilities', () => {
  const mockCandles: Candle[] = [
    { t: 1000, o: 100, h: 105, l: 95, c: 102, v: 1000 },
    { t: 2000, o: 102, h: 108, l: 98, c: 105, v: 1200 },
    { t: 3000, o: 105, h: 110, l: 100, c: 108, v: 1100 },
  ]

  describe('calculateQuizAnswer', () => {
    it('should return UP for significant price increase', () => {
      const previewCandles: Candle[] = [
        { t: 1000, o: 100, h: 105, l: 95, c: 100, v: 1000 },
      ]
      const answerCandles: Candle[] = [
        { t: 2000, o: 100, h: 110, l: 98, c: 110, v: 1200 },
      ]

      const result = calculateQuizAnswer(previewCandles, answerCandles, 0.05) // 5% threshold
      expect(result).toBe('UP')
    })

    it('should return DOWN for significant price decrease', () => {
      const previewCandles: Candle[] = [
        { t: 1000, o: 100, h: 105, l: 95, c: 100, v: 1000 },
      ]
      const answerCandles: Candle[] = [
        { t: 2000, o: 100, h: 102, l: 85, c: 90, v: 1200 },
      ]

      const result = calculateQuizAnswer(previewCandles, answerCandles, 0.05) // 5% threshold
      expect(result).toBe('DOWN')
    })

    it('should return FLAT for small price changes', () => {
      const previewCandles: Candle[] = [
        { t: 1000, o: 100, h: 105, l: 95, c: 100, v: 1000 },
      ]
      const answerCandles: Candle[] = [
        { t: 2000, o: 100, h: 102, l: 98, c: 101, v: 1200 },
      ]

      const result = calculateQuizAnswer(previewCandles, answerCandles, 0.05) // 5% threshold
      expect(result).toBe('FLAT')
    })

    it('should handle empty arrays gracefully', () => {
      const result = calculateQuizAnswer([], [], 0.002)
      expect(result).toBe('FLAT')
    })

    it('should use default threshold correctly', () => {
      const previewCandles: Candle[] = [
        { t: 1000, o: 100, h: 105, l: 95, c: 100, v: 1000 },
      ]
      const answerCandles: Candle[] = [
        { t: 2000, o: 100, h: 102, l: 98, c: 100.1, v: 1200 }, // 0.1% change
      ]

      const result = calculateQuizAnswer(previewCandles, answerCandles) // default 0.2%
      expect(result).toBe('FLAT')
    })
  })

  describe('calculateScore', () => {
    it('should return 0 for incorrect answers', () => {
      const score = calculateScore(false, 5000, 1)
      expect(score).toBe(0)
    })

    it('should return base score for correct answer with no speed bonus', () => {
      const score = calculateScore(true, 30000, 1) // 30 seconds, difficulty 1
      expect(score).toBe(100) // Base score only
    })

    it('should add speed bonus for fast answers', () => {
      const score = calculateScore(true, 1000, 1) // 1 second, difficulty 1
      expect(score).toBeGreaterThan(100)
      expect(score).toBeLessThanOrEqual(150) // Max base + speed bonus
    })

    it('should apply difficulty multiplier', () => {
      const score1 = calculateScore(true, 15000, 1) // Difficulty 1
      const score2 = calculateScore(true, 15000, 2) // Difficulty 2
      const score3 = calculateScore(true, 15000, 3) // Difficulty 3

      expect(score2).toBeGreaterThan(score1)
      expect(score3).toBeGreaterThan(score2)
    })

    it('should handle extreme cases', () => {
      // Very fast answer with high difficulty
      const highScore = calculateScore(true, 100, 3)
      expect(highScore).toBeGreaterThan(150)

      // Very slow answer
      const lowScore = calculateScore(true, 60000, 1) // 1 minute
      expect(lowScore).toBe(100) // Only base score, no speed bonus
    })

    it('should return integer scores', () => {
      const score = calculateScore(true, 7500, 2)
      expect(Number.isInteger(score)).toBe(true)
    })
  })

  describe('calculateDifficulty', () => {
    it('should return 1 for low volatility candles', () => {
      const lowVolCandles: Candle[] = [
        { t: 1000, o: 100, h: 100.5, l: 99.5, c: 100.1, v: 1000 },
        { t: 2000, o: 100.1, h: 100.6, l: 99.6, c: 100.2, v: 1000 },
        { t: 3000, o: 100.2, h: 100.7, l: 99.7, c: 100.3, v: 1000 },
      ]

      const difficulty = calculateDifficulty(lowVolCandles)
      expect(difficulty).toBe(1)
    })

    it('should return higher difficulty for high volatility candles', () => {
      const highVolCandles: Candle[] = [
        { t: 1000, o: 100, h: 120, l: 80, c: 110, v: 1000 },
        { t: 2000, o: 110, h: 130, l: 90, c: 95, v: 1000 },
        { t: 3000, o: 95, h: 115, l: 75, c: 105, v: 1000 },
      ]

      const difficulty = calculateDifficulty(highVolCandles)
      expect(difficulty).toBeGreaterThan(1)
    })

    it('should handle edge cases', () => {
      // Single candle
      const singleCandle = [{ t: 1000, o: 100, h: 105, l: 95, c: 102, v: 1000 }]
      expect(calculateDifficulty(singleCandle)).toBe(1)

      // Empty array
      expect(calculateDifficulty([])).toBe(1)
    })

    it('should return difficulty between 1 and 3', () => {
      const difficulty = calculateDifficulty(mockCandles)
      expect(difficulty).toBeGreaterThanOrEqual(1)
      expect(difficulty).toBeLessThanOrEqual(3)
    })

    it('should consider wick ratios in difficulty calculation', () => {
      // Candles with large wicks (indecision) should increase difficulty
      const longWickCandles: Candle[] = [
        { t: 1000, o: 100, h: 150, l: 50, c: 101, v: 1000 }, // Large wicks, small body
        { t: 2000, o: 101, h: 151, l: 51, c: 102, v: 1000 },
      ]

      const shortWickCandles: Candle[] = [
        { t: 1000, o: 100, h: 102, l: 98, c: 101, v: 1000 }, // Small wicks, similar body
        { t: 2000, o: 101, h: 103, l: 99, c: 102, v: 1000 },
      ]

      const longWickDifficulty = calculateDifficulty(longWickCandles)
      const shortWickDifficulty = calculateDifficulty(shortWickCandles)

      expect(longWickDifficulty).toBeGreaterThanOrEqual(shortWickDifficulty)
    })
  })
})
