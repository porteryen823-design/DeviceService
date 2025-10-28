import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Stop as StopIcon,
  Help as HelpIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import { ProxyStatusData, ProxyStatusType } from '@/types/proxyStatus'

interface ProxyStatusTableViewProps {
  data: ProxyStatusData[]
  onRefresh?: (proxyid: number) => void
}

const ProxyStatusTableView: React.FC<ProxyStatusTableViewProps> = ({
  data,
  onRefresh
}) => {
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

  const getStatusChip = (message: string, proxyServiceAlive: string, proxyServiceStart: string) => {
    const status = getStatusType(message, proxyServiceAlive, proxyServiceStart)

    switch (status) {
      case 'running':
        return (
          <Chip
            icon={<CheckCircleIcon />}
            label={t('proxy.running')}
            color="success"
            size="small"
          />
        )
      case 'error':
        return (
          <Chip
            icon={<ErrorIcon />}
            label={t('proxy.error')}
            color="error"
            size="small"
          />
        )
      case 'timeout':
        return (
          <Chip
            icon={<WarningIcon />}
            label={t('proxy.timeout')}
            color="warning"
            size="small"
          />
        )
      case 'stopped':
        return (
          <Chip
            icon={<StopIcon />}
            label={t('proxy.stopped')}
            color="default"
            size="small"
          />
        )
      default:
        return (
          <Chip
            icon={<HelpIcon />}
            label={t('proxy.unknown')}
            color="info"
            size="small"
          />
        )
    }
  }

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

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('proxy.proxyId')}</TableCell>
            <TableCell>{t('proxy.status')}</TableCell>
            <TableCell>{t('proxy.message')}</TableCell>
            <TableCell>{t('proxy.serviceRunning')}</TableCell>
            <TableCell>{t('proxy.serviceStarted')}</TableCell>
            <TableCell>{t('proxy.controllerType')}</TableCell>
            <TableCell>{t('proxy.ipAddress')}</TableCell>
            <TableCell>{t('proxy.port')}</TableCell>
            <TableCell>{t('proxy.remark')}</TableCell>
            <TableCell align="center">{t('proxy.actions')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((status) => (
            <TableRow key={status.proxyid} hover>
              <TableCell>
                <Typography variant="body2" fontWeight="medium">
                  {status.proxyid}
                </Typography>
              </TableCell>
              <TableCell>
                {getStatusChip(status.message, status.proxyServiceAlive, status.proxyServiceStart)}
              </TableCell>
              <TableCell>
                {formatMessage(status.message)}
              </TableCell>
              <TableCell>
                <Box display="flex" alignItems="center">
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: status.proxyServiceAlive === '1' ? '#4caf50' : '#f44336',
                      mr: 1
                    }}
                  />
                  <Typography variant="body2">
                    {status.proxyServiceAlive === '1' ? t('proxy.serviceAlive') : t('proxy.serviceNotAlive')}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Box display="flex" alignItems="center">
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: status.proxyServiceStart === '1' ? '#4caf50' : '#f44336',
                      mr: 1
                    }}
                  />
                  <Typography variant="body2">
                    {status.proxyServiceStart === '1' ? t('proxy.serviceStarted') : t('proxy.serviceNotStarted')}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {status.controller_type || '-'}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {status.proxy_ip || '-'}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {status.proxy_port || '-'}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {status.remark || '-'}
                </Typography>
              </TableCell>
              <TableCell align="center">
                {onRefresh && (
                  <Tooltip title={t('proxy.refreshItem')}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onRefresh(status.proxyid)
                      }}
                    >
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default ProxyStatusTableView