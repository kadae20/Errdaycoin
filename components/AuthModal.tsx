'use client'

import { useState } from 'react'
import { useAuth } from '@/app/providers'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onGuestMode?: () => void
}

export default function AuthModal({ isOpen, onClose, onGuestMode }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { login, register, loginWithGoogle } = useAuth()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!email || !password) {
      setError('Please fill in all fields')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setIsLoading(false)
      return
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const success = isLogin 
        ? await login(email, password)
        : await register(email, password)

      if (success) {
        onClose()
        setEmail('')
        setPassword('')
        setConfirmPassword('')
      } else {
        setError(isLogin ? 'Invalid credentials' : 'Registration failed')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setError('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
  }

  const handleGoogleLogin = async () => {
    setError('')
    setIsLoading(true)
    
    try {
      const success = await loginWithGoogle()
      if (success) {
        onClose()
      } else {
        setError('Google login failed')
      }
    } catch (error) {
      setError('An error occurred with Google login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-75"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gray-800 rounded-lg p-8 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
              placeholder="Enter your password"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                placeholder="Confirm your password"
                required
              />
            </div>
          )}

          {error && (
            <div className="text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-gray-600"></div>
          <div className="px-4 text-gray-400 text-sm">OR</div>
          <div className="flex-1 border-t border-gray-600"></div>
        </div>

        {/* Google Sign In */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full bg-white hover:bg-gray-100 disabled:bg-gray-300 text-gray-900 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-3 border border-gray-300"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {isLoading ? 'Connecting...' : 'Continue with Google'}
        </button>

        <div className="mt-6 text-center">
          <p className="text-gray-400">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </p>
          <button
            onClick={toggleMode}
            className="text-green-400 hover:text-green-300 font-semibold mt-1"
          >
            {isLogin ? 'Create Account' : 'Sign In'}
          </button>
        </div>

        {isLogin && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Demo: Use any email and password (6+ chars)
            </p>
          </div>
        )}

        {/* Guest Mode Option */}
        {onGuestMode && (
          <div className="mt-6 pt-4 border-t border-gray-600">
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-3">
                Want to try without signing up?
              </p>
              <button
                onClick={onGuestMode}
                className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Continue as Guest
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
