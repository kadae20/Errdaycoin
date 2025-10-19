'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState, createContext, useContext } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
})

// Auth Context with Google OAuth
interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string) => Promise<boolean>
  loginWithGoogle: () => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setIsLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        console.error('Login error:', error)
        return false
      }
      return true
    } catch (error) {
      console.error('Login error:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) {
        console.error('Register error:', error)
        return false
      }
      return true
    } catch (error) {
      console.error('Register error:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithGoogle = async (): Promise<boolean> => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (error) {
        console.error('Google login error:', error)
        return false
      }
      return true
    } catch (error) {
      console.error('Google login error:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode
}) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // 클라이언트에서만 실행되도록 보장
    setIsReady(true)
  }, [])

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-green-400">Loading Errdaycoin...</p>
        </div>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  )
}
