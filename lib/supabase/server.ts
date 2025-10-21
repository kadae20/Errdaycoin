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
  const supabaseUrl = 'https://xuqwdkzpvowhigowecwj.supabase.co'
  const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1cXdka3pwdm93aGlnb3dlY3dqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjY0MDc0NywiZXhwIjoyMDcyMjE2NzQ3fQ.placeholder'
  
  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
