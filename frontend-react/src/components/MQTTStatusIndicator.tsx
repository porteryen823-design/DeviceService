import React from 'react'
import { IconButton, Tooltip, Badge } from '@mui/material'
import {
  Wifi as ConnectedIcon,
  WifiOff as DisconnectedIcon,
  WifiFind as ConnectingIcon,
  Error as ErrorIcon
} from '@mui/icons-material'
import { useMQTT } from '@/hooks/useMQTT'

interface MQTTStatusIndicatorProps {
  showDetails?: boolean
}

export default function MQTTStatusIndicator({ showDetails = false }: MQTTStatusIndicatorProps) {
  const { isConnected, isConnecting, connectionError } = useMQTT(false) // 不自動連線

  // 決定顯示的圖標和顏色
  const getStatusIcon = () => {
    if (connectionError) {
      return <ErrorIcon color="error" />
    } else if (isConnecting) {
      return <ConnectingIcon color="warning" />
    } else if (isConnected) {
      return <ConnectedIcon color="success" />
    } else {
      return <DisconnectedIcon color="disabled" />
    }
  }

  const getStatusTooltip = () => {
    if (connectionError) {
      return `MQTT 連線錯誤: ${connectionError}`
    } else if (isConnecting) {
      return 'MQTT 連線中...'
    } else if (isConnected) {
      return 'MQTT 已連線'
    } else {
      return 'MQTT 未連線'
    }
  }

  const getBadgeContent = () => {
    if (connectionError) {
      return '!'
    } else if (isConnecting) {
      return '...'
    } else if (isConnected) {
      return null // 不顯示徽章
    } else {
      return '✗'
    }
  }

  return (
    <Tooltip title={getStatusTooltip()}>
      <IconButton size="small" color="inherit">
        <Badge
          badgeContent={getBadgeContent()}
          color={connectionError ? 'error' : isConnecting ? 'warning' : 'default'}
          variant={connectionError || isConnecting ? 'standard' : 'dot'}
        >
          {getStatusIcon()}
        </Badge>
      </IconButton>
    </Tooltip>
  )
}