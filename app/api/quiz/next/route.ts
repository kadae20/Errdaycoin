import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GetQuizRequestSchema, GetQuizResponseSchema } from '@/lib/types'
import { rateLimit, getClientIP } from '@/lib/utils/rate-limit'
import { Database } from '@/lib/types/database'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key"
    )
    // Rate limiting
    const clientIP = getClientIP(request)
    const rateLimitResult = await rateLimit(
      clientIP,
      'quiz-next',
      { windowMs: 60000, maxRequests: 30 }, // 30 requests per minute
      supabase
    )

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          }
        }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      difficulty: searchParams.get('difficulty'),
      lang: searchParams.get('lang'),
    }

    const validatedParams = GetQuizRequestSchema.parse(queryParams)

    // Get random quiz from database
    const { data: quizzes, error } = await supabase
      .from('quiz_bank')
      .select('id, symbol, timeframe, preview_candles, difficulty')
      .eq('difficulty', validatedParams.difficulty)
      .limit(10) // Get 10 and pick random to avoid predictability

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch quiz' },
        { status: 500 }
      )
    }

    if (!quizzes || quizzes.length === 0) {
      return NextResponse.json(
        { error: 'No quizzes available for this difficulty' },
        { status: 404 }
      )
    }

    // Pick random quiz
    const randomQuiz = quizzes[Math.floor(Math.random() * quizzes.length)]

    const response = GetQuizResponseSchema.parse({
      quiz: {
        id: (randomQuiz as any).id,
        symbol: (randomQuiz as any).symbol,
        timeframe: (randomQuiz as any).timeframe,
        preview: (randomQuiz as any).preview_candles,
        difficulty: (randomQuiz as any).difficulty,
      },
    })

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=60',
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      },
    })
  } catch (error) {
    console.error('Quiz next API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
