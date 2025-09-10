'use client'

import { useEffect, useState } from 'react'
import { createDirectClient, isSupabaseConfigured } from '@/lib/supabase/client'

export default function TestSupabasePage() {
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [envVars, setEnvVars] = useState({
    supabaseUrl: '',
    hasAnonKey: false,
    isConfigured: false
  })

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Check environment variables
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set'
        const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        const configured = isSupabaseConfigured()

        setEnvVars({
          supabaseUrl,
          hasAnonKey,
          isConfigured: configured
        })

        if (!configured) {
          setConnectionStatus('error')
          setErrorMessage('Supabase environment variables are not properly configured')
          return
        }

        // Test Supabase connection
        const supabase = createDirectClient()
        
        // Simple test query
        const { data, error } = await supabase
          .from('profiles') // This table might not exist, but we'll test the connection
          .select('count')
          .limit(1)

        if (error && !error.message.includes('relation "profiles" does not exist')) {
          throw error
        }

        setConnectionStatus('success')
      } catch (error: any) {
        setConnectionStatus('error')
        setErrorMessage(error.message || 'Unknown error occurred')
      }
    }

    testConnection()
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Supabase Connection Test</h1>
        
        {/* Environment Variables Status */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Environment Variables</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>NEXT_PUBLIC_SUPABASE_URL:</span>
              <span className={envVars.supabaseUrl.includes('placeholder') ? 'text-red-400' : 'text-green-400'}>
                {envVars.supabaseUrl}
              </span>
            </div>
            <div className="flex justify-between">
              <span>NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
              <span className={envVars.hasAnonKey ? 'text-green-400' : 'text-red-400'}>
                {envVars.hasAnonKey ? 'Set ✓' : 'Not set ✗'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Configuration Status:</span>
              <span className={envVars.isConfigured ? 'text-green-400' : 'text-red-400'}>
                {envVars.isConfigured ? 'Configured ✓' : 'Not configured ✗'}
              </span>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Connection Test</h2>
          
          {connectionStatus === 'loading' && (
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Testing Supabase connection...</p>
            </div>
          )}
          
          {connectionStatus === 'success' && (
            <div className="text-center">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-green-400 text-xl font-bold">Supabase Connected Successfully!</p>
              <p className="text-gray-400 mt-2">Your Supabase configuration is working correctly.</p>
            </div>
          )}
          
          {connectionStatus === 'error' && (
            <div className="text-center">
              <div className="text-6xl mb-4">❌</div>
              <p className="text-red-400 text-xl font-bold">Connection Failed</p>
              <p className="text-gray-400 mt-2">Error: {errorMessage}</p>
              
              <div className="mt-6 text-left bg-gray-900 p-4 rounded">
                <h3 className="font-bold mb-2">Troubleshooting:</h3>
                <ul className="text-sm space-y-1">
                  <li>• Check if environment variables are set in Vercel dashboard</li>
                  <li>• Verify Supabase URL format: https://your-project.supabase.co</li>
                  <li>• Ensure anon key is correct</li>
                  <li>• Try redeploying after setting environment variables</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <a 
            href="/" 
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-colors"
          >
            ← Back to Errdaycoin
          </a>
        </div>
      </div>
    </div>
  )
}
