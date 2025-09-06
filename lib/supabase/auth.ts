import { createClient, isSupabaseConfigured } from './client'

export interface AuthUser {
  id: string
  email?: string
  user_metadata?: {
    handle?: string
    [key: string]: any
  }
}

// 클라이언트 사이드 인증 헬퍼
export const authHelpers = {
  // 현재 사용자 정보 가져오기
  async getCurrentUser(): Promise<AuthUser | null> {
    if (!isSupabaseConfigured()) {
      return null
    }
    
    try {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        return null
      }
      
      return user as AuthUser
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  },

  // 익명 로그인
  async signInAnonymously() {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, skipping anonymous sign in')
      return { data: null, error: null }
    }
    
    try {
      const supabase = createClient()
      return await supabase.auth.signInAnonymously()
    } catch (error) {
      console.error('Error signing in anonymously:', error)
      return { data: null, error }
    }
  },

  // 로그아웃
  async signOut() {
    if (!isSupabaseConfigured()) {
      return { error: null }
    }
    
    try {
      const supabase = createClient()
      return await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
      return { error }
    }
  },

  // 세션 상태 변경 리스너
  onAuthStateChange(callback: (event: string, session: any) => void) {
    if (!isSupabaseConfigured()) {
      return { data: { subscription: { unsubscribe: () => {} } } }
    }
    
    const supabase = createClient()
    return supabase.auth.onAuthStateChange(callback)
  }
}

