import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Grid,
  Typography,
  Box,
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { AppDispatch, RootState } from '@/store/store'
import {
  setDialogOpen,
  setDialogMode,
  setCurrentDevice,
  createDevice,
  updateDevice,
} from '@/store/slices/deviceSlice'
import { Device, DeviceCreate } from '@/types/device'

// 表單驗證規則
const deviceSchema = yup.object({
  proxy_ip: yup.string().required('代理 IP 為必填').matches(
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    '請輸入有效的 IP 地址'
  ),
  proxy_port: yup.number().required('代理端口為必填').min(1, '端口號必須大於 0').max(65535, '端口號不能超過 65535'),
  Controller_type: yup.string().required('控制器類型為必填'),
  Controller_ip: yup.string().required('控制器 IP 為必填').matches(
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    '請輸入有效的 IP 地址'
  ),
  Controller_port: yup.number().required('控制器端口為必填').min(1, '端口號必須大於 0').max(65535, '端口號不能超過 65535'),
  remark: yup.string(),
  enable: yup.boolean(),
  createUser: yup.string().required('創建用戶為必填'),
})

const controllerTypes = [
  'E82',
  'E88',
  'E88STK',
  'E88ESTK',
  'E88ESTKLK',
  'AEI',
  'PLC',
  'SCADA',
  'DCS',
  'HMI',
  'RTU',
  '其他',
]

const DeviceDialog: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { dialogOpen, dialogMode, currentDevice } = useSelector((state: RootState) => state.device)

  const isEdit = dialogMode === 'update' && currentDevice

  const getDefaultValues = (isEditMode = false): DeviceCreate => ({
    proxy_ip: '',
    proxy_port: 0,
    Controller_type: '',
    Controller_ip: isEditMode ? '' : '127.0.0.1', // 新增時預設為 127.0.0.1
    Controller_port: isEditMode ? 0 : 5555, // 新增時預設為 5555
    remark: '',
    enable: true,
    createUser: 'admin',
  })

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DeviceCreate>({
    resolver: yupResolver(deviceSchema),
    defaultValues: getDefaultValues(),
  })

  // 當對話框打開且有當前設備時，重置表單
  useEffect(() => {
    if (dialogOpen && currentDevice && dialogMode === 'update') {
      reset({
        proxy_ip: currentDevice.proxy_ip,
        proxy_port: currentDevice.proxy_port,
        Controller_type: currentDevice.Controller_type,
        Controller_ip: currentDevice.Controller_ip,
        Controller_port: currentDevice.Controller_port,
        remark: currentDevice.remark || '',
        enable: currentDevice.enable === 1,
        createUser: currentDevice.createUser,
      })
    } else if (dialogOpen && dialogMode === 'create') {
      reset({
        proxy_ip: '',
        proxy_port: 0,
        Controller_type: '',
        Controller_ip: '127.0.0.1',
        Controller_port: 5555,
        remark: '',
        enable: true,
        createUser: 'admin',
      })
    }
  }, [dialogOpen, currentDevice, dialogMode, reset])

  const handleClose = () => {
    dispatch(setDialogOpen(false))
    dispatch(setCurrentDevice(null))
    reset()
  }

  const onSubmit = async (data: DeviceCreate) => {
    try {
      console.log('💾 表單提交:', { isEdit, currentDevice, data })

      if (isEdit && currentDevice) {
        console.log('✏️ 執行更新操作，設備 ID:', currentDevice.proxyid)
        if (!currentDevice.proxyid) {
          console.error('❌ 更新失敗：currentDevice.proxyid 為空')
          return
        }

        await dispatch(updateDevice({
          proxyid: currentDevice.proxyid,
          device: { ...data, enable: data.enable ? 1 : 0 }
        })).unwrap()
      } else {
        console.log('➕ 執行創建操作')
        // 創建設備 - 不包含 proxyid，讓後端自動生成
        const { proxyid, ...createData } = data
        await dispatch(createDevice({
          ...createData,
          enable: data.enable ? 1 : 0
        })).unwrap()
      }
      handleClose()
    } catch (error) {
      console.error('💥 保存設備失敗:', error)
    }
  }

  return (
    <Dialog
      open={dialogOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h5" component="div">
            {isEdit ? '編輯設備' : '新增設備'}
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* 代理設定 */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                代理設定
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="proxy_ip"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="代理 IP 地址"
                    error={!!errors.proxy_ip}
                    helperText={errors.proxy_ip?.message}
                    placeholder="例如: 192.168.1.100"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="proxy_port"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="代理端口"
                    type="number"
                    error={!!errors.proxy_port}
                    helperText={errors.proxy_port?.message}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                )}
              />
            </Grid>

            {/* 控制器設定 */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mt: 2 }}>
                控制器設定
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="Controller_type"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.Controller_type}>
                    <InputLabel>控制器類型</InputLabel>
                    <Select {...field} label="控制器類型">
                      {controllerTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.Controller_type && (
                      <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                        {errors.Controller_type.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="Controller_ip"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="控制器 IP 地址"
                    error={!!errors.Controller_ip}
                    helperText={errors.Controller_ip?.message}
                    placeholder="例如: 192.168.1.200"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="Controller_port"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="控制器端口"
                    type="number"
                    error={!!errors.Controller_port}
                    helperText={errors.Controller_port?.message}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="createUser"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="創建用戶"
                    error={!!errors.createUser}
                    helperText={errors.createUser?.message}
                  />
                )}
              />
            </Grid>

            {/* 其他設定 */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mt: 2 }}>
                其他設定
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="remark"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    multiline
                    rows={3}
                    label="備註"
                    error={!!errors.remark}
                    helperText={errors.remark?.message}
                    placeholder="請輸入設備相關備註資訊..."
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="enable"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="啟用設備"
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleClose} disabled={isSubmitting}>
            取消
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            sx={{
              minWidth: 100,
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
            }}
          >
            {isSubmitting ? '保存中...' : isEdit ? '更新' : '創建'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default DeviceDialog