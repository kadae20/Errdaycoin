import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { SupportedLanguages } from '@/lib/types'

// Import translations
import en from './locales/en.json'
import ko from './locales/ko.json'

const resources = {
  en: { common: en },
  ko: { common: ko },
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: process.env.NEXT_PUBLIC_DEFAULT_LANG || 'en',
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    ns: ['common'],
    defaultNS: 'common',
    
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n

export { SupportedLanguages }
export type { SupportedLanguage } from '@/lib/types'
