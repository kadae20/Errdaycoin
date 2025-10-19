import { getSupabaseClient } from './singleton'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/types/database'

// Client-side Supabase client (for use in components)
export const createClient = () => {
  return getSupabaseClient()
}

// Direct Supabase client (for use outside of components)
export const createDirectClient = () => {
  try {
    // 하드코딩된 환경 변수 사용 (Vercel 환경 변수 문제 해결)
    const supabaseUrl = 'https://xuqwdkzpvowhigowecwj.supabase.co'
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1cXdka3pwdm93aGlnb3dlY3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NDA3NDcsImV4cCI6MjA3MjIxNjc0N30.UcbPHTCxNC1Qc90Pzg8N2Nuh2SuiJ0FX2mVrdf8V4Y0'
    
    console.log('Creating direct Supabase client with URL:', supabaseUrl)
    
    return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }) as any
  } catch (error) {
    console.error('Error creating direct Supabase client:', error)
    return createSupabaseClient<Database>(
      'https://placeholder.supabase.co', 
      'placeholder-key'
    ) as any
  }
}

// Supabase 설정 상태 확인 유틸리티
export const isSupabaseConfigured = () => {
  // 하드코딩된 값이 있으므로 항상 true 반환
  return true
}
