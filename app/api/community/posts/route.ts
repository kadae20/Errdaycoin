import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { CreatePostRequestSchema } from '@/lib/types/market'
import { Database } from '@/lib/types/database'

// 게시글 목록 가져오기
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key"
    )
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const assetId = searchParams.get('assetId')

    const offset = (page - 1) * limit

    let query = supabase
      .from('community_post')
      .select(`
        *,
        author:user_id!inner(id, handle),
        asset:asset_id(*)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // 필터 적용
    if (type && type !== 'ALL') {
      query = query.eq('post_type', type)
    }

    if (assetId) {
      query = query.eq('asset_id', parseInt(assetId))
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
    }

    const { data: posts, error, count } = await query

    if (error) {
      console.error('Posts query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 500 }
      )
    }

    // 데이터 변환
    const postsWithAuthor = (posts || []).map(post => ({
      ...(post as any),
      author: {
        id: (post as any).author?.id || '',
        handle: (post as any).author?.handle || null
      }
    }))

    return NextResponse.json({
      posts: postsWithAuthor,
      total: count || 0,
      page,
      limit,
    })

  } catch (error) {
    console.error('Community posts GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 게시글 ?�성
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key"
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

    const body = await request.json()
    const { title, content, postType, assetId, tags } = CreatePostRequestSchema.parse(body)

    // 사용자 확인/생성
    const { data: existingUser } = await supabase
      .from('app_user')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!existingUser) {
      await supabase
        .from('app_user')
        .insert({ id: user.id } as any)
    }

    // 게시글 생성
    const { data: post, error: insertError } = await supabase
      .from('community_post')
      .insert({
        user_id: user.id,
        title,
        content,
        post_type: postType,
        asset_id: assetId || null,
        tags: tags || [],
      } as any)
      .select(`
        *,
        author:user_id!inner(id, handle),
        asset:asset_id(*)
      `)
      .single()

    if (insertError) {
      console.error('Post insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create post' },
        { status: 500 }
      )
    }

    // 데이터 변환
    const postWithAuthor = {
      ...(post as any),
      author: {
        id: (post as any).author?.id || user.id,
        handle: (post as any).author?.handle || null
      }
    }

    return NextResponse.json(postWithAuthor, { status: 201 })

  } catch (error) {
    console.error('Community posts POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Edge runtime 제거 - Supabase 호환성을 위해
// export const runtime = 'edge'
