'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface AuthButtonProps {
  className?: string
}

const AuthButton = ({ className = '' }: AuthButtonProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setMessage(error.message)
      } else {
        setMessage('Magic link sent! Check your email.')
        setShowEmailForm(false)
        setEmail('')
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Sign out error:', error)
    }
  }

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-10 bg-gray-200 rounded-lg w-24"></div>
      </div>
    )
  }

  if (user) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="text-sm">
          <div className="font-medium text-gray-800">
            {user.user_metadata?.handle || user.email?.split('@')[0] || 'User'}
          </div>
          <div className="text-gray-500 text-xs">
            {user.email}
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Logout
        </button>
      </div>
    )
  }

  return (
    <div className={className}>
      {!showEmailForm ? (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            Guest Mode
          </span>
          <button
            onClick={() => setShowEmailForm(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Login
          </button>
        </div>
      ) : (
        <form onSubmit={handleSignIn} className="flex flex-col gap-3 min-w-[280px]">
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '...' : 'Send Magic Link'}
            </button>
          </div>
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => {
                setShowEmailForm(false)
                setMessage('')
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            {message && (
              <span className={`text-sm ${message.includes('sent') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  )
}

export default AuthButton
