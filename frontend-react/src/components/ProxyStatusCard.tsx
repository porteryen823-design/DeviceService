import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Grid,
  Tooltip,
  IconButton,
  useTheme
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Stop as StopIcon,
  Help as HelpIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Router as RouterIcon
} from '@mui/icons-material'
import { ProxyStatusData, ProxyStatusType } from '@/types/proxyStatus'

interface ProxyStatusCardProps {
  data: ProxyStatusData
  onRefresh?: (proxyid: number) => void
  compact?: boolean
}

const ProxyStatusCard: React.FC<ProxyStatusCardProps> = ({
  data,
  onRefresh,
  compact = false
}) => {
  const theme = useTheme()

  const getStatusType = (message: string, proxyServiceAlive: string, proxyServiceStart: string): ProxyStatusType => {
    const isAlive = proxyServiceAlive === '1'
    const isStarted = proxyServiceStart === '1'

    if (message === 'OK' && isAlive && isStarted) {
      return 'running'
    } else if (message.startsWith('HTTP') || message.startsWith('Error')) {
      return 'error'
    } else if (message === 'NG_Timeout') {
      return 'timeout'
    } else if (!isAlive || !isStarted) {
      return 'stopped'
    } else {
      return 'unknown'
    }
  }

  const getStatusConfig = (status: ProxyStatusType) => {
    switch (status) {
      case 'running':
        return {
          icon: <CheckCircleIcon />,
          label: '運行中',
          color: 'success' as const,
          bgColor: theme.palette.success.main,
          textColor: theme.palette.success.contrastText
        }
      case 'error':
        return {
          icon: <ErrorIcon />,
          label: '錯誤',
          color: 'error' as const,
          bgColor: theme.palette.error.main,
          textColor: theme.palette.error.contrastText
        }
      case 'timeout':
        return {
          icon: <WarningIcon />,
          label: '超時',
          color: 'warning' as const,
          bgColor: theme.palette.warning.main,
          textColor: theme.palette.warning.contrastText
        }
      case 'stopped':
        return {
          icon: <StopIcon />,
          label: '已停止',
          color: 'default' as const,
          bgColor: theme.palette.grey[500],
          textColor: theme.palette.common.white
        }
      default:
        return {
          icon: <HelpIcon />,
          label: '未知',
          color: 'info' as const,
          bgColor: theme.palette.info.main,
          textColor: theme.palette.info.contrastText
        }
    }
  }

  const status = getStatusType(data.message, data.proxyServiceAlive, data.proxyServiceStart)
  const statusConfig = getStatusConfig(status)

  const formatMessage = (message: string) => {
    if (message.length > 30) {
      return (
        <Tooltip title={message}>
          <span>{message.substring(0, 30)}...</span>
        </Tooltip>
      )
    }
    return message
  }

  if (compact) {
    return (
      <Card
        sx={{
          height: '100%',
          transition: 'all 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[4]
          }
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Box display="flex" alignItems="center">
              <RouterIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
              <Typography variant="h6" component="div">
                {data.proxyid}
              </Typography>
            </Box>
            <Chip
              icon={statusConfig.icon}
              label={statusConfig.label}
              color={statusConfig.color}
              size="small"
            />
          </Box>

          <Typography variant="body2" color="text.secondary" mb={1}>
            {data.proxy_ip}:{data.proxy_port}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {data.controller_type}
          </Typography>

          {data.remark && (
            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
              {data.remark}
            </Typography>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      sx={{
        height: '100%',
        transition: 'all 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4]
        }
      }}
    >
      <CardContent>
        {/* 標題區域 */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center">
            <RouterIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography variant="h6" component="div">
              代理服務 #{data.proxyid}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              icon={statusConfig.icon}
              label={statusConfig.label}
              color={statusConfig.color}
              size="small"
            />
            {onRefresh && (
              <Tooltip title="重新整理狀態">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onRefresh(data.proxyid)
                  }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* 狀態指示器 */}
        <Box
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 1,
            backgroundColor: statusConfig.bgColor,
            color: statusConfig.textColor
          }}
        >
          <Box display="flex" alignItems="center" mb={1}>
            {statusConfig.icon}
            <Typography variant="body2" sx={{ ml: 1 }}>
              狀態訊息: {formatMessage(data.message)}
            </Typography>
          </Box>
        </Box>

        {/* 詳細資訊 */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                控制器類型
              </Typography>
              <Typography variant="body1">
                {data.controller_type || '-'}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                IP 位址和連接埠
              </Typography>
              <Typography variant="body1">
                {data.proxy_ip}:{data.proxy_port}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                服務運行狀態
              </Typography>
              <Box display="flex" alignItems="center">
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: data.proxyServiceAlive === '1' ? '#4caf50' : '#f44336',
                    mr: 1
                  }}
                />
                <Typography variant="body2">
                  {data.proxyServiceAlive === '1' ? '運行中' : '未運行'}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                服務啟動狀態
              </Typography>
              <Box display="flex" alignItems="center">
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: data.proxyServiceStart === '1' ? '#4caf50' : '#f44336',
                    mr: 1
                  }}
                />
                <Typography variant="body2">
                  {data.proxyServiceStart === '1' ? '已啟動' : '未啟動'}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {data.remark && (
            <Grid item xs={12}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  備註
                </Typography>
                <Typography variant="body2">
                  {data.remark}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default ProxyStatusCard