import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'

// Date formatting
export const formatDate = (date: string | Date, formatStr: string = 'yyyy-MM-dd HH:mm:ss'): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return format(dateObj, formatStr, { locale: zhTW })
  } catch (error) {
    return '無效日期'
  }
}

export const formatDateShort = (date: string | Date): string => {
  return formatDate(date, 'MM/dd HH:mm')
}

export const formatDateLong = (date: string | Date): string => {
  return formatDate(date, 'yyyy年MM月dd日 HH:mm:ss')
}

// Status formatting
export const formatEnableStatus = (enable: boolean): string => {
  return enable ? '啟用' : '停用'
}

export const getEnableStatusColor = (enable: boolean): 'success' | 'error' => {
  return enable ? 'success' : 'error'
}

// Controller type formatting
export const formatControllerType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'E82': 'E82 控制器',
    'E84': 'E84 控制器',
    'E88': 'E88 控制器',
    'E90': 'E90 控制器',
  }
  return typeMap[type] || type
}

// Number formatting
export const formatNumber = (num: number): string => {
  return num.toLocaleString()
}

// Text truncation
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// IP and port formatting
export const formatEndpoint = (ip: string, port: number): string => {
  return `${ip}:${port}`
}