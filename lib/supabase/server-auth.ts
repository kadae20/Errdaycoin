import { createServerClient } from './server'
import { isSupabaseConfigured } from './client'

export interface AuthUser {
  id: string
  email?: string
  user_metadata?: {
    handle?: string
    [key: string]: any
  }
}

// 서버 사이드 인증 헬퍼
export const serverAuthHelpers = {
  // 서버에서 현재 사용자 정보 가져오기
  async getCurrentUser(): Promise<AuthUser | null> {
    if (!isSupabaseConfigured()) {
      return null
    }
    
    try {
      const supabase = createServerClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        return null
      }
      
      return user as AuthUser
    } catch (error) {
      console.error('Error getting current user on server:', error)
      return null
    }
  }
}

