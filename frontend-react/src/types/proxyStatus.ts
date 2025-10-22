// 代理服務狀態相關的類型定義

export interface ProxyStatusData {
  proxyid: number
  message: string
  proxyServiceAlive: string
  proxyServiceStart: string
  controller_type: string
  proxy_ip: string
  proxy_port: string
  remark: string
}

export interface ProxyStatusSummary {
  total: number
  running: number
  stopped: number
  error: number
  timeout: number
  unknown: number
}

export interface ProxyStatusFilter {
  status?: 'all' | 'running' | 'stopped' | 'error' | 'timeout'
  controllerType?: string
  search?: string
}

export interface ProxyStatusSort {
  field: keyof ProxyStatusData
  order: 'asc' | 'desc'
}

export interface ProxyStatusListResponse {
  data: ProxyStatusData[]
  summary: ProxyStatusSummary
  lastUpdated: string
}

// 狀態類型定義
export type ProxyStatusType = 'running' | 'stopped' | 'error' | 'timeout' | 'unknown'

// 統計資料類型
export interface StatusStatistics {
  label: string
  value: number
  color: string
  percentage: number
}

// 圖表資料類型
export interface ChartDataPoint {
  name: string
  value: number
  color?: string
}

// 自動重新整理設定
export interface AutoRefreshConfig {
  enabled: boolean
  interval: number // 秒
}

// 頁面設定
export interface ProxyStatusPageConfig {
  autoRefresh: AutoRefreshConfig
  pageSize: number
  showSummary: boolean
  showCharts: boolean
}