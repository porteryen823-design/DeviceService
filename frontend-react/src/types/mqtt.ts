// MQTT 相關的類型定義

export interface MQTTConfig {
  host: string
  port: number
  protocol: 'ws' | 'wss'
  path?: string
  username?: string
  password?: string
  clientId: string
  reconnectEnabled: boolean
  reconnectMaxAttempts: number
  reconnectDelay: number
  loggingEnabled: boolean
}

export interface MQTTConnectionState {
  isConnected: boolean
  isConnecting: boolean
  isReconnecting: boolean
  connectionError: string | null
  reconnectAttempts: number
  lastConnected: string | null
  lastError: string | null
}

export interface MQTTMessage {
  topic: string
  payload: string
  timestamp: string
  qos?: number
  retain?: boolean
}

export interface MQTTSubscription {
  topic: string
  qos?: number
}

export interface MQTTStatusMessage {
  proxyid?: number
  message: string
  proxyServiceAlive?: string
  proxyServiceStart?: string
  controller_type?: string
  proxy_ip?: string
  proxy_port?: string
  remark?: string
  timestamp?: string
}

export interface MQTTLogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error'
  message: string
  details?: any
}

export interface MQTTState {
  config: MQTTConfig
  connection: MQTTConnectionState
  subscriptions: MQTTSubscription[]
  messages: MQTTMessage[]
  logs: MQTTLogEntry[]
  isEnabled: boolean
}