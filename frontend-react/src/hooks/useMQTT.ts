import { useEffect, useRef, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { MQTTService } from '@/services/mqttService'
import { createMQTTConfig, isMQTTEnabled } from '@/utils/mqttConfig'
import {
  updateConnectionState,
  addMessage,
  addLog,
  updateSubscriptions,
  setEnabled
} from '@/store/slices/mqttSlice'
import { MQTTMessage, MQTTLogEntry, MQTTConnectionState } from '@/types/mqtt'

export interface UseMQTTReturn {
  // 連線狀態
  connectionState: MQTTConnectionState
  isConnected: boolean
  isConnecting: boolean
  connectionError: string | null

  // MQTT 服務實例
  mqttService: MQTTService | null

  // 操作方法
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  subscribe: (topic: string, qos?: number) => Promise<void>
  unsubscribe: (topic: string) => Promise<void>
  publish: (topic: string, message: string, qos?: number, retain?: boolean) => Promise<void>

  // 資料
  messages: MQTTMessage[]
  logs: MQTTLogEntry[]
  subscriptions: string[]

  // 設定
  isEnabled: boolean
  setEnabled: (enabled: boolean) => void

  // 清空資料
  clearMessages: () => void
  clearLogs: () => void
}

export function useMQTT(autoConnect: boolean = false): UseMQTTReturn {
  const dispatch = useDispatch()
  const mqttServiceRef = useRef<MQTTService | null>(null)

  // 從 Redux 取得狀態
  const connectionState = useSelector((state: RootState) => state.mqtt.connection)
  const messages = useSelector((state: RootState) => state.mqtt.messages)
  const logs = useSelector((state: RootState) => state.mqtt.logs)
  const subscriptions = useSelector((state: RootState) => state.mqtt.subscriptions)
  const isEnabled = useSelector((state: RootState) => state.mqtt.isEnabled)

  // 初始化 MQTT 服務
  useEffect(() => {
    if (!isMQTTEnabled()) {
      dispatch(setEnabled(false))
      return
    }

    const config = createMQTTConfig()
    mqttServiceRef.current = new MQTTService(config)

    const service = mqttServiceRef.current

    // 設定狀態監聽器
    const removeConnectionListener = service.addConnectionStateListener((state) => {
      dispatch(updateConnectionState(state))
    })

    // 設定訊息監聽器
    const removeMessageListener = service.addMessageListener((message) => {
      dispatch(addMessage(message))
    })

    // 設定日誌監聽器
    const removeLogListener = service.addLogListener((log) => {
      dispatch(addLog(log))
    })

    // 更新訂閱列表
    dispatch(updateSubscriptions(service.getSubscriptions()))

    // 自動連線（如果啟用且 autoConnect 為 true）
    if (isEnabled && autoConnect) {
      service.connect().catch(error => {
        console.error('MQTT 自動連線失敗:', error)
      })
    }

    // 清理函數
    return () => {
      removeConnectionListener()
      removeMessageListener()
      removeLogListener()
      service.disconnect()
    }
  }, [dispatch])

  // 當啟用狀態改變時處理連線
  useEffect(() => {
    const service = mqttServiceRef.current
    if (!service) return

    if (isEnabled && !connectionState.isConnected && !connectionState.isConnecting) {
      service.connect().catch(error => {
        console.error('MQTT 連線失敗:', error)
      })
    } else if (!isEnabled && connectionState.isConnected) {
      service.disconnect()
    }
  }, [isEnabled, connectionState.isConnected, connectionState.isConnecting])

  // 連線函數
  const connect = useCallback(async () => {
    const service = mqttServiceRef.current
    if (!service) {
      throw new Error('MQTT 服務未初始化')
    }

    await service.connect()
  }, [])

  // 斷開連線函數
  const disconnect = useCallback(async () => {
    const service = mqttServiceRef.current
    if (!service) {
      throw new Error('MQTT 服務未初始化')
    }

    await service.disconnect()
  }, [])

  // 訂閱主題函數
  const subscribe = useCallback(async (topic: string, qos: number = 0) => {
    const service = mqttServiceRef.current
    if (!service) {
      throw new Error('MQTT 服務未初始化')
    }

    await service.subscribe(topic, qos)
    dispatch(updateSubscriptions(service.getSubscriptions()))
  }, [dispatch])

  // 取消訂閱主題函數
  const unsubscribe = useCallback(async (topic: string) => {
    const service = mqttServiceRef.current
    if (!service) {
      throw new Error('MQTT 服務未初始化')
    }

    await service.unsubscribe(topic)
    dispatch(updateSubscriptions(service.getSubscriptions()))
  }, [dispatch])

  // 發送訊息函數
  const publish = useCallback(async (topic: string, message: string, qos: number = 0, retain: boolean = false) => {
    const service = mqttServiceRef.current
    if (!service) {
      throw new Error('MQTT 服務未初始化')
    }

    await service.publish(topic, message, qos, retain)
  }, [])

  // 設定啟用狀態函數
  const handleSetEnabled = useCallback((enabled: boolean) => {
    dispatch(setEnabled(enabled))
  }, [dispatch])

  // 清空訊息函數
  const clearMessages = useCallback(() => {
    // 這裡可以加入清空訊息的 action
    // dispatch(clearMessages())
  }, [])

  // 清空日誌函數
  const clearLogs = useCallback(() => {
    // 這裡可以加入清空日誌的 action
    // dispatch(clearLogs())
  }, [])

  return {
    // 連線狀態
    connectionState,
    isConnected: connectionState.isConnected,
    isConnecting: connectionState.isConnecting,
    connectionError: connectionState.connectionError,

    // MQTT 服務實例
    mqttService: mqttServiceRef.current,

    // 操作方法
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    publish,

    // 資料
    messages,
    logs,
    subscriptions: subscriptions.map(sub => sub.topic),

    // 設定
    isEnabled,
    setEnabled: handleSetEnabled,

    // 清空資料
    clearMessages,
    clearLogs
  }
}