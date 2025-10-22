import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/api/client'
import {
  ProxyStatusData,
  ProxyStatusSummary,
  ProxyStatusFilter,
  ProxyStatusSort,
  ProxyStatusListResponse,
  ProxyStatusType
} from '@/types/proxyStatus'

export const useProxyStatus = (autoRefreshInterval: number = 0) => {
  const [data, setData] = useState<ProxyStatusData[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [filter, setFilter] = useState<ProxyStatusFilter>({ status: 'all' })
  const [sort, setSort] = useState<ProxyStatusSort>({ field: 'proxyid', order: 'asc' })

  const fetchProxyStatus = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('Fetching proxy status from /ProxyStatus')
      const response = await apiClient.get<ProxyStatusData[]>('/ProxyStatus')
      console.log('Proxy status response:', response.data)

      if (Array.isArray(response.data)) {
        setData(response.data)
        setLastUpdated(new Date())
      } else {
        throw new Error('回應資料格式錯誤')
      }
    } catch (err: any) {
      console.error('獲取代理狀態失敗:', err)
      let errorMessage = '無法獲取代理狀態資料'

      if (err.message) {
        if (err.message.includes('無法連接到伺服器') ||
            err.message.includes('請求超時') ||
            err.message.includes('網路錯誤')) {
          errorMessage = err.message
        } else {
          errorMessage = '代理狀態載入失敗，請稍後再試'
        }
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  // 自動重新整理
  useEffect(() => {
    if (autoRefreshInterval > 0) {
      const interval = setInterval(fetchProxyStatus, autoRefreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [autoRefreshInterval, fetchProxyStatus])

  // 初始載入
  useEffect(() => {
    fetchProxyStatus()
  }, [fetchProxyStatus])

  // 篩選和排序資料
  const filteredAndSortedData = useCallback(() => {
    let filtered = [...data]

    // 套用篩選條件
    if (filter.status && filter.status !== 'all') {
      filtered = filtered.filter(item => {
        const status = getStatusType(item.message, item.proxyServiceAlive, item.proxyServiceStart)
        return status === filter.status
      })
    }

    if (filter.controllerType) {
      filtered = filtered.filter(item =>
        item.controller_type.toLowerCase().includes(filter.controllerType!.toLowerCase())
      )
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase()
      filtered = filtered.filter(item =>
        item.proxy_ip.toLowerCase().includes(searchLower) ||
        item.remark.toLowerCase().includes(searchLower) ||
        item.controller_type.toLowerCase().includes(searchLower) ||
        item.message.toLowerCase().includes(searchLower)
      )
    }

    // 套用排序
    filtered.sort((a, b) => {
      const aValue = a[sort.field]
      const bValue = b[sort.field]

      let comparison = 0
      if (aValue < bValue) comparison = -1
      if (aValue > bValue) comparison = 1

      return sort.order === 'desc' ? -comparison : comparison
    })

    return filtered
  }, [data, filter, sort])

  // 取得狀態類型
  const getStatusType = (message: string, proxyServiceAlive: string, proxyServiceStart: string): ProxyStatusType => {
    const isAlive = proxyServiceAlive === '1'
    const isStarted = proxyServiceStart === '1'

    if (message === 'OK' && isAlive && isStarted) {
      return 'running'
    } else if (message.startsWith('HTTP') || message.startsWith('Error')) {
      return 'error'
    } else if (message === 'NG_Timeout') {
      return 'timeout'
    } else if (!isAlive || !isStarted) {
      return 'stopped'
    } else {
      return 'unknown'
    }
  }

  // 取得狀態統計
  const getStatusSummary = useCallback((): ProxyStatusSummary => {
    const summary = {
      total: data.length,
      running: 0,
      stopped: 0,
      error: 0,
      timeout: 0,
      unknown: 0
    }

    data.forEach(item => {
      const status = getStatusType(item.message, item.proxyServiceAlive, item.proxyServiceStart)
      switch (status) {
        case 'running':
          summary.running++
          break
        case 'stopped':
          summary.stopped++
          break
        case 'error':
          summary.error++
          break
        case 'timeout':
          summary.timeout++
          break
        case 'unknown':
          summary.unknown++
          break
      }
    })

    return summary
  }, [data])

  return {
    data: filteredAndSortedData(),
    allData: data,
    loading,
    error,
    lastUpdated,
    filter,
    sort,
    summary: getStatusSummary(),
    refetch: fetchProxyStatus,
    setFilter,
    setSort,
    getStatusType
  }
}