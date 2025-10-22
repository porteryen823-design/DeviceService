import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  MQTTState,
  MQTTConfig,
  MQTTConnectionState,
  MQTTMessage,
  MQTTLogEntry,
  MQTTSubscription
} from '@/types/mqtt'
import { createMQTTConfig } from '@/utils/mqttConfig'

// 初始狀態
const initialState: MQTTState = {
  config: createMQTTConfig(),
  connection: {
    isConnected: false,
    isConnecting: false,
    isReconnecting: false,
    connectionError: null,
    reconnectAttempts: 0,
    lastConnected: null,
    lastError: null
  },
  subscriptions: [],
  messages: [],
  logs: [],
  isEnabled: createMQTTConfig().reconnectEnabled
}

// MQTT Slice
const mqttSlice = createSlice({
  name: 'mqtt',
  initialState,
  reducers: {
    // 更新 MQTT 配置
    updateConfig: (state, action: PayloadAction<Partial<MQTTConfig>>) => {
      state.config = { ...state.config, ...action.payload }
    },

    // 更新連線狀態
    updateConnectionState: (state, action: PayloadAction<Partial<MQTTConnectionState>>) => {
      state.connection = { ...state.connection, ...action.payload }
    },

    // 新增訂閱
    addSubscription: (state, action: PayloadAction<MQTTSubscription>) => {
      const exists = state.subscriptions.some(sub => sub.topic === action.payload.topic)
      if (!exists) {
        state.subscriptions.push(action.payload)
      }
    },

    // 移除訂閱
    removeSubscription: (state, action: PayloadAction<string>) => {
      state.subscriptions = state.subscriptions.filter(sub => sub.topic !== action.payload)
    },

    // 更新訂閱列表
    updateSubscriptions: (state, action: PayloadAction<MQTTSubscription[]>) => {
      state.subscriptions = action.payload
    },

    // 新增訊息
    addMessage: (state, action: PayloadAction<MQTTMessage>) => {
      state.messages.unshift(action.payload)
      // 限制訊息數量為 1000 筆
      if (state.messages.length > 1000) {
        state.messages = state.messages.slice(0, 1000)
      }
    },

    // 清空訊息
    clearMessages: (state) => {
      state.messages = []
    },

    // 新增日誌
    addLog: (state, action: PayloadAction<MQTTLogEntry>) => {
      state.logs.unshift(action.payload)
      // 限制日誌數量為 100 筆
      if (state.logs.length > 100) {
        state.logs = state.logs.slice(0, 100)
      }
    },

    // 清空日誌
    clearLogs: (state) => {
      state.logs = []
    },

    // 設定 MQTT 啟用狀態
    setEnabled: (state, action: PayloadAction<boolean>) => {
      state.isEnabled = action.payload
    },

    // 重設連線狀態
    resetConnectionState: (state) => {
      state.connection = {
        isConnected: false,
        isConnecting: false,
        isReconnecting: false,
        connectionError: null,
        reconnectAttempts: 0,
        lastConnected: null,
        lastError: null
      }
    },

    // 重設整個狀態
    resetState: () => initialState
  }
})

// 匯出 actions
export const {
  updateConfig,
  updateConnectionState,
  addSubscription,
  removeSubscription,
  updateSubscriptions,
  addMessage,
  clearMessages,
  addLog,
  clearLogs,
  setEnabled,
  resetConnectionState,
  resetState
} = mqttSlice.actions

// 匯出 reducer
export default mqttSlice.reducer