import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/types/database'

// Vercel 함수 타임아웃 설정 (최대 30초)
export const maxDuration = 30

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient<Database>(
      "https://xuqwdkzpvowhigowecwj.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1cXdka3pwdm93aGlnb3dlY3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NDA3NDcsImV4cCI6MjA3MjIxNjc0N30.UcbPHTCxNC1Qc90Pzg8N2Nuh2SuiJ0FX2mVrdf8V4Y0"
    )
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // 사용자의 거래 내역 가져오기
    const { data: transactions, error } = await supabase
      .from('transaction_history')
      .select(`
        *,
        asset:asset_id(*)
      `)
      .eq('user_id', user.id)
      .order('executed_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Transactions query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      )
    }

    return NextResponse.json(transactions || [])

  } catch (error) {
    console.error('Transactions API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Edge runtime 제거 - Supabase 호환성을 위해
// export const runtime = 'edge'
