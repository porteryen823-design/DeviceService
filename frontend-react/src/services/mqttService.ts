import mqtt from 'mqtt'
import {
  MQTTConfig,
  MQTTConnectionState,
  MQTTMessage,
  MQTTSubscription,
  MQTTLogEntry,
  MQTTStatusMessage
} from '@/types/mqtt'

export class MQTTService {
  private client: mqtt.MqttClient | null = null
  private config: MQTTConfig
  private connectionState: MQTTConnectionState = {
    isConnected: false,
    isConnecting: false,
    isReconnecting: false,
    connectionError: null,
    reconnectAttempts: 0,
    lastConnected: null,
    lastError: null
  }
  private subscriptions: MQTTSubscription[] = []
  private messages: MQTTMessage[] = []
  private logs: MQTTLogEntry[] = []
  private reconnectTimer: NodeJS.Timeout | null = null
  private maxLogEntries = 100

  // 狀態監聽器
  private connectionStateListeners: ((state: MQTTConnectionState) => void)[] = []
  private messageListeners: ((message: MQTTMessage) => void)[] = []
  private logListeners: ((log: MQTTLogEntry) => void)[] = []

  constructor(config: MQTTConfig) {
    this.config = config
  }

  // 連線到 MQTT Broker
  async connect(): Promise<void> {
    if (this.connectionState.isConnected || this.connectionState.isConnecting) {
      this.log('info', 'MQTT 客戶端已在連線中或已連線')
      return
    }

    this.updateConnectionState({
      isConnecting: true,
      connectionError: null
    })

    try {
      const connectUrl = `${this.config.protocol}://${this.config.host}:${this.config.port}${this.config.path || '/mqtt'}`

      const options: mqtt.IClientOptions = {
        clientId: this.config.clientId,
        reconnectPeriod: this.config.reconnectEnabled ? this.config.reconnectDelay : 0,
        connectTimeout: 30000,
        clean: true,
        username: this.config.username || undefined,
        password: this.config.password || undefined
      }

      this.log('info', `嘗試連接到 MQTT Broker: ${connectUrl}`)

      this.client = mqtt.connect(connectUrl, options)

      return new Promise((resolve, reject) => {
        if (!this.client) {
          reject(new Error('無法建立 MQTT 客戶端'))
          return
        }

        // 連線成功
        this.client.on('connect', () => {
          this.updateConnectionState({
            isConnected: true,
            isConnecting: false,
            isReconnecting: false,
            connectionError: null,
            reconnectAttempts: 0,
            lastConnected: new Date().toISOString(),
            lastError: null
          })

          this.log('info', '成功連接到 MQTT Broker')

          // 訂閱預設主題
          this.subscribeToDefaultTopics()

          resolve()
        })

        // 連線失敗
        this.client.on('error', (error) => {
          const errorMessage = `MQTT 連線錯誤: ${error.message}`
          this.updateConnectionState({
            isConnected: false,
            isConnecting: false,
            connectionError: errorMessage,
            lastError: new Date().toISOString()
          })

          this.log('error', errorMessage, error)
          reject(error)
        })

        // 離線
        this.client.on('offline', () => {
          this.updateConnectionState({
            isConnected: false,
            isReconnecting: this.config.reconnectEnabled
          })

          this.log('warn', 'MQTT 客戶端離線')
        })

        // 重新連線嘗試
        this.client.on('reconnect', () => {
          this.updateConnectionState({
            isReconnecting: true,
            reconnectAttempts: this.connectionState.reconnectAttempts + 1
          })

          this.log('info', `嘗試重新連接到 MQTT Broker (第 ${this.connectionState.reconnectAttempts + 1} 次)`)
        })

        // 訊息接收
        this.client.on('message', (topic: string, payload: Buffer) => {
          this.handleMessage(topic, payload)
        })

        // 連線關閉
        this.client.on('close', () => {
          this.updateConnectionState({
            isConnected: false,
            isReconnecting: false
          })

          this.log('info', 'MQTT 連線已關閉')

          // 如果啟用自動重新連線，開始重新連線計時器
          if (this.config.reconnectEnabled && this.connectionState.reconnectAttempts < this.config.reconnectMaxAttempts) {
            this.startReconnectTimer()
          }
        })
      })
    } catch (error) {
      const errorMessage = `MQTT 服務初始化失敗: ${error instanceof Error ? error.message : '未知錯誤'}`
      this.updateConnectionState({
        isConnecting: false,
        connectionError: errorMessage,
        lastError: new Date().toISOString()
      })

      this.log('error', errorMessage, error)
      throw error
    }
  }

  // 斷開連線
  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.client) {
      return new Promise((resolve) => {
        this.client!.end(false, {}, () => {
          this.client = null
          this.updateConnectionState({
            isConnected: false,
            isConnecting: false,
            isReconnecting: false,
            connectionError: null,
            reconnectAttempts: 0
          })

          this.log('info', 'MQTT 連線已斷開')
          resolve()
        })
      })
    }
  }

  // 訂閱主題
  subscribe(topic: string, qos: number = 0): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.connectionState.isConnected) {
        reject(new Error('MQTT 客戶端未連線'))
        return
      }

      this.client.subscribe(topic, { qos }, (error) => {
        if (error) {
          this.log('error', `訂閱主題失敗: ${topic}`, error)
          reject(error)
        } else {
          this.subscriptions.push({ topic, qos })
          this.log('info', `成功訂閱主題: ${topic}`)
          resolve()
        }
      })
    })
  }

  // 取消訂閱主題
  unsubscribe(topic: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.connectionState.isConnected) {
        reject(new Error('MQTT 客戶端未連線'))
        return
      }

      this.client.unsubscribe(topic, (error) => {
        if (error) {
          this.log('error', `取消訂閱主題失敗: ${topic}`, error)
          reject(error)
        } else {
          this.subscriptions = this.subscriptions.filter(sub => sub.topic !== topic)
          this.log('info', `成功取消訂閱主題: ${topic}`)
          resolve()
        }
      })
    })
  }

  // 發送訊息
  publish(topic: string, message: string, qos: number = 0, retain: boolean = false): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.connectionState.isConnected) {
        reject(new Error('MQTT 客戶端未連線'))
        return
      }

      this.client.publish(topic, message, { qos, retain }, (error) => {
        if (error) {
          this.log('error', `發送訊息失敗: ${topic}`, error)
          reject(error)
        } else {
          this.log('info', `成功發送訊息到主題: ${topic}`)
          resolve()
        }
      })
    })
  }

  // 處理接收到的訊息
  private handleMessage(topic: string, payload: Buffer): void {
    try {
      const messageStr = payload.toString()
      const message: MQTTMessage = {
        topic,
        payload: messageStr,
        timestamp: new Date().toISOString()
      }

      // 將訊息加入訊息列表
      this.messages.unshift(message)

      // 限制訊息數量
      if (this.messages.length > 1000) {
        this.messages = this.messages.slice(0, 1000)
      }

      // 觸發訊息監聽器
      this.messageListeners.forEach(listener => {
        try {
          listener(message)
        } catch (error) {
          this.log('error', '訊息監聽器執行錯誤', error)
        }
      })

      // 特別處理狀態主題訊息
      if (topic.startsWith('mcs/events/ProxyService/status/')) {
        this.handleStatusMessage(topic, messageStr)
      }

      this.log('info', `收到訊息: ${topic}`, message)
    } catch (error) {
      this.log('error', '處理 MQTT 訊息時發生錯誤', error)
    }
  }

  // 處理狀態訊息
  private handleStatusMessage(topic: string, payload: string): void {
    try {
      const statusData: MQTTStatusMessage = JSON.parse(payload)
      console.log('收到代理服務狀態更新:', statusData)

      // 在這裡可以加入額外的狀態處理邏輯
      // 例如更新 Redux 狀態、觸發通知等
    } catch (error) {
      this.log('error', '解析狀態訊息失敗', error)
    }
  }

  // 訂閱預設主題
  private subscribeToDefaultTopics(): void {
    // 訂閱用戶指定的主題
    this.subscribe('mcs/events/ProxyService/status/+').catch(error => {
      this.log('error', '訂閱預設主題失敗', error)
    })
  }

  // 開始重新連線計時器
  private startReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }

    this.reconnectTimer = setTimeout(() => {
      if (!this.connectionState.isConnected && this.connectionState.reconnectAttempts < this.config.reconnectMaxAttempts) {
        this.log('info', `開始第 ${this.connectionState.reconnectAttempts + 1} 次重新連線嘗試`)
        this.connect().catch(error => {
          this.log('error', '自動重新連線失敗', error)
        })
      }
    }, this.config.reconnectDelay)
  }

  // 更新連線狀態
  private updateConnectionState(updates: Partial<MQTTConnectionState>): void {
    this.connectionState = { ...this.connectionState, ...updates }
    this.connectionStateListeners.forEach(listener => {
      try {
        listener(this.connectionState)
      } catch (error) {
        this.log('error', '連線狀態監聽器執行錯誤', error)
      }
    })
  }

  // 新增日誌
  private log(level: 'info' | 'warn' | 'error', message: string, details?: any): void {
    const logEntry: MQTTLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      details
    }

    this.logs.unshift(logEntry)

    // 限制日誌數量
    if (this.logs.length > this.maxLogEntries) {
      this.logs = this.logs.slice(0, this.maxLogEntries)
    }

    // 觸發日誌監聽器
    this.logListeners.forEach(listener => {
      try {
        listener(logEntry)
      } catch (error) {
        console.error('日誌監聽器執行錯誤:', error)
      }
    })

    // 同時輸出到瀏覽器主控台
    if (this.config.loggingEnabled) {
      const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'
      console[consoleMethod](`[MQTT] ${message}`, details || '')
    }
  }

  // 取得連線狀態
  getConnectionState(): MQTTConnectionState {
    return { ...this.connectionState }
  }

  // 取得訊息歷史
  getMessages(): MQTTMessage[] {
    return [...this.messages]
  }

  // 取得日誌歷史
  getLogs(): MQTTLogEntry[] {
    return [...this.logs]
  }

  // 取得訂閱列表
  getSubscriptions(): MQTTSubscription[] {
    return [...this.subscriptions]
  }

  // 取得設定
  getConfig(): MQTTConfig {
    return { ...this.config }
  }

  // 新增連線狀態監聽器
  addConnectionStateListener(listener: (state: MQTTConnectionState) => void): () => void {
    this.connectionStateListeners.push(listener)
    return () => {
      const index = this.connectionStateListeners.indexOf(listener)
      if (index > -1) {
        this.connectionStateListeners.splice(index, 1)
      }
    }
  }

  // 新增訊息監聽器
  addMessageListener(listener: (message: MQTTMessage) => void): () => void {
    this.messageListeners.push(listener)
    return () => {
      const index = this.messageListeners.indexOf(listener)
      if (index > -1) {
        this.messageListeners.splice(index, 1)
      }
    }
  }

  // 新增日誌監聽器
  addLogListener(listener: (log: MQTTLogEntry) => void): () => void {
    this.logListeners.push(listener)
    return () => {
      const index = this.logListeners.indexOf(listener)
      if (index > -1) {
        this.logListeners.splice(index, 1)
      }
    }
  }
}