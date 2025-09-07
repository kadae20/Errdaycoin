'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState, createContext, useContext } from 'react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
})

// Simple Auth Context
interface AuthContextType {
  user: { id: string; email: string } | null
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string) => Promise<boolean>
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
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored user session
    const storedUser = typeof window !== 'undefined' 
      ? localStorage.getItem('errdaycoin_user') 
      : null
    
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Error parsing stored user:', error)
        localStorage.removeItem('errdaycoin_user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      // Simple demo authentication
      if (email && password.length >= 6) {
        const user = { id: Math.random().toString(36).substr(2, 9), email }
        setUser(user)
        localStorage.setItem('errdaycoin_user', JSON.stringify(user))
        return true
      }
      return false
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
      // Simple demo registration
      if (email && password.length >= 6) {
        const user = { id: Math.random().toString(36).substr(2, 9), email }
        setUser(user)
        localStorage.setItem('errdaycoin_user', JSON.stringify(user))
        return true
      }
      return false
    } catch (error) {
      console.error('Register error:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('errdaycoin_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
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
