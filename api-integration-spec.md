# API 整合與錯誤處理規範

## API 整合設計

### 1. HTTP 客戶端設定

#### 基礎設定
```typescript
// src/api/client.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

class HttpClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // 請求攔截器
    this.client.interceptors.request.use(
      (config) => {
        // 加入認證標頭
        const token = localStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // 請求日誌記錄（開發環境）
        if (import.meta.env.DEV) {
          console.log('API Request:', config.method?.toUpperCase(), config.url)
        }

        return config
      },
      (error) => {
        console.error('Request Error:', error)
        return Promise.reject(error)
      }
    )

    // 響應攔截器
    this.client.interceptors.response.use(
      (response) => {
        // 響應日誌記錄（開發環境）
        if (import.meta.env.DEV) {
          console.log('API Response:', response.status, response.config.url)
        }
        return response
      },
      (error) => {
        this.handleResponseError(error)
        return Promise.reject(error)
      }
    )
  }

  private handleResponseError(error: any) {
    if (error.response) {
      // 伺服器有回應，但狀態碼超出 2xx 範圍
      const { status, data } = error.response

      switch (status) {
        case 400:
          console.error('Bad Request:', data.message)
          break
        case 401:
          console.error('Unauthorized: Token expired or invalid')
          // 清除無效 token 並重新導向登入頁面
          localStorage.removeItem('auth_token')
          window.location.href = '/login'
          break
        case 403:
          console.error('Forbidden: Insufficient permissions')
          break
        case 404:
          console.error('Not Found:', error.config.url)
          break
        case 500:
          console.error('Internal Server Error')
          break
        default:
          console.error('HTTP Error:', status, data)
      }
    } else if (error.request) {
      // 請求已發出但沒有收到回應
      console.error('Network Error: No response received')
    } else {
      // 其他錯誤
      console.error('Request Setup Error:', error.message)
    }
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get(url, config)
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post(url, data, config)
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put(url, data, config)
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete(url, config)
  }
}

export const httpClient = new HttpClient()
```

### 2. API 回應格式標準化

#### 統一回應格式
```typescript
// src/types/api.ts
export interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
  timestamp: string
  errors?: string[]
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    size: number
    total: number
    totalPages: number
  }
}

export interface ErrorResponse {
  message: string
  code: string
  details?: Record<string, any>
  timestamp: string
}
```

#### API 服務類別設計
```typescript
// src/api/base.ts
import { httpClient } from './client'
import type { ApiResponse, PaginatedResponse, ErrorResponse } from '@/types/api'

export abstract class BaseAPI {
  protected async handleResponse<T>(response: any): Promise<T> {
    if (response.data?.success === false) {
      throw new Error(response.data.message || 'API request failed')
    }
    return response.data
  }

  protected async handleError(error: any): Promise<never> {
    let message = '發生未知錯誤'

    if (error.response?.data) {
      const errorData = error.response.data as ErrorResponse
      message = errorData.message || message
    } else if (error.request) {
      message = '網路連線失敗，請檢查網路設定'
    } else if (error.message) {
      message = error.message
    }

    throw new Error(message)
  }
}
```

### 3. Device API 實作

#### API 方法設計
```typescript
// src/api/device.ts
import { httpClient } from './client'
import { BaseAPI } from './base'
import type { Device, DeviceCreate, DeviceUpdate } from '@/types/device'
import type { ApiResponse, PaginatedResponse } from '@/types/api'

export interface DeviceQueryParams {
  page?: number
  size?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export class DeviceAPI extends BaseAPI {
  private readonly baseUrl = '/DeviceServiceConfig'

  // 獲取所有設備（支援分頁和搜尋）
  async getAllDevices(params?: DeviceQueryParams): Promise<PaginatedResponse<Device>> {
    try {
      const response = await httpClient.get(this.baseUrl, { params })
      return this.handleResponse<PaginatedResponse<Device>>(response)
    } catch (error) {
      this.handleError(error)
    }
  }

  // 獲取單個設備
  async getDevice(proxyid: number): Promise<ApiResponse<Device>> {
    try {
      const response = await httpClient.get(`${this.baseUrl}/${proxyid}`)
      return this.handleResponse<ApiResponse<Device>>(response)
    } catch (error) {
      this.handleError(error)
    }
  }

  // 建立設備
  async createDevice(deviceData: DeviceCreate): Promise<ApiResponse<Device>> {
    try {
      const response = await httpClient.post(this.baseUrl, deviceData)
      return this.handleResponse<ApiResponse<Device>>(response)
    } catch (error) {
      this.handleError(error)
    }
  }

  // 更新設備
  async updateDevice(proxyid: number, deviceData: DeviceUpdate): Promise<ApiResponse<Device>> {
    try {
      const response = await httpClient.put(`${this.baseUrl}/${proxyid}`, deviceData)
      return this.handleResponse<ApiResponse<Device>>(response)
    } catch (error) {
      this.handleError(error)
    }
  }

  // 刪除設備
  async deleteDevice(proxyid: number): Promise<ApiResponse<void>> {
    try {
      const response = await httpClient.delete(`${this.baseUrl}/${proxyid}`)
      return this.handleResponse<ApiResponse<void>>(response)
    } catch (error) {
      this.handleError(error)
    }
  }

  // 批次操作
  async batchDelete(proxyids: number[]): Promise<ApiResponse<void>> {
    try {
      const response = await httpClient.post(`${this.baseUrl}/batch-delete`, { proxyids })
      return this.handleResponse<ApiResponse<void>>(response)
    } catch (error) {
      this.handleError(error)
    }
  }

  // 批次更新狀態
  async batchUpdateStatus(proxyids: number[], enable: number): Promise<ApiResponse<void>> {
    try {
      const response = await httpClient.post(`${this.baseUrl}/batch-update-status`, {
        proxyids,
        enable
      })
      return this.handleResponse<ApiResponse<void>>(response)
    } catch (error) {
      this.handleError(error)
    }
  }
}

// 建立實例
export const deviceAPI = new DeviceAPI()
```

## 錯誤處理機制

### 1. 錯誤類型定義

```typescript
// src/types/errors.ts
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN = 'UNKNOWN'
}

export interface AppError {
  type: ErrorType
  message: string
  code?: string
  details?: Record<string, any>
  timestamp: Date
  retryable: boolean
}

export class NetworkError extends Error implements AppError {
  type = ErrorType.NETWORK
  retryable = true
  timestamp = new Date()

  constructor(message: string) {
    super(message)
    this.name = 'NetworkError'
  }
}

export class ValidationError extends Error implements AppError {
  type = ErrorType.VALIDATION
  retryable = false
  timestamp = new Date()
  details?: Record<string, any>

  constructor(message: string, details?: Record<string, any>) {
    super(message)
    this.name = 'ValidationError'
    this.details = details
  }
}

export class AuthenticationError extends Error implements AppError {
  type = ErrorType.AUTHENTICATION
  retryable = false
  timestamp = new Date()

  constructor(message: string = '認證失敗，請重新登入') {
    super(message)
    this.name = 'AuthenticationError'
  }
}
```

### 2. 全域錯誤處理器

```typescript
// src/composables/useErrorHandler.ts
import { ElMessage, ElMessageBox } from 'element-plus'
import type { AxiosError } from 'axios'
import {
  ErrorType,
  AppError,
  NetworkError,
  ValidationError,
  AuthenticationError
} from '@/types/errors'

export const useErrorHandler = () => {
  const handleError = (error: Error | AxiosError | any): AppError => {
    // 如果已經是 AppError，直接返回
    if (error.type && Object.values(ErrorType).includes(error.type)) {
      return error as AppError
    }

    // 處理 Axios 錯誤
    if (error.isAxiosError) {
      return handleAxiosError(error)
    }

    // 處理一般錯誤
    return {
      type: ErrorType.UNKNOWN,
      message: error.message || '發生未知錯誤',
      timestamp: new Date(),
      retryable: false
    }
  }

  const handleAxiosError = (error: AxiosError): AppError => {
    const { response, request, message } = error

    if (response) {
      const { status, data } = response

      switch (status) {
        case 400:
          return new ValidationError(
            data?.message || '請求參數錯誤',
            data?.errors
          )

        case 401:
          return new AuthenticationError()

        case 403:
          return {
            type: ErrorType.AUTHORIZATION,
            message: data?.message || '沒有操作權限',
            timestamp: new Date(),
            retryable: false
          }

        case 404:
          return {
            type: ErrorType.NOT_FOUND,
            message: data?.message || '找不到請求的資源',
            timestamp: new Date(),
            retryable: false
          }

        case 500:
          return {
            type: ErrorType.SERVER_ERROR,
            message: data?.message || '伺服器內部錯誤',
            timestamp: new Date(),
            retryable: true
          }

        default:
          return {
            type: ErrorType.UNKNOWN,
            message: data?.message || `HTTP ${status} 錯誤`,
            timestamp: new Date(),
            retryable: false
          }
      }
    }

    if (request) {
      return new NetworkError('網路連線失敗，請檢查網路設定')
    }

    return {
      type: ErrorType.UNKNOWN,
      message: message || '請求設定錯誤',
      timestamp: new Date(),
      retryable: false
    }
  }

  const showErrorMessage = (error: AppError) => {
    const { type, message, retryable } = error

    // 網路錯誤顯示可重試選項
    if (retryable && type === ErrorType.NETWORK) {
      ElMessageBox.confirm(
        `${message} 是否要重試？`,
        '網路錯誤',
        {
          confirmButtonText: '重試',
          cancelButtonText: '取消',
          type: 'error'
        }
      ).then(() => {
        // 觸發重試邏輯
        window.location.reload()
      }).catch(() => {
        // 用戶取消，不做任何事
      })
    } else {
      ElMessage({
        message,
        type: 'error',
        duration: retryable ? 5000 : 3000,
        showClose: true
      })
    }
  }

  const showSuccessMessage = (message: string) => {
    ElMessage({
      message,
      type: 'success',
      duration: 3000
    })
  }

  const showWarningMessage = (message: string) => {
    ElMessage({
      message,
      type: 'warning',
      duration: 4000
    })
  }

  return {
    handleError,
    showErrorMessage,
    showSuccessMessage,
    showWarningMessage
  }
}
```

### 3. 載入狀態管理

```typescript
// src/composables/useLoading.ts
import { ref, computed } from 'vue'

export const useLoading = () => {
  const loading = ref(false)
  const loadingText = ref('載入中...')

  const startLoading = (text = '載入中...') => {
    loading.value = true
    loadingText.value = text
  }

  const stopLoading = () => {
    loading.value = false
    loadingText.value = '載入中...'
  }

  const withLoading = async <T>(
    asyncFn: () => Promise<T>,
    text = '載入中...'
  ): Promise<T> => {
    startLoading(text)
    try {
      const result = await asyncFn()
      return result
    } finally {
      stopLoading()
    }
  }

  return {
    loading: computed(() => loading.value),
    loadingText: computed(() => loadingText.value),
    startLoading,
    stopLoading,
    withLoading
  }
}
```

## 請求重試機制

### 重試設定
```typescript
// src/api/retry.ts
export interface RetryConfig {
  maxAttempts: number
  delay: number
  backoffMultiplier: number
  retryableErrors: number[]
}

const defaultRetryConfig: RetryConfig = {
  maxAttempts: 3,
  delay: 1000,
  backoffMultiplier: 2,
  retryableErrors: [408, 429, 500, 502, 503, 504]
}

export class RequestRetry {
  private config: RetryConfig

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...defaultRetryConfig, ...config }
  }

  async execute<T>(requestFn: () => Promise<T>): Promise<T> {
    let lastError: Error

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        return await requestFn()
      } catch (error: any) {
        lastError = error

        // 檢查是否為可重試錯誤
        const isRetryable = error.response &&
          this.config.retryableErrors.includes(error.response.status)

        // 如果是最後一次嘗試或錯誤不可重試，拋出錯誤
        if (attempt === this.config.maxAttempts || !isRetryable) {
          throw error
        }

        // 計算延遲時間（指數退避）
        const delay = this.config.delay * Math.pow(this.config.backoffMultiplier, attempt - 1)

        console.warn(`Request failed (attempt ${attempt}/${this.config.maxAttempts}), retrying in ${delay}ms...`, error.message)

        // 等待後重試
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError!
  }
}
```

## API 狀態管理整合

### Store 中的錯誤處理
```typescript
// src/stores/device.ts
import { defineStore } from 'pinia'
import { deviceAPI } from '@/api/device'
import { useErrorHandler, useLoading } from '@/composables'
import type { Device, DeviceCreate, DeviceUpdate } from '@/types/device'

export const useDeviceStore = defineStore('device', {
  state: () => ({
    devices: [] as Device[],
    loading: false,
    error: null as string | null,
    // ... 其他狀態
  }),

  actions: {
    async fetchDevices() {
      const { withLoading } = useLoading()
      const { handleError, showErrorMessage } = useErrorHandler()

      try {
        this.error = null
        const response = await withLoading(
          () => deviceAPI.getAllDevices(),
          '載入設備資料中...'
        )

        this.devices = response.data
      } catch (error) {
        this.error = handleError(error).message
        showErrorMessage(handleError(error))
      }
    },

    async createDevice(deviceData: DeviceCreate) {
      const { withLoading } = useLoading()
      const { handleError, showErrorMessage, showSuccessMessage } = useErrorHandler()

      try {
        this.error = null
        await withLoading(
          () => deviceAPI.createDevice(deviceData),
          '建立設備中...'
        )

        showSuccessMessage('設備建立成功')
        await this.fetchDevices() // 重新載入列表
      } catch (error) {
        this.error = handleError(error).message
        showErrorMessage(handleError(error))
        throw error // 重新拋出以便上層處理
      }
    },

    async updateDevice(proxyid: number, deviceData: DeviceUpdate) {
      const { withLoading } = useLoading()
      const { handleError, showErrorMessage, showSuccessMessage } = useErrorHandler()

      try {
        this.error = null
        await withLoading(
          () => deviceAPI.updateDevice(proxyid, deviceData),
          '更新設備中...'
        )

        showSuccessMessage('設備更新成功')
        await this.fetchDevices() // 重新載入列表
      } catch (error) {
        this.error = handleError(error).message
        showErrorMessage(handleError(error))
        throw error
      }
    },

    async deleteDevice(proxyid: number) {
      const { withLoading } = useLoading()
      const { handleError, showErrorMessage, showSuccessMessage } = useErrorHandler()

      try {
        this.error = null
        await withLoading(
          () => deviceAPI.deleteDevice(proxyid),
          '刪除設備中...'
        )

        showSuccessMessage('設備刪除成功')
        await this.fetchDevices() // 重新載入列表
      } catch (error) {
        this.error = handleError(error).message
        showErrorMessage(handleError(error))
        throw error
      }
    }
  }
})
```

## 快取機制

### API 響應快取
```typescript
// src/api/cache.ts
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>()

  set<T>(key: string, data: T, ttl = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // 檢查是否過期
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // 清除過期項目
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

export const apiCache = new APICache()
```

### 整合快取到 API 服務
```typescript
// src/api/device.ts (更新版)
export class DeviceAPI extends BaseAPI {
  private cache = apiCache

  async getAllDevices(params?: DeviceQueryParams): Promise<PaginatedResponse<Device>> {
    const cacheKey = `devices:${JSON.stringify(params || {})}`

    // 嘗試從快取獲取
    const cached = this.cache.get<PaginatedResponse<Device>>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const response = await httpClient.get(this.baseUrl, { params })
      const result = this.handleResponse<PaginatedResponse<Device>>(response)

      // 快取結果（短 TTL，因為資料可能頻繁變更）
      this.cache.set(cacheKey, result, 30 * 1000) // 30 秒快取

      return result
    } catch (error) {
      this.handleError(error)
    }
  }

  // 當資料變更時清除相關快取
  async createDevice(deviceData: DeviceCreate): Promise<ApiResponse<Device>> {
    try {
      const response = await httpClient.post(this.baseUrl, deviceData)
      const result = this.handleResponse<ApiResponse<Device>>(response)

      // 清除設備列表快取
      this.cache.clear()

      return result
    } catch (error) {
      this.handleError(error)
    }
  }

  // 其他更新和刪除方法也需要清除快取
  async updateDevice(proxyid: number, deviceData: DeviceUpdate): Promise<ApiResponse<Device>> {
    try {
      const response = await httpClient.put(`${this.baseUrl}/${proxyid}`, deviceData)
      const result = this.handleResponse<ApiResponse<Device>>(response)

      this.cache.clear()
      return result
    } catch (error) {
      this.handleError(error)
    }
  }

  async deleteDevice(proxyid: number): Promise<ApiResponse<void>> {
    try {
      const response = await httpClient.delete(`${this.baseUrl}/${proxyid}`)
      const result = this.handleResponse<ApiResponse<void>>(response)

      this.cache.clear()
      return result
    } catch (error) {
      this.handleError(error)
    }
  }
}
```

這個 API 整合與錯誤處理規範提供了完整的網路請求處理、錯誤管理、載入狀態控制、重試機制和快取策略，為前端應用程式提供了堅固的後端通訊基礎設施。