import React from 'react'
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { createAppTheme, ThemeType } from '@/styles/theme'

interface AppThemeProviderProps {
  children: React.ReactNode
}

const AppThemeProvider: React.FC<AppThemeProviderProps> = ({ children }) => {
  const currentTheme = useSelector((state: RootState) => state.ui.theme)

  // 根據 Redux 狀態創建對應的主題
  const theme = React.useMemo(() => {
    return createAppTheme(currentTheme)
  }, [currentTheme])

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  )
}

export default AppThemeProvider