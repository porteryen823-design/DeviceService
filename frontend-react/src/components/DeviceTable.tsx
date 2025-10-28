import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Tooltip,
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  CheckCircle as EnableIcon,
  Cancel as DisableIcon,
} from '@mui/icons-material'
import { Device } from '@/types/device'

interface DeviceTableProps {
  devices: Device[]
  onEdit?: (device: Device) => void
  onDelete?: (device: Device) => void
  onToggleEnable?: (device: Device) => void
  onCreate?: () => void
}

const DeviceTable: React.FC<DeviceTableProps> = ({
  devices,
  onEdit,
  onDelete,
  onToggleEnable,
  onCreate,
}) => {
  const { t } = useTranslation()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)

  // 添加調試日誌
  React.useEffect(() => {
    console.log('📊 DeviceTable 收到設備資料:', {
      devicesCount: devices?.length || 0,
      firstDevice: devices?.[0] || null,
      firstDeviceFields: devices?.[0] ? Object.keys(devices[0]) : [],
      firstDeviceProxyId: devices?.[0]?.proxyid || 'undefined'
    })

    if (devices && devices.length > 0) {
      devices.forEach((device, index) => {
        if (!device.proxyid) {
          console.warn(`⚠️ 第 ${index + 1} 個設備缺少 proxyid:`, device)
        }
      })
    }
  }, [devices])

  const handleDeleteClick = (device: Device) => {
    console.log('🗑️ 點擊刪除按鈕，設備資料:', {
      proxyid: device.proxyid,
      proxy_ip: device.proxy_ip,
      allFields: Object.keys(device)
    })
    setSelectedDevice(device)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (selectedDevice && onDelete) {
      console.log('✅ 確認刪除設備:', selectedDevice.proxyid)
      onDelete(selectedDevice)
    }
    setDeleteDialogOpen(false)
    setSelectedDevice(null)
  }

  const handleToggleEnable = (device: Device) => {
    console.log('🔄 切換設備狀態:', {
      proxyid: device.proxyid,
      currentEnable: device.enable,
      newEnable: device.enable === 1 ? 0 : 1
    })
    if (onToggleEnable) {
      onToggleEnable(device)
    }
  }

  const getStatusChip = (enable: number) => {
    return enable === 1 ? (
      <Chip
        label={t('devices.enabled')}
        color="success"
        size="small"
        icon={<EnableIcon />}
        sx={{ minWidth: 60 }}
      />
    ) : (
      <Chip
        label={t('devices.disabled')}
        color="default"
        size="small"
        icon={<DisableIcon />}
        sx={{ minWidth: 60 }}
      />
    )
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('zh-TW')
  }

  return (
    <>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          {t('devices.title')} ({devices.length} {t('common.items', '項')})
        </Typography>
        {onCreate && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreate}
            sx={{
              borderRadius: 2,
              px: 3,
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
            }}
          >
            {t('devices.add')}
          </Button>
        )}
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 2,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
        }}
      >
        <Table>
          <TableHead sx={{ bgcolor: 'grey.50' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('devices.proxyId')}</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('devices.proxyIp')}</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('devices.proxyPort')}</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('devices.controllerType')}</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('devices.controllerIp')}</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('devices.controllerPort')}</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('devices.status')}</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('devices.createUser')}</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('devices.createTime')}</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('devices.remark')}</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }} align="center">
                {t('devices.actions')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {devices.map((device) => (
              <TableRow
                key={device.proxyid}
                sx={{
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <TableCell>{device.proxyid}</TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {device.proxy_ip}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {device.proxy_port}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={device.Controller_type}
                    size="small"
                    variant="outlined"
                    sx={{ minWidth: 80 }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {device.Controller_ip}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {device.Controller_port}
                  </Typography>
                </TableCell>
                <TableCell>{getStatusChip(device.enable)}</TableCell>
                <TableCell>{device.createUser}</TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(device.createDate)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      maxWidth: 150,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {device.remark || '-'}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                    {onToggleEnable && (
                      <Tooltip title={device.enable === 1 ? t('devices.disableDevice') : t('devices.enableDevice')}>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleEnable(device)}
                          color={device.enable === 1 ? 'warning' : 'success'}
                        >
                          {device.enable === 1 ? <DisableIcon /> : <EnableIcon />}
                        </IconButton>
                      </Tooltip>
                    )}
                    {onEdit && (
                      <Tooltip title={t('devices.editDevice')}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            console.log('✏️ 點擊編輯按鈕，設備資料:', {
                              proxyid: device.proxyid,
                              proxy_ip: device.proxy_ip,
                              allFields: Object.keys(device)
                            })
                            onEdit(device)
                          }}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {onDelete && (
                      <Tooltip title={t('devices.deleteDevice')}>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(device)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 刪除確認對話框 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main' }}>
          {t('devices.confirmDelete')}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {t('devices.deleteConfirmMessage', {
              ip: selectedDevice?.proxy_ip,
              port: selectedDevice?.proxy_port
            })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
          >
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default DeviceTable