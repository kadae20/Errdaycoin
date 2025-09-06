import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { SupportedLanguages } from '@/lib/types'

// 임시로 영어만 사용 - JSON 파싱 에러 방지
const resources = {
  en: { 
    common: {
      site_name: "Errdaycoin",
      tagline: "Master Trading with Chart Games",
      welcome: "Welcome to Errdaycoin",
      start_quiz: "Start Quiz",
      leaderboard: "Leaderboard",
      dashboard: "Dashboard"
    }
  },
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
