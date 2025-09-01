'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SupportedLanguages, SupportedLanguage } from '@/lib/types'

interface LangSwitcherProps {
  className?: string
}

const languageNames: Record<SupportedLanguage, string> = {
  ko: '한국어',
  en: 'English',
  es: 'Español',
  ja: '日本語',
}

const languageFlags: Record<SupportedLanguage, string> = {
  ko: '🇰🇷',
  en: '🇺🇸',
  es: '🇪🇸',
  ja: '🇯🇵',
}

const LangSwitcher = ({ className = '' }: LangSwitcherProps) => {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  
  const currentLang = i18n.language as SupportedLanguage
  
  const handleLanguageChange = (lang: SupportedLanguage) => {
    i18n.changeLanguage(lang)
    setIsOpen(false)
    
    // Store in localStorage
    localStorage.setItem('preferred-language', lang)
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        aria-label="Change language"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="text-lg">
          {languageFlags[currentLang]}
        </span>
        <span className="text-sm font-medium text-gray-700">
          {languageNames[currentLang]}
        </span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="py-1" role="menu" aria-orientation="vertical">
              {SupportedLanguages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2 text-left text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100
                    ${currentLang === lang ? 'bg-primary-50 text-primary-700' : 'text-gray-700'}
                  `}
                  role="menuitem"
                >
                  <span className="text-lg">
                    {languageFlags[lang]}
                  </span>
                  <span className="font-medium">
                    {languageNames[lang]}
                  </span>
                  {currentLang === lang && (
                    <span className="ml-auto text-primary-500">
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default LangSwitcher
