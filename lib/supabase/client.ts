import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/types/database'

// Client-side Supabase client (for use in components)
export const createClient = () => {
  try {
    // 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase environment variables not found, using fallback')
      return createSupabaseClient<Database>(
        'https://placeholder.supabase.co',
        'placeholder-key'
      )
    }
    
    // 환경 변수가 유효한지 확인
    if (supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder')) {
      console.warn('Supabase environment variables are placeholders, using fallback')
      return createSupabaseClient<Database>(
        'https://placeholder.supabase.co',
        'placeholder-key'
      )
    }
    
    return createClientComponentClient<Database>()
  } catch (error) {
    console.error('Error creating Supabase client:', error)
    // 에러 발생 시 fallback client 반환
    return createSupabaseClient<Database>(
      'https://placeholder.supabase.co',
      'placeholder-key'
    )
  }
}

// Direct Supabase client (for use outside of components)
export const createDirectClient = () => {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
    
    // 환경 변수가 설정되지 않은 경우 에러 처리
    if (supabaseUrl === 'your_supabase_project_url' || 
        supabaseAnonKey === 'your_supabase_anon_key' ||
        supabaseUrl === 'https://placeholder.supabase.co' ||
        supabaseAnonKey === 'placeholder-key' ||
        !supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase environment variables are not properly configured')
      // 빌드 시에는 placeholder client 반환
      return createSupabaseClient<Database>(
        'https://placeholder.supabase.co', 
        'placeholder-key'
      )
    }
    
    // URL 유효성 검사
    try {
      new URL(supabaseUrl)
    } catch (urlError) {
      console.error('Invalid Supabase URL:', supabaseUrl, urlError)
      return createSupabaseClient<Database>(
        'https://placeholder.supabase.co', 
        'placeholder-key'
      )
    }
    
    return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  } catch (error) {
    console.error('Error creating direct Supabase client:', error)
    return createSupabaseClient<Database>(
      'https://placeholder.supabase.co', 
      'placeholder-key'
    )
  }
}

// Supabase 설정 상태 확인 유틸리티
export const isSupabaseConfigured = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  return !!(supabaseUrl && supabaseAnonKey && 
           supabaseUrl !== 'your_supabase_project_url' && 
           supabaseAnonKey !== 'your_supabase_anon_key' &&
           supabaseUrl !== 'https://placeholder.supabase.co' &&
           supabaseAnonKey !== 'placeholder-key')
}
