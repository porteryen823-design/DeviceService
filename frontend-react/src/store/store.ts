import { configureStore } from '@reduxjs/toolkit'
import deviceSlice from './slices/deviceSlice'
import uiSlice from './slices/uiSlice'
import mqttSlice from './slices/mqttSlice'

export const store = configureStore({
  reducer: {
    device: deviceSlice,
    ui: uiSlice,
    mqtt: mqttSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
  devTools: (import.meta.env as any).VITE_ENABLE_REDUX_DEVTOOLS === 'true',
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch