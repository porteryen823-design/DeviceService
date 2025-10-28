import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { translations, defaultLocale } from '@/locales'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      'zh-TW': { translation: translations['zh-TW'] },
      'zh-CN': { translation: translations['zh-CN'] },
      'en': { translation: translations['en'] },
      'ja': { translation: translations['ja'] },
    },
    lng: defaultLocale,
    fallbackLng: defaultLocale,
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n