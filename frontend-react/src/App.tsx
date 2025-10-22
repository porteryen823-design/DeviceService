import React, { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Box, Fab, AppBar, Toolbar, Button, Typography } from '@mui/material'
import { BugReport as BugIcon, Devices as DevicesIcon, MonitorHeart as MonitorIcon } from '@mui/icons-material'

// 調試日誌：追蹤路由行為
console.log('🔍 App.tsx: Component loaded')

import Layout from '@/components/layout/Layout'
import DeviceManagement from '@/pages/DeviceManagement'
import ProxyStatus from '@/pages/ProxyStatus'
import DeviceDialog from '@/components/DeviceDialog'
import DebugPanel from '@/components/DebugPanel'
import NotFound from '@/pages/NotFound'
import Notification from '@/components/common/Notification'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import AppThemeProvider from '@/components/ThemeProvider'
import ThemeSwitcher from '@/components/ThemeSwitcher'

function App() {
  const [debugPanelOpen, setDebugPanelOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // 調試日誌：追蹤路由變化
  useEffect(() => {
    console.log('🔍 App.tsx: Current route changed to:', location.pathname)
    console.log('🔍 App.tsx: Full location object:', location)
  }, [location])

  // 調試日誌：追蹤組件掛載
  useEffect(() => {
    console.log('🔍 App.tsx: Component mounted')
    console.log('🔍 App.tsx: Current URL:', window.location.href)
    console.log('🔍 App.tsx: Current pathname:', window.location.pathname)
  }, [])

  // 添加快速鍵來顯示/隱藏調試面板
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault()
        setDebugPanelOpen(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  const isActiveRoute = (path: string) => {
    return location.pathname === path
  }

  return (
    <ErrorBoundary>
      <AppThemeProvider>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          {/* 頂部導航列 */}
          <AppBar position="static" elevation={1}>
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ mr: 4 }}>
                Device Service Management
              </Typography>
              <Button
                color={isActiveRoute('/') || isActiveRoute('/devices') ? 'secondary' : 'inherit'}
                startIcon={<DevicesIcon />}
                onClick={() => navigate('/devices')}
                sx={{ mr: 2 }}
              >
                設備管理
              </Button>
              <Button
                color={isActiveRoute('/ProxyStatus') ? 'secondary' : 'inherit'}
                startIcon={<MonitorIcon />}
                onClick={() => navigate('/ProxyStatus')}
                sx={{ mr: 2 }}
              >
                代理狀態監控
              </Button>

              {/* 主題切換按鈕 */}
              <Box sx={{ marginLeft: 'auto' }}>
                <ThemeSwitcher />
              </Box>
            </Toolbar>
          </AppBar>

        {/* 主要內容區域 */}
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Layout>
            <Routes>
              <Route path="/" element={<DeviceManagement />} />
              <Route path="/devices" element={<DeviceManagement />} />
              <Route path="/ProxyStatus" element={<ProxyStatus />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </Box>

        <DeviceDialog />
        <Notification />

        {/* 調試面板 */}
        {debugPanelOpen && (
          <DebugPanel onClose={() => setDebugPanelOpen(false)} />
        )}

        {/* 調試面板切換按鈕 */}
        <Fab
          color="primary"
          size="small"
          onClick={() => setDebugPanelOpen(prev => !prev)}
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 9998,
          }}
          title="切換調試面板 (Ctrl+Shift+D)"
        >
          <BugIcon />
        </Fab>
      </Box>
    </AppThemeProvider>
    </ErrorBoundary>
  )
}

export default App