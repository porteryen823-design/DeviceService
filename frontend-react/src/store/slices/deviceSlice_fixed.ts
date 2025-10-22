import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { deviceAPI } from '@/api/device'
import type { Device, DeviceCreate, DeviceUpdate, DeviceQueryParams } from '@/types/device'

interface DeviceState {
  devices: Device[]
  loading: boolean
  error: string | null
  currentDevice: Device | null
  dialogMode: 'create' | 'update' | 'delete'
  dialogOpen: boolean
  searchQuery: string
  pagination: {
    page: number
    size: number
    total: number
  }
  selectedDevices: number[]
}

const initialState: DeviceState = {
  devices: [],
  loading: false,
  error: null,
  currentDevice: null,
  dialogMode: 'create',
  dialogOpen: false,
  searchQuery: '',
  pagination: {
    page: 1,
    size: 20,
    total: 0,
  },
  selectedDevices: [],
}

// Async thunks
export const fetchDevices = createAsyncThunk(
  'device/fetchDevices',
  async (params: DeviceQueryParams = {}, { rejectWithValue }) => {
    try {
      console.log('🚀 Redux Thunk: 開始執行 fetchDevices', params)
      const response = await deviceAPI.getAllDevices(params)
      console.log('✅ Redux Thunk: API 請求成功，返回資料:', response)
      return response
    } catch (error: any) {
      console.error('❌ Redux Thunk: API 請求失敗:', error)
      return rejectWithValue(error.message || 'Failed to fetch devices')
    }
  }
)

export const fetchDevice = createAsyncThunk(
  'device/fetchDevice',
  async (proxyid: number, { rejectWithValue }) => {
    try {
      const device = await deviceAPI.getDevice(proxyid)
      return device
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch device')
    }
  }
)

export const createDevice = createAsyncThunk(
  'device/createDevice',
  async (device: DeviceCreate, { rejectWithValue }) => {
    try {
      const newDevice = await deviceAPI.createDevice(device)
      return newDevice
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create device')
    }
  }
)

export const updateDevice = createAsyncThunk(
  'device/updateDevice',
  async ({ proxyid, device }: { proxyid: number; device: DeviceUpdate }, { rejectWithValue }) => {
    try {
      const updatedDevice = await deviceAPI.updateDevice(proxyid, device)
      return updatedDevice
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update device')
    }
  }
)

export const deleteDevice = createAsyncThunk(
  'device/deleteDevice',
  async (proxyid: number, { rejectWithValue }) => {
    try {
      await deviceAPI.deleteDevice(proxyid)
      return proxyid
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete device')
    }
  }
)

const deviceSlice = createSlice({
  name: 'device',
  initialState,
  reducers: {
    setDialogMode: (state, action: PayloadAction<'create' | 'update' | 'delete'>) => {
      state.dialogMode = action.payload
    },
    setDialogOpen: (state, action: PayloadAction<boolean>) => {
      state.dialogOpen = action.payload
    },
    setCurrentDevice: (state, action: PayloadAction<Device | null>) => {
      state.currentDevice = action.payload
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
      state.pagination.page = 1 // Reset to first page when searching
    },
    setPagination: (state, action: PayloadAction<Partial<DeviceState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
    toggleDeviceSelection: (state, action: PayloadAction<number>) => {
      const proxyid = action.payload
      const index = state.selectedDevices.indexOf(proxyid)
      if (index > -1) {
        state.selectedDevices.splice(index, 1)
      } else {
        state.selectedDevices.push(proxyid)
      }
    },
    clearDeviceSelection: (state) => {
      state.selectedDevices = []
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch devices
      .addCase(fetchDevices.pending, (state) => {
        console.log('🔄 Redux Reducer: fetchDevices.pending')
        state.loading = true
        state.error = null
      })
      .addCase(fetchDevices.fulfilled, (state, action) => {
        console.log('✅ Redux Reducer: fetchDevices.fulfilled', action.payload)
        state.loading = false
        state.devices = action.payload.data
        state.pagination.total = action.payload.total
        console.log('🔄 Redux 狀態更新:', {
          devicesCount: action.payload.data?.length || 0,
          total: action.payload.total,
          page: action.payload.page,
          size: action.payload.size,
          firstDevice: action.payload.data?.[0] || null
        })
      })
      .addCase(fetchDevices.rejected, (state, action) => {
        console.error('❌ Redux Reducer: fetchDevices.rejected', action.payload)
        state.loading = false
        state.error = action.payload as string
      })
      // Create device
      .addCase(createDevice.fulfilled, (state, action) => {
        state.devices.unshift(action.payload)
        state.dialogOpen = false
        state.currentDevice = null
      })
      // Update device
      .addCase(updateDevice.fulfilled, (state, action) => {
        const index = state.devices.findIndex(device => device.proxyid === action.payload.proxyid)
        if (index !== -1) {
          state.devices[index] = action.payload
        }
        state.dialogOpen = false
        state.currentDevice = null
      })
      // Delete device
      .addCase(deleteDevice.fulfilled, (state, action) => {
        state.devices = state.devices.filter(device => device.proxyid !== action.payload)
        state.selectedDevices = state.selectedDevices.filter(id => id !== action.payload)
        state.dialogOpen = false
        state.currentDevice = null
      })
  },
})

export const {
  setDialogMode,
  setDialogOpen,
  setCurrentDevice,
  setSearchQuery,
  setPagination,
  toggleDeviceSelection,
  clearDeviceSelection,
  clearError,
} = deviceSlice.actions

export default deviceSlice.reducer