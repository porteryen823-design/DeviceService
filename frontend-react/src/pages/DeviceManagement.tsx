import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Container, Typography, Paper, Alert, Box, Button, Snackbar } from '@mui/material'
import { AppDispatch, RootState } from '@/store/store'
import {
  fetchDevices,
  deleteDevice,
  setDialogMode,
  setDialogOpen,
  setCurrentDevice,
  clearError,
  createDevice,
  updateDevice
} from '@/store/slices/deviceSlice'
import { Device } from '@/types/device'
import DeviceTable from '@/components/DeviceTable'
import LoadingSpinner from '@/components/common/LoadingSpinner'

const DeviceManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { devices, loading, error } = useSelector((state: RootState) => state.device)
  const [refreshTrigger, setRefreshTrigger] = React.useState(0)

  useEffect(() => {
    console.log('🔄 嘗試載入設備資料...')
    dispatch(fetchDevices())
  }, [dispatch, refreshTrigger])

  // 監聽頁面重新獲得焦點時重新載入資料
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 頁面重新獲得焦點，重新載入設備資料...')
        setRefreshTrigger(prev => prev + 1)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const handleRetry = () => {
    console.log('🔄 重新嘗試載入設備資料...')
    dispatch(fetchDevices())
  }

  const handleEdit = (device: Device) => {
    console.log('✏️ 編輯設備:', device)
    console.log('✏️ 設備 proxyid:', device.proxyid)
    dispatch(setCurrentDevice(device))
    dispatch(setDialogMode('update'))
    dispatch(setDialogOpen(true))
  }

  const handleDelete = (device: Device) => {
    console.log('🗑️ 刪除設備:', device)
    console.log('🗑️ 設備 proxyid:', device.proxyid)
    if (!device.proxyid) {
      console.error('❌ 無法刪除：設備 proxyid 為空')
      return
    }
    dispatch(deleteDevice(device.proxyid))
  }

  const handleToggleEnable = (device: Device) => {
    console.log('🔄 切換設備狀態:', device)
    // 這裡可以調用一個切換啟用狀態的 action
    // dispatch(toggleDeviceEnable(device.proxyid))
  }

  const handleCreate = () => {
    console.log('➕ 創建新設備')
    dispatch(setCurrentDevice(null))
    dispatch(setDialogMode('create'))
    dispatch(setDialogOpen(true))
  }

  const handleCloseError = () => {
    dispatch(clearError())
  }

  const handleRefresh = () => {
    console.log('🔄 手動重新載入設備資料...')
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      <Paper
        sx={{
          p: 4,
          borderRadius: 2,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography
                variant="h4"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1,
                }}
              >
                設備服務管理系統
              </Typography>
              <Typography variant="body1" color="text.secondary">
                管理和監控您的設備服務狀態
              </Typography>
            </Box>
            <Button
              variant="outlined"
              onClick={handleRefresh}
              disabled={loading}
              sx={{ borderRadius: 2 }}
            >
              重新載入資料
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3, borderRadius: 2 }}
            onClose={handleCloseError}
          >
            <Typography variant="body2">
              載入失敗: {error}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Button size="small" onClick={handleRetry} variant="outlined">
                重新嘗試
              </Button>
            </Box>
          </Alert>
        )}

        {loading ? (
          <LoadingSpinner message="載入設備資料中..." />
        ) : devices && Array.isArray(devices) && devices.length > 0 ? (
          <DeviceTable
            devices={devices}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleEnable={handleToggleEnable}
            onCreate={handleCreate}
          />
        ) : !error ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              bgcolor: 'grey.50',
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              沒有設備資料
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              目前沒有任何設備資料，請新增第一個設備。
            </Typography>
            <Button
              variant="contained"
              startIcon={<Button>新增設備</Button>}
              onClick={handleCreate}
              sx={{
                borderRadius: 2,
                px: 4,
                background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              }}
            >
              新增設備
            </Button>
          </Box>
        ) : null}
      </Paper>

      {/* 錯誤訊息 Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseError}
          severity="error"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default DeviceManagement