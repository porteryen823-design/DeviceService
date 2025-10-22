import { MQTTConfig } from '@/types/mqtt'

// 生成帶時間戳的客戶端ID
function generateClientId(): string {
  const baseClientId = (import.meta.env as any).VITE_MQTT_CLIENT_ID || 'frontend_mqtt_client'

  // 根據當前頁面決定客戶端類型
  let clientType = 'general'
  if (typeof window !== 'undefined' && window.location) {
    const pathname = window.location.pathname

    if (pathname.includes('/proxy-status') || pathname.includes('/ProxyStatus')) {
      clientType = 'ProxyStatus'
    } else if (pathname.includes('/device') || pathname.includes('/DeviceManagement')) {
      clientType = 'devices'
    } else if (pathname.includes('/debug')) {
      clientType = 'debug'
    } else {
      clientType = 'general'
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0]
  return `${baseClientId}_${clientType}_${timestamp}`
}

// 從環境變數建立 MQTT 配置
export function createMQTTConfig(): MQTTConfig {
  const env = import.meta.env as any
  return {
    host: env.VITE_MQTT_HOST || 'localhost',
    port: parseInt(env.VITE_MQTT_PORT || '8093'),
    protocol: (env.VITE_MQTT_PROTOCOL as 'ws' | 'wss') || 'ws',
    path: env.VITE_MQTT_PATH || '/mqtt',
    username: env.VITE_MQTT_USERNAME || undefined,
    password: env.VITE_MQTT_PASSWORD || undefined,
    clientId: generateClientId(),
    reconnectEnabled: env.VITE_MQTT_RECONNECT_ENABLED === 'true',
    reconnectMaxAttempts: parseInt(env.VITE_MQTT_RECONNECT_MAX_ATTEMPTS || '5'),
    reconnectDelay: parseInt(env.VITE_MQTT_RECONNECT_DELAY || '3000'),
    loggingEnabled: env.VITE_MQTT_LOGGING_ENABLED === 'true'
  }
}

// 檢查 MQTT 是否啟用
export function isMQTTEnabled(): boolean {
  return (import.meta.env as any).VITE_MQTT_ENABLED === 'true'
}

// 取得 MQTT 連線 URL
export function getMQTTConnectionUrl(config: MQTTConfig): string {
  return `${config.protocol}://${config.host}:${config.port}${config.path}`
}