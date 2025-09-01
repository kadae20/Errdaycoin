'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import { useEffect, useState } from 'react'
import i18n from '@/lib/i18n/config'

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
      // Check for stored language preference
      const storedLang = localStorage.getItem('preferred-language')
      
      // Detect browser language
      const browserLang = navigator.language.split('-')[0]
      const supportedLangs = ['ko', 'en', 'es', 'ja']
      
      // Use stored preference, then browser language, then default
      const targetLang = storedLang || 
        (supportedLangs.includes(browserLang) ? browserLang : 'ko')
      
      if (i18n.language !== targetLang) {
        await i18n.changeLanguage(targetLang)
      }
      
      setIsI18nReady(true)
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
        {children}
      </I18nextProvider>
    </QueryClientProvider>
  )
}
