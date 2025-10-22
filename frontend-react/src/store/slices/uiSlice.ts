import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ThemeType } from '@/styles/theme'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

interface UiState {
  notifications: Notification[]
  loading: {
    global: boolean
    [key: string]: boolean
  }
  theme: ThemeType
}

const initialState: UiState = {
  notifications: [],
  loading: {
    global: false,
  },
  theme: 'light', // 預設主題為淺色
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const notification: Notification = {
        id: Date.now().toString(),
        duration: 5000,
        ...action.payload,
      }
      state.notifications.push(notification)
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      )
    },
    clearNotifications: (state) => {
      state.notifications = []
    },
    setLoading: (state, action: PayloadAction<{ key: string; loading: boolean }>) => {
      const { key, loading } = action.payload
      state.loading[key] = loading
    },
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.global = action.payload
    },
    setTheme: (state, action: PayloadAction<ThemeType>) => {
      state.theme = action.payload
    },
  },
})

export const {
  addNotification,
  removeNotification,
  clearNotifications,
  setLoading,
  setGlobalLoading,
  setTheme,
} = uiSlice.actions

export default uiSlice.reducer