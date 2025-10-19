'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { authHelpers, AuthUser } from '@/lib/supabase/auth'

interface SupabaseContextType {
  isConfigured: boolean
  user: AuthUser | null
  loading: boolean
  signInAnonymously: () => Promise<void>
  signOut: () => Promise<void>
}

const SupabaseContext = createContext<SupabaseContextType | null>(null)

// 전역 초기화 상태 관리
let _globalInitialized = false

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [isConfigured] = useState(isSupabaseConfigured())
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isConfigured || _globalInitialized) {
      setLoading(false)
      return
    }

    _globalInitialized = true

    // 초기 사용자 상태 확인
    const checkUser = async () => {
      try {
        const currentUser = await authHelpers.getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error('Error checking user:', error)
        // 에러가 발생해도 계속 진행
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    // 인증 상태 변경 리스너 (에러 처리 추가)
    try {
      const { data: { subscription } } = authHelpers.onAuthStateChange(
        async (event, session) => {
          try {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              const currentUser = await authHelpers.getCurrentUser()
              setUser(currentUser)
            } else if (event === 'SIGNED_OUT') {
              setUser(null)
            }
          } catch (error) {
            console.error('Error in auth state change:', error)
            setUser(null)
          } finally {
            setLoading(false)
          }
        }
      )

      return () => {
        try {
          subscription.unsubscribe()
        } catch (error) {
          console.error('Error unsubscribing:', error)
        }
      }
    } catch (error) {
      console.error('Error setting up auth listener:', error)
      setLoading(false)
      return
    }
  }, [isConfigured])

  const signInAnonymously = async () => {
    if (!isConfigured) return
    
    setLoading(true)
    try {
      await authHelpers.signInAnonymously()
    } catch (error) {
      console.error('Error signing in anonymously:', error)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    if (!isConfigured) return
    
    setLoading(true)
    try {
      await authHelpers.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setLoading(false)
    }
  }

  const value: SupabaseContextType = {
    isConfigured,
    user,
    loading,
    signInAnonymously,
    signOut,
  }

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}

// Supabase 설정 상태를 보여주는 컴포넌트
export function SupabaseStatus() {
  const { isConfigured, user, loading } = useSupabase()

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
        Connecting...
      </div>
    )
  }

  if (!isConfigured) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-500">
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        Supabase not configured
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm text-green-500">
      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
      Connected {user ? `(${user.id.slice(0, 8)}...)` : '(Anonymous)'}
    </div>
  )
}

