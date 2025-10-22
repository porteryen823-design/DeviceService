import React, { useState, useMemo } from 'react'
import {
  Box,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  Grid,
  Container,
  useTheme,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Alert,
  Divider
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Settings as SettingsIcon,
  AutoAwesome as AutoRefreshIcon,
  FilterList as FilterIcon
} from '@mui/icons-material'
import { useProxyStatus } from '@/hooks/useProxyStatus'
import ProxyStatusFilter from '@/components/ProxyStatusFilter'
import ProxyStatusCard from '@/components/ProxyStatusCard'
import ProxyStatusTableView from '@/components/ProxyStatusTableView'
import { ProxyStatusData } from '@/types/proxyStatus'

const ProxyStatus: React.FC = () => {
  const theme = useTheme()
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards')
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false)
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(30)

  // 調試日誌：追蹤頁面載入
  console.log('🔍 ProxyStatus: Component loaded')
  console.log('🔍 ProxyStatus: Current URL:', window.location.href)
  console.log('🔍 ProxyStatus: Current pathname:', window.location.pathname)

    const {
    data,
    allData,
    loading,
    error,
    lastUpdated,
    filter,
    sort,
    summary,
    refetch,
    setFilter,
    setSort,
    // MQTT 相關資料
    mqttStatus,
    mqttLogs,
    mqttCache,
    isMQTTEnabled,
    isMQTTConnected,
    dataSourceStats
  } = useProxyStatus(autoRefresh ? autoRefreshInterval : 0)

  // 取得唯一的控制器類型列表
  const controllerTypes = useMemo(() => {
    const types = new Set(allData.map(item => item.controller_type).filter(Boolean))
    return Array.from(types).sort()
  }, [allData])

  const handleFilterChange = (newFilter: any) => {
    setFilter(newFilter)
  }

  const handleSortChange = (newSort: any) => {
    setSort(newSort)
  }

  const handleClearFilters = () => {
    setFilter({ status: 'all' })
    setSort({ field: 'proxyid', order: 'asc' })
  }

  const handleRefresh = (proxyid?: number) => {
    console.log('Refresh triggered for proxyid:', proxyid)
    refetch()
  }

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh)
  }

  if (error && !loading) {
    return (
      <Container maxWidth="lg">
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleRefresh}
              startIcon={<RefreshIcon />}
            >
              重試
            </Button>
          }
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg">
      {/* 頁面標題和控制列 */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          代理服務狀態監控
        </Typography>

        <Box display="flex" alignItems="center" gap={2}>
          {/* 自動重新整理開關 */}
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={toggleAutoRefresh}
                color="primary"
              />
            }
            label={
              <Typography variant="body2">
                自動重新整理 ({autoRefreshInterval}s)
              </Typography>
            }
          />

          {/* 資料統計 */}
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2" color="text.secondary">
              總計: {data.length}
            </Typography>
          </Box>

          {/* 重新整理按鈕 */}
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            重新整理
          </Button>
        </Box>
      </Box>

      {/* 最後更新時間 */}
      {lastUpdated && (
        <Typography variant="body2" color="text.secondary" mb={2}>
          最後更新時間: {lastUpdated.toLocaleString('zh-TW')}
        </Typography>
      )}

      {/* 篩選器 */}
      <Box mb={3}>
        <ProxyStatusFilter
          filter={filter}
          sort={sort}
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
          onClear={handleClearFilters}
          controllerTypes={controllerTypes}
        />
      </Box>

      {/* 檢視模式切換和結果統計 */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="body2" color="text.secondary">
          顯示 {data.length} 項結果
        </Typography>

        <Box display="flex" alignItems="center" gap={1}>
          <Button
            startIcon={<ViewListIcon />}
            variant={viewMode === 'cards' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setViewMode('cards')}
          >
            卡片檢視
          </Button>
          <Button
            startIcon={<ViewModuleIcon />}
            variant={viewMode === 'table' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setViewMode('table')}
          >
            表格檢視
          </Button>
        </Box>
      </Box>

      {/* 載入狀態 */}
      {loading && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          py={4}
        >
          <RefreshIcon sx={{ animation: 'spin 1s linear infinite', mr: 2 }} />
          <Typography variant="h6">
            載入代理狀態中...
          </Typography>
        </Box>
      )}

      {/* 資料顯示區域 */}
      {!loading && (
        <>
          {data.length === 0 ? (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              py={8}
              sx={{
                backgroundColor: theme.palette.background.default,
                borderRadius: 2,
                border: `2px dashed ${theme.palette.divider}`
              }}
            >
              <FilterIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                沒有符合條件的代理服務資料
              </Typography>
              <Typography variant="body2" color="text.secondary">
                請調整篩選條件或重新整理資料
              </Typography>
            </Box>
          ) : viewMode === 'cards' ? (
            <Grid container spacing={3}>
              {data.map((item) => (
                <Grid item xs={12} sm={6} lg={4} key={item.proxyid}>
                  <ProxyStatusCard
                    data={item}
                    onRefresh={(proxyid) => handleRefresh(proxyid)}
                    compact={false}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <ProxyStatusTableView data={data} onRefresh={(proxyid) => handleRefresh(proxyid)} />
          )}
        </>
      )}

      {/* 浮動操作按鈕 */}
      <SpeedDial
        ariaLabel="操作選單"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
      >
        <SpeedDialAction
          icon={<RefreshIcon />}
          tooltipTitle="重新整理"
          onClick={() => handleRefresh()}
        />
        <SpeedDialAction
          icon={<FilterIcon />}
          tooltipTitle="篩選器"
          onClick={() => setFilter({ ...filter, status: filter.status || 'all' })}
        />
        <SpeedDialAction
          icon={<SettingsIcon />}
          tooltipTitle="設定"
          onClick={() => {
            // 可以開啟設定對話框
          }}
        />
      </SpeedDial>

    </Container>
  )
}

export default ProxyStatus