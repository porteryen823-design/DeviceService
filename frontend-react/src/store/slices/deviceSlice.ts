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
      console.log('✏️ Redux Thunk: 開始更新設備:', { proxyid, device })
      if (!proxyid || proxyid <= 0) {
        throw new Error(`無效的設備 ID: ${proxyid}`)
      }
      const updatedDevice = await deviceAPI.updateDevice(proxyid, device)
      console.log('✅ Redux Thunk: 更新設備成功:', updatedDevice)
      return updatedDevice
    } catch (error: any) {
      console.error('❌ Redux Thunk: 更新設備失敗:', {
        proxyid,
        device,
        error: error.message,
        status: error.response?.status
      })
      return rejectWithValue(error.message || 'Failed to update device')
    }
  }
)

export const deleteDevice = createAsyncThunk(
  'device/deleteDevice',
  async (proxyid: number, { rejectWithValue }) => {
    try {
      console.log('🗑️ Redux Thunk: 開始刪除設備, proxyid:', proxyid)
      if (!proxyid || proxyid <= 0) {
        throw new Error(`無效的設備 ID: ${proxyid}`)
      }
      await deviceAPI.deleteDevice(proxyid)
      console.log('✅ Redux Thunk: 刪除設備成功, proxyid:', proxyid)
      return proxyid
    } catch (error: any) {
      console.error('❌ Redux Thunk: 刪除設備失敗:', {
        proxyid,
        error: error.message,
        status: error.response?.status
      })
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

        // 詳細記錄載入的設備資料結構
        const devices = action.payload.data || []
        console.log('📋 載入設備詳細資料:', {
          totalDevices: devices.length,
          responseFields: Object.keys(action.payload),
          pagination: {
            total: action.payload.total,
            page: action.payload.page,
            size: action.payload.size
          }
        })

        // 記錄每個設備的欄位結構
        if (devices.length > 0) {
          console.log('🔍 第一個設備欄位結構:', {
            allFields: Object.keys(devices[0]),
            hasProxyId: 'proxyid' in devices[0],
            proxyIdValue: devices[0].proxyid,
            proxyIdType: typeof devices[0].proxyid,
            dataTypes: Object.entries(devices[0]).map(([key, value]) => [key, typeof value])
          })
        }

        state.loading = false
        state.devices = devices
        state.pagination.total = action.payload.total
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
        // 觸發重新載入資料的標記
        state.pagination.total = state.pagination.total + 1
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
        // 更新總數
        state.pagination.total = Math.max(0, state.pagination.total - 1)
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