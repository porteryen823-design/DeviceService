import React from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  useTheme
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Stop as StopIcon,
  Help as HelpIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material'
import { ProxyStatusSummary, StatusStatistics } from '@/types/proxyStatus'

interface ProxyStatusSummaryProps {
  summary: ProxyStatusSummary
  loading?: boolean
}

const ProxyStatusSummaryComponent: React.FC<ProxyStatusSummaryProps> = ({
  summary,
  loading = false
}) => {
  const theme = useTheme()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <CheckCircleIcon />
      case 'error':
        return <ErrorIcon />
      case 'timeout':
        return <WarningIcon />
      case 'stopped':
        return <StopIcon />
      default:
        return <HelpIcon />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return theme.palette.success.main
      case 'error':
        return theme.palette.error.main
      case 'timeout':
        return theme.palette.warning.main
      case 'stopped':
        return theme.palette.grey[500]
      default:
        return theme.palette.info.main
    }
  }

  const statistics: StatusStatistics[] = [
    {
      label: '運行中',
      value: summary.running,
      color: theme.palette.success.main,
      percentage: summary.total > 0 ? (summary.running / summary.total) * 100 : 0
    },
    {
      label: '已停止',
      value: summary.stopped,
      color: theme.palette.grey[500],
      percentage: summary.total > 0 ? (summary.stopped / summary.total) * 100 : 0
    },
    {
      label: '錯誤',
      value: summary.error,
      color: theme.palette.error.main,
      percentage: summary.total > 0 ? (summary.error / summary.total) * 100 : 0
    },
    {
      label: '超時',
      value: summary.timeout,
      color: theme.palette.warning.main,
      percentage: summary.total > 0 ? (summary.timeout / summary.total) * 100 : 0
    },
    {
      label: '未知',
      value: summary.unknown,
      color: theme.palette.info.main,
      percentage: summary.total > 0 ? (summary.unknown / summary.total) * 100 : 0
    }
  ]

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <TrendingUpIcon sx={{ mr: 1 }} />
            <Typography variant="h6">狀態統計</Typography>
          </Box>
          <LinearProgress />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={3}>
          <TrendingUpIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography variant="h6">狀態統計</Typography>
          <Chip
            label={`總計: ${summary.total}`}
            size="small"
            sx={{ ml: 2 }}
            color="primary"
            variant="outlined"
          />
        </Box>

        <Grid container spacing={2}>
          {statistics.map((stat) => (
            <Grid item xs={12} sm={6} md={4} lg={2.4} key={stat.label}>
              <Box
                sx={{
                  p: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  textAlign: 'center',
                  backgroundColor: theme.palette.background.default,
                  minHeight: '80px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: stat.color,
                      mr: 1
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Box>

                <Typography variant="h4" component="div" gutterBottom>
                  {stat.value}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  {stat.percentage.toFixed(1)}%
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* 運行狀況指示器 */}
        <Box mt={3} pt={2} borderTop={`1px solid ${theme.palette.divider}`}>
          <Typography variant="body2" color="text.secondary" mb={1}>
            運行狀況概覽
          </Typography>
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            {summary.running > 0 && (
              <Chip
                icon={<CheckCircleIcon />}
                label={`${summary.running} 運行中`}
                color="success"
                size="small"
              />
            )}
            {summary.error > 0 && (
              <Chip
                icon={<ErrorIcon />}
                label={`${summary.error} 錯誤`}
                color="error"
                size="small"
              />
            )}
            {summary.timeout > 0 && (
              <Chip
                icon={<WarningIcon />}
                label={`${summary.timeout} 超時`}
                color="warning"
                size="small"
              />
            )}
            {summary.stopped > 0 && (
              <Chip
                icon={<StopIcon />}
                label={`${summary.stopped} 已停止`}
                color="default"
                size="small"
              />
            )}
            {summary.unknown > 0 && (
              <Chip
                icon={<HelpIcon />}
                label={`${summary.unknown} 未知`}
                color="info"
                size="small"
              />
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default ProxyStatusSummaryComponent