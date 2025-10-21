import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/types/database'

// 전역 Supabase 클라이언트 인스턴스
let _supabaseClient: any = null
let _isInitializing = false

// 클라이언트 초기화 함수
const initializeClient = () => {
  if (_supabaseClient) {
    return _supabaseClient
  }

  if (_isInitializing) {
    // 초기화 중이면 잠시 대기 후 다시 시도
    return new Promise((resolve) => {
      const checkClient = () => {
        if (_supabaseClient) {
          resolve(_supabaseClient)
        } else {
          setTimeout(checkClient, 10)
        }
      }
      checkClient()
    })
  }

  _isInitializing = true

  try {
    console.log('Initializing Supabase client...')
    
    // 하드코딩된 환경 변수 사용 (Vercel 환경 변수 문제 해결)
    const supabaseUrl = 'https://xuqwdkzpvowhigowecwj.supabase.co'
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1cXdka3pwdm93aGlnb3dlY3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NDA3NDcsImV4cCI6MjA3MjIxNjc0N30.UcbPHTCxNC1Qc90Pzg8N2Nuh2SuiJ0FX2mVrdf8V4Y0'
    
    _supabaseClient = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }) as any
    
    console.log('Supabase client initialized successfully')
    return _supabaseClient
  } catch (error) {
    console.error('Error initializing Supabase client:', error)
    // Fallback client
    _supabaseClient = createSupabaseClient<Database>(
      'https://placeholder.supabase.co',
      'placeholder-key'
    ) as any
    return _supabaseClient
  } finally {
    _isInitializing = false
  }
}

// Singleton 패턴으로 클라이언트 반환
export const getSupabaseClient = () => {
  if (typeof window === 'undefined') {
    // 서버 사이드에서는 새 인스턴스 생성
    return createClientComponentClient<Database>()
  }

  return initializeClient()
}

// 클라이언트 리셋 (테스트용)
export const resetSupabaseClient = () => {
  _supabaseClient = null
  _isInitializing = false
}
