import { createServerComponentClient, createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { Database } from '@/lib/types/database'

// Server Component용 Supabase 클라이언트
export const createServerClient = () => 
  createServerComponentClient<Database>({ cookies })

// Route Handler용 Supabase 클라이언트
export const createRouteHandlerSupabaseClient = () =>
  createRouteHandlerClient<Database>({ cookies })

// 일반적인 createClient 함수 (API Routes에서 사용)
export const createClient = () =>
  createRouteHandlerClient<Database>({ cookies })

// Service Role 클라이언트 (관리자 권한)
export const createServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceRoleKey || 
      supabaseUrl === 'your_supabase_project_url' || 
      serviceRoleKey === 'your_supabase_service_role_key') {
    console.warn('Supabase service role environment variables are not properly configured')
    return null
  }
  
  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
