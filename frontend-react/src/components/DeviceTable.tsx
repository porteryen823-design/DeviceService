import React, { useState } from 'react'
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
        label="啟用"
        color="success"
        size="small"
        icon={<EnableIcon />}
        sx={{ minWidth: 60 }}
      />
    ) : (
      <Chip
        label="停用"
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
          設備列表 ({devices.length} 項)
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
            新增設備
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
              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>代理 ID</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>代理 IP</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>代理端口</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>控制器類型</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>控制器 IP</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>控制器端口</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>狀態</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>創建用戶</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>創建時間</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>備註</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }} align="center">
                操作
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
                      <Tooltip title={device.enable === 1 ? '停用設備' : '啟用設備'}>
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
                      <Tooltip title="編輯設備">
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
                      <Tooltip title="刪除設備">
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
          確認刪除設備
        </DialogTitle>
        <DialogContent>
          <Typography>
            確定要刪除設備 "{selectedDevice?.proxy_ip}:{selectedDevice?.proxy_port}" 嗎？
            此操作無法復原。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            取消
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
          >
            確認刪除
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default DeviceTable