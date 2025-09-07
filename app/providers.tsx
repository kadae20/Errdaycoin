'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import { useEffect, useState } from 'react'
import i18n from '@/lib/i18n/config'
import { SupabaseProvider } from '@/components/SupabaseProvider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
})

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode
}) {
  const [isI18nReady, setIsI18nReady] = useState(false)

  useEffect(() => {
    // Initialize i18n with browser language detection
    const initI18n = async () => {
      try {
        // Check for stored language preference (only in browser)
        const storedLang = typeof window !== 'undefined' 
          ? localStorage.getItem('preferred-language') 
          : null
        
        // Detect browser language (only in browser)
        const browserLang = typeof window !== 'undefined' && navigator?.language
          ? navigator.language.split('-')[0]
          : 'ko'
        
        const supportedLangs = ['ko', 'en', 'es', 'ja']
        
        // Use stored preference, then browser language, then default
        const targetLang = storedLang || 
          (supportedLangs.includes(browserLang) ? browserLang : 'ko')
        
        if (i18n.language !== targetLang) {
          await i18n.changeLanguage(targetLang)
        }
      } catch (error) {
        console.warn('Error initializing i18n:', error)
        // Fallback to default language
        if (i18n.language !== 'ko') {
          await i18n.changeLanguage('ko')
        }
      } finally {
        setIsI18nReady(true)
      }
    }

    initI18n()
  }, [])

  if (!isI18nReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <SupabaseProvider>
          {children}
        </SupabaseProvider>
      </I18nextProvider>
    </QueryClientProvider>
  )
}
