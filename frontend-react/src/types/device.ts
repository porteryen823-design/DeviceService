export interface Device {
  proxyid: number
  proxy_ip: string
  proxy_port: number
  Controller_type: string
  Controller_ip: string
  Controller_port: number
  remark?: string
  enable: number  // 改為 number 以匹配後端的 int 類型
  createUser: string
  createDate?: string
  ModiftyDate?: string
}

export interface DeviceCreate {
  proxyid?: number  // 創建時可選，資料庫會自動生成
  proxy_ip: string
  proxy_port: number
  Controller_type: string
  Controller_ip: string
  Controller_port: number
  remark?: string
  enable: number  // 改為 number 以匹配後端的 int 類型
  createUser: string
}

export interface DeviceUpdate extends Partial<DeviceCreate> {
  proxyid: number
}

export interface DeviceQueryParams {
  page?: number
  size?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface DeviceListResponse {
  data: Device[]
  total: number
  page: number
  size: number
}

export type DialogMode = 'create' | 'update' | 'delete'