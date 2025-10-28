// 語系匯出檔案
import { LocaleType, LocaleInfo } from '@/types/locale'
import { zhTW } from './translations'
import { zhCN } from './translations'
import { en } from './translations'
import { ja } from './translations'

// 語系資訊
export const locales: LocaleInfo[] = [
  { code: 'zh-TW', name: 'Traditional Chinese', nativeName: '繁體中文', flag: '🇹🇼' },
  { code: 'zh-CN', name: 'Simplified Chinese', nativeName: '简体中文', flag: '🇨🇳' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
]

// 翻譯映射
export const translations = {
  'zh-TW': zhTW,
  'zh-CN': zhCN,
  'en': en,
  'ja': ja,
}

// 預設語系
export const defaultLocale: LocaleType = 'zh-TW'