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
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()

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
          label: t('proxy.running'),
          color: 'success' as const,
          bgColor: theme.palette.success.main,
          textColor: theme.palette.success.contrastText
        }
      case 'error':
        return {
          icon: <ErrorIcon />,
          label: t('proxy.error'),
          color: 'error' as const,
          bgColor: theme.palette.error.main,
          textColor: theme.palette.error.contrastText
        }
      case 'timeout':
        return {
          icon: <WarningIcon />,
          label: t('proxy.timeout'),
          color: 'warning' as const,
          bgColor: theme.palette.warning.main,
          textColor: theme.palette.warning.contrastText
        }
      case 'stopped':
        return {
          icon: <StopIcon />,
          label: t('proxy.stopped'),
          color: 'default' as const,
          bgColor: theme.palette.grey[500],
          textColor: theme.palette.common.white
        }
      default:
        return {
          icon: <HelpIcon />,
          label: t('proxy.unknown'),
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
              {t('proxy.service')} #{data.proxyid}
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
              <Tooltip title={t('common.refresh')}>
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
              {t('proxy.status')}{t('proxy.message')}: {formatMessage(data.message)}
            </Typography>
          </Box>
        </Box>

        {/* 詳細資訊 */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('proxy.controllerType')}
              </Typography>
              <Typography variant="body1">
                {data.controller_type || '-'}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('proxy.ipAddress')}和{t('proxy.port')}
              </Typography>
              <Typography variant="body1">
                {data.proxy_ip}:{data.proxy_port}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('proxy.serviceRunning')}{t('proxy.status')}
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
                  {data.proxyServiceAlive === '1' ? t('proxy.serviceAlive') : t('proxy.serviceNotAlive')}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('proxy.serviceStartedLabel')}{t('proxy.status')}
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
                  {data.proxyServiceStart === '1' ? t('proxy.serviceStartedStatus') : t('proxy.serviceNotStartedStatus')}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {data.remark && (
            <Grid item xs={12}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {t('proxy.remark')}
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