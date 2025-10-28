// 語系類型定義
export type LocaleType = 'zh-TW' | 'zh-CN' | 'en' | 'ja'

// 語系資訊介面
export interface LocaleInfo {
  code: LocaleType
  name: string
  nativeName: string
  flag: string
}

// 翻譯鍵類型
export type TranslationKey =
  | 'app.title'
  | 'nav.devices'
  | 'nav.proxyStatus'
  | 'theme.light'
  | 'theme.dark'
  | 'theme.pink'
  | 'theme.green'
  | 'theme.purple'
  | 'common.loading'
  | 'common.error'
  | 'common.success'
  | 'common.cancel'
  | 'common.confirm'
  | 'common.save'
  | 'common.delete'
  | 'common.edit'
  | 'common.add'
  | 'common.search'
  | 'common.filter'
  | 'common.refresh'
  | 'common.close'
  | 'devices.title'
  | 'devices.add'
  | 'devices.edit'
  | 'devices.delete'
  | 'devices.search'
  | 'devices.noData'
  | 'proxy.title'
  | 'proxy.status'
  | 'proxy.online'
  | 'proxy.offline'
  | 'proxy.error'
  | 'proxy.refreshing'

// 翻譯介面
export interface Translations {
  [key: string]: string
}