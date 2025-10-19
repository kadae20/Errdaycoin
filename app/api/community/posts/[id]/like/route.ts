import { NextRequest, NextResponse } from 'next/server'
import { createDirectClient } from '@/lib/supabase/client'

// 좋아요 추가
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createDirectClient()
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

    const postId = parseInt(params.id)

    if (isNaN(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      )
    }

    // 이미 좋아요했는지 확인
    const { data: existingLike } = await supabase
      .from('post_like')
      .select('id')
      .eq('user_id', user.id)
      .eq('post_id', postId)
      .single()

    if (existingLike) {
      return NextResponse.json(
        { error: '이미 좋아요한 게시글입니다' },
        { status: 400 }
      )
    }

    // 좋아요 추가
    const { error: likeError } = await supabase
      .from('post_like')
      .insert({
        user_id: user.id,
        post_id: postId,
      } as any)

    if (likeError) {
      console.error('Like insert error:', likeError)
      return NextResponse.json(
        { error: 'Failed to add like' },
        { status: 500 }
      )
    }

    // 게시글 좋아요 수 업데이트
    await supabase.rpc('increment_post_like_count', { post_id: postId } as any)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Like POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 좋아요 제거
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createDirectClient()
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

    const postId = parseInt(params.id)

    if (isNaN(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      )
    }

    // 좋아요 제거
    const { error: deleteError } = await supabase
      .from('post_like')
      .delete()
      .eq('user_id', user.id)
      .eq('post_id', postId)

    if (deleteError) {
      console.error('Like delete error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to remove like' },
        { status: 500 }
      )
    }

    // 게시글 좋아요 수 업데이트
    await supabase.rpc('decrement_post_like_count', { post_id: postId } as any)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Like DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
