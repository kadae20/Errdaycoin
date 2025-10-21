import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GetLeaderboardRequestSchema, GetLeaderboardResponseSchema } from '@/lib/types'
import { Database } from '@/lib/types/database'

// Vercel 함수 타임아웃 설정 (최대 30초)
export const maxDuration = 30

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient<Database>(
      "https://xuqwdkzpvowhigowecwj.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1cXdka3pwdm93aGlnb3dlY3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NDA3NDcsImV4cCI6MjA3MjIxNjc0N30.UcbPHTCxNC1Qc90Pzg8N2Nuh2SuiJ0FX2mVrdf8V4Y0"
    )
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      range: searchParams.get('range') || 'weekly',
    }

    const validatedParams = GetLeaderboardRequestSchema.parse(queryParams)

    // Get leaderboard data from the view
    const { data: leaderboard, error } = await supabase
      .from('weekly_leaderboard')
      .select('*')
      .limit(100)

    if (error) {
      console.error('Leaderboard query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard' },
        { status: 500 }
      )
    }

    // Transform data to match API schema
    const transformedData = (leaderboard || []).map(entry => ({
      rank: (entry as any).rank,
      handleOrAnon: (entry as any).handle_or_anon,
      scoreSum: (entry as any).score_sum,
      correctRate: (entry as any).correct_rate,
      attempts: (entry as any).attempts,
    }))

    const response = GetLeaderboardResponseSchema.parse(transformedData)

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('Leaderboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
