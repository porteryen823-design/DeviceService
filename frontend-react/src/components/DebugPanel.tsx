import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import {
  Box,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Collapse,
  Alert,
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  BugReport as BugIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import { RootState } from '@/store/store'

interface DebugPanelProps {
  onClose?: () => void
}

const DebugPanel: React.FC<DebugPanelProps> = ({ onClose }) => {
  const [expanded, setExpanded] = useState<string | false>('redux')
  const [logs, setLogs] = useState<string[]>([])

  const { devices, loading, error, currentDevice, dialogMode, dialogOpen } = useSelector(
    (state: RootState) => state.device
  )

  // 添加日誌的函數
  const addLog = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    const timestamp = new Date().toLocaleTimeString('zh-TW')
    const logMessage = `[${timestamp}] ${message}`
    setLogs(prev => [...prev.slice(-49), logMessage]) // 保留最近 50 條日誌

    // 在開發者工具中也輸出
    console.log(`🔍 ${message}`)
  }

  // 監聽 Redux 狀態變化並記錄日誌
  React.useEffect(() => {
    addLog(`Redux 狀態更新 - 設備數量: ${devices?.length || 0}`, 'info')
    if (devices && devices.length > 0) {
      addLog(`第一個設備資料: ${JSON.stringify(devices[0], null, 2)}`, 'info')
    }
  }, [devices])

  React.useEffect(() => {
    if (error) {
      addLog(`錯誤發生: ${error}`, 'error')
    }
  }, [error])

  React.useEffect(() => {
    if (currentDevice) {
      addLog(`當前設備已設定: proxyid=${currentDevice.proxyid}`, 'success')
    } else {
      addLog('當前設備已清除', 'info')
    }
  }, [currentDevice])

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false)
  }

  const handleRefresh = () => {
    addLog('手動刷新資料', 'info')
    window.location.reload()
  }

  const handleClearLogs = () => {
    setLogs([])
    addLog('日誌已清除', 'info')
  }

  return (
    <Paper
      sx={{
        position: 'fixed',
        top: 20,
        right: 20,
        width: 500,
        maxHeight: '80vh',
        zIndex: 9999,
        overflow: 'hidden',
        border: '2px solid #1976d2',
      }}
    >
      {/* 標題欄 */}
      <Box
        sx={{
          p: 2,
          bgcolor: 'primary.main',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BugIcon />
          <Typography variant="h6">調試面板</Typography>
        </Box>
        <Box>
          <IconButton size="small" onClick={handleRefresh} sx={{ color: 'white', mr: 1 }}>
            <RefreshIcon />
          </IconButton>
          {onClose && (
            <IconButton size="small" onClick={onClose} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      <Box sx={{ maxHeight: '70vh', overflow: 'auto' }}>
        {/* Redux 狀態 */}
        <Accordion expanded={expanded === 'redux'} onChange={handleAccordionChange('redux')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Redux 狀態</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>載入狀態:</strong> {loading ? '載入中...' : '已載入'}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>設備數量:</strong> {devices?.length || 0}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>錯誤訊息:</strong> {error || '無錯誤'}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>對話框模式:</strong> {dialogMode}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>對話框開啟:</strong> {dialogOpen ? '是' : '否'}
              </Typography>
            </Box>

            {currentDevice && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>當前設備:</strong> proxyid={currentDevice.proxyid}, IP={currentDevice.proxy_ip}
                </Typography>
              </Alert>
            )}
          </AccordionDetails>
        </Accordion>

        {/* 設備資料 */}
        <Accordion expanded={expanded === 'devices'} onChange={handleAccordionChange('devices')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">設備資料</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {devices && devices.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Proxy ID</TableCell>
                      <TableCell>代理 IP</TableCell>
                      <TableCell>控制器類型</TableCell>
                      <TableCell>狀態</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {devices.map((device) => (
                      <TableRow key={device.proxyid}>
                        <TableCell>
                          <Chip
                            label={device.proxyid}
                            size="small"
                            color={device.proxyid ? 'primary' : 'error'}
                          />
                        </TableCell>
                        <TableCell>{device.proxy_ip}</TableCell>
                        <TableCell>{device.Controller_type}</TableCell>
                        <TableCell>
                          <Chip
                            label={device.enable === 1 ? '啟用' : '停用'}
                            color={device.enable === 1 ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary">
                沒有設備資料
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>

        {/* 調試日誌 */}
        <Accordion expanded={expanded === 'logs'} onChange={handleAccordionChange('logs')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">調試日誌</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Button size="small" onClick={handleClearLogs} variant="outlined">
                清除日誌
              </Button>
            </Box>
            <Box
              sx={{
                bgcolor: 'grey.900',
                color: 'grey.100',
                p: 2,
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                maxHeight: 300,
                overflow: 'auto',
              }}
            >
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                    {log}
                  </Typography>
                ))
              ) : (
                <Typography variant="body2" color="grey.400">
                  暫無日誌訊息
                </Typography>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* API 狀態 */}
        <Accordion expanded={expanded === 'api'} onChange={handleAccordionChange('api')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">API 狀態</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" gutterBottom>
              <strong>後端服務:</strong> http://127.0.0.1:5200
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>前端服務:</strong> http://127.0.0.1:8080
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>API 端點:</strong> /DeviceServiceConfig
            </Typography>
            <Alert severity="info" sx={{ mt: 1 }}>
              請檢查瀏覽器 Network 標籤查看詳細的 API 請求和響應
            </Alert>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Paper>
  )
}

export default DebugPanel