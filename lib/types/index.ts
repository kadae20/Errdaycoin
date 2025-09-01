import { z } from 'zod'

// Candle data structure
export const CandleSchema = z.object({
  t: z.number(), // timestamp
  o: z.number(), // open
  h: z.number(), // high
  l: z.number(), // low
  c: z.number(), // close
  v: z.number(), // volume
})

export type Candle = z.infer<typeof CandleSchema>

// Quiz choice enum
export const QuizChoiceSchema = z.enum(['UP', 'DOWN', 'FLAT'])
export type QuizChoice = z.infer<typeof QuizChoiceSchema>

// API request/response schemas
export const GetQuizRequestSchema = z.object({
  difficulty: z.coerce.number().min(1).max(3).default(1),
  lang: z.string().optional(),
})

export const GetQuizResponseSchema = z.object({
  quiz: z.object({
    id: z.number(),
    symbol: z.string(),
    timeframe: z.string(),
    preview: z.array(CandleSchema),
    difficulty: z.number(),
  }),
})

export const PostAnswerRequestSchema = z.object({
  quizId: z.number(),
  choice: QuizChoiceSchema,
  tookMs: z.number().optional(),
})

export const PostAnswerResponseSchema = z.object({
  attemptId: z.number(),
  isCorrect: z.boolean(),
  score: z.number(),
  reveal: z.array(CandleSchema),
})

export const GetLeaderboardRequestSchema = z.object({
  range: z.enum(['weekly']).default('weekly'),
})

export const LeaderboardEntrySchema = z.object({
  rank: z.number(),
  handleOrAnon: z.string(),
  scoreSum: z.number(),
  correctRate: z.number(),
  attempts: z.number(),
})

export const GetLeaderboardResponseSchema = z.array(LeaderboardEntrySchema)

// Types
export type GetQuizRequest = z.infer<typeof GetQuizRequestSchema>
export type GetQuizResponse = z.infer<typeof GetQuizResponseSchema>
export type PostAnswerRequest = z.infer<typeof PostAnswerRequestSchema>
export type PostAnswerResponse = z.infer<typeof PostAnswerResponseSchema>
export type GetLeaderboardRequest = z.infer<typeof GetLeaderboardRequestSchema>
export type GetLeaderboardResponse = z.infer<typeof GetLeaderboardResponseSchema>
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>

// Quiz data for seeding
export const QuizDataSchema = z.object({
  symbol: z.string(),
  timeframe: z.string(),
  candles: z.array(CandleSchema),
})

export type QuizData = z.infer<typeof QuizDataSchema>

// Result type for error handling
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E }

// Supported languages
export const SupportedLanguages = ['ko', 'en', 'es', 'ja'] as const
export type SupportedLanguage = typeof SupportedLanguages[number]
