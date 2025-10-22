import { configureStore } from '@reduxjs/toolkit'
import deviceSlice from './slices/deviceSlice'
import uiSlice from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    device: deviceSlice,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
  devTools: import.meta.env.VITE_ENABLE_REDUX_DEVTOOLS === 'true',
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch