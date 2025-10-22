import { apiClient } from './client'
import type { Device, DeviceCreate, DeviceUpdate, DeviceQueryParams, DeviceListResponse } from '@/types/device'

// ProxyStatus 相關的類型定義
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

// 注意：後端 API 路由就是 /DeviceServiceConfig，不是 /api/DeviceServiceConfig
export class DeviceAPI {
  async getAllDevices(params: DeviceQueryParams = {}): Promise<DeviceListResponse> {
    const searchParams = new URLSearchParams()

    if (params.page) searchParams.append('page', params.page.toString())
    if (params.size) searchParams.append('size', params.size.toString())
    if (params.search) searchParams.append('search', params.search)
    if (params.sortBy) searchParams.append('sortBy', params.sortBy)
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder)

    const queryString = searchParams.toString()
    // 直接使用後端路由，不加 /api 前綴
    const url = queryString
      ? `/DeviceServiceConfig?${queryString}`
      : `/DeviceServiceConfig`

    console.log('🚀 API 請求開始:', {
      url,
      method: 'GET',
      params
    })

    try {
      const response = await apiClient.get(url)
      console.log('✅ API 請求成功:', {
        url,
        status: response.status,
        data: response.data
      })

      // 添加詳細的資料結構分析
      if (response.data && response.data.data) {
        console.log('📊 設備資料分析:', {
          totalDevices: response.data.data.length,
          firstDevice: response.data.data[0] || null,
          firstDeviceFields: response.data.data[0] ? Object.keys(response.data.data[0]) : [],
          firstDeviceProxyId: response.data.data[0]?.proxyid || 'undefined',
          responseFields: Object.keys(response.data)
        })
      }

      return response.data
    } catch (error: any) {
      console.error('❌ API 請求失敗:', {
        url,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      })
      throw error
    }
  }

  async getDevice(proxyid: number): Promise<Device> {
    const url = `/DeviceServiceConfig/${proxyid}`
    console.log('🚀 獲取單個設備請求:', { proxyid, url })

    try {
      const response = await apiClient.get(url)
      console.log('✅ 獲取設備成功:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ 獲取設備失敗:', {
        proxyid,
        error: error.message,
        status: error.response?.status
      })
      throw error
    }
  }

  async createDevice(device: DeviceCreate): Promise<Device> {
    console.log('🚀 創建設備請求:', device)
    console.log('📋 請求資料結構:', {
      hasProxyId: 'proxyid' in device,
      proxyIdValue: device.proxyid,
      allFields: Object.keys(device),
      dataTypes: Object.entries(device).map(([key, value]) => [key, typeof value])
    })

    try {
      const response = await apiClient.post(`/DeviceServiceConfig`, device)
      console.log('✅ 創建設備成功:', response.data)
      console.log('📋 響應資料結構:', {
        hasProxyId: 'proxyid' in response.data,
        proxyIdValue: response.data.proxyid,
        allFields: Object.keys(response.data)
      })
      return response.data
    } catch (error: any) {
      console.error('❌ 創建設備失敗:', {
        device,
        error: error.message,
        status: error.response?.status,
        responseData: error.response?.data
      })
      throw error
    }
  }

  async updateDevice(proxyid: number, device: DeviceUpdate): Promise<Device> {
    console.log('🚀 更新設備請求:', { proxyid, device })

    try {
      const response = await apiClient.put(`/DeviceServiceConfig/${proxyid}`, device)
      console.log('✅ 更新設備成功:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ 更新設備失敗:', {
        proxyid,
        device,
        error: error.message,
        status: error.response?.status
      })
      throw error
    }
  }

  async deleteDevice(proxyid: number): Promise<void> {
    console.log('🚀 刪除設備請求:', { proxyid })

    try {
      await apiClient.delete(`/DeviceServiceConfig/${proxyid}`)
      console.log('✅ 刪除設備成功:', { proxyid })
    } catch (error: any) {
      console.error('❌ 刪除設備失敗:', {
        proxyid,
        error: error.message,
        status: error.response?.status
      })
      throw error
    }
  }

  async batchDeleteDevices(proxyids: number[]): Promise<void> {
    console.log('🚀 批次刪除設備請求:', { proxyids })

    try {
      await apiClient.delete(`/DeviceServiceConfig/batch`, {
        data: { proxyids }
      })
      console.log('✅ 批次刪除設備成功:', { proxyids })
    } catch (error: any) {
      console.error('❌ 批次刪除設備失敗:', {
        proxyids,
        error: error.message,
        status: error.response?.status
      })
      throw error
    }
  }

  async batchUpdateDevices(updates: Array<{ proxyid: number; device: Partial<DeviceUpdate> }>): Promise<Device[]> {
    console.log('🚀 批次更新設備請求:', { updates })

    try {
      const response = await apiClient.put(`/DeviceServiceConfig/batch`, { updates })
      console.log('✅ 批次更新設備成功:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ 批次更新設備失敗:', {
        updates,
        error: error.message,
        status: error.response?.status
      })
      throw error
    }
  }

  // ProxyStatus 相關方法
  async getAllProxyStatus(): Promise<ProxyStatusData[]> {
    console.log('🚀 獲取所有代理狀態請求')

    try {
      const response = await apiClient.get('/ProxyStatus')
      console.log('✅ 獲取代理狀態成功:', response.data)

      // 確保返回陣列格式
      if (Array.isArray(response.data)) {
        return response.data
      } else {
        console.warn('⚠️ 代理狀態回應不是陣列格式:', response.data)
        return []
      }
    } catch (error: any) {
      console.error('❌ 獲取代理狀態失敗:', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      })
      throw error
    }
  }

  async getProxyStatus(proxyid: number): Promise<ProxyStatusData> {
    console.log('🚀 獲取單個代理狀態請求:', { proxyid })

    try {
      const response = await apiClient.get(`/ProxyStatus/${proxyid}`)
      console.log('✅ 獲取代理狀態成功:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ 獲取代理狀態失敗:', {
        proxyid,
        error: error.message,
        status: error.response?.status
      })
      throw error
    }
  }
}

// Export singleton instance
export const deviceAPI = new DeviceAPI()