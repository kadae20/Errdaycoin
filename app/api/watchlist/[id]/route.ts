import { NextRequest, NextResponse } from 'next/server'
import { createDirectClient } from '@/lib/supabase/client'

const supabase = createDirectClient()

// 관심종목에서 제거
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const assetId = parseInt(params.id)

    if (isNaN(assetId)) {
      return NextResponse.json(
        { error: 'Invalid asset ID' },
        { status: 400 }
      )
    }

    // 관심종목에서 제거
    const { error } = await supabase
      .from('user_watchlist')
      .delete()
      .eq('user_id', user.id)
      .eq('asset_id', assetId)

    if (error) {
      console.error('Delete watchlist error:', error)
      return NextResponse.json(
        { error: 'Failed to remove from watchlist' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Watchlist DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
