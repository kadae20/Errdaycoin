import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GetLeaderboardRequestSchema, GetLeaderboardResponseSchema } from '@/lib/types'
import { Database } from '@/lib/types/database'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key"
)

export async function GET(request: NextRequest) {
  try {
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
