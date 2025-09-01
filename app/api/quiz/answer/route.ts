import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PostAnswerRequestSchema, PostAnswerResponseSchema } from '@/lib/types'
import { rateLimit, getClientIP } from '@/lib/utils/rate-limit'
import { calculateScore } from '@/lib/utils/scoring'
import { Database } from '@/lib/types/database'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request)
    const rateLimitResult = await rateLimit(
      clientIP,
      'quiz-answer',
      { windowMs: 60000, maxRequests: 15 }, // 15 requests per minute
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

    // Parse request body
    const body = await request.json()
    const validatedBody = PostAnswerRequestSchema.parse(body)

    // Get quiz from database
    const { data: quiz, error: quizError } = await supabase
      .from('quiz_bank')
      .select('*')
      .eq('id', validatedBody.quizId)
      .single()

    if (quizError || !quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    // Check if answer is correct
    const isCorrect = validatedBody.choice === quiz.answer
    
    // Calculate score
    const tookMs = validatedBody.tookMs || 30000 // Default to 30 seconds if not provided
    const score = calculateScore(isCorrect, tookMs, quiz.difficulty)

    // Get user ID from auth (if authenticated)
    const authHeader = request.headers.get('authorization')
    let userId: string | null = null
    
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const { data: { user } } = await supabase.auth.getUser(token)
        userId = user?.id || null
      } catch (error) {
        // Continue as anonymous user
        console.log('Auth error (continuing as anonymous):', error)
      }
    }

    // Save attempt to database
    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempt')
      .insert({
        user_id: userId,
        quiz_id: quiz.id,
        choice: validatedBody.choice,
        is_correct: isCorrect,
        score,
        took_ms: tookMs,
      })
      .select('id')
      .single()

    if (attemptError || !attempt) {
      console.error('Failed to save attempt:', attemptError)
      return NextResponse.json(
        { error: 'Failed to save attempt' },
        { status: 500 }
      )
    }

    const response = PostAnswerResponseSchema.parse({
      attemptId: attempt.id,
      isCorrect,
      score,
      reveal: quiz.answer_candles,
    })

    return NextResponse.json(response, {
      headers: {
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      },
    })
  } catch (error) {
    console.error('Quiz answer API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const runtime = 'edge'
