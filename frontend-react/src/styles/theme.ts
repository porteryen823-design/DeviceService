import { createTheme, Theme } from '@mui/material/styles'

// 主題類型定義
export type ThemeType = 'light' | 'dark' | 'pink' | 'green' | 'purple'

// 主題調色板定義
export const themePalettes = {
  light: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  dark: {
    primary: {
      main: '#90caf9',
      light: '#e3f2fd',
      dark: '#42a5f5',
    },
    secondary: {
      main: '#f48fb1',
      light: '#ffc1e3',
      dark: '#bf5f82',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  pink: {
    primary: {
      main: '#e91e63',
      light: '#ff5983',
      dark: '#b0003a',
    },
    secondary: {
      main: '#9c27b0',
      light: '#d05ce3',
      dark: '#6a0080',
    },
    background: {
      default: '#fce4ec',
      paper: '#ffffff',
    },
  },
  green: {
    primary: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#2e7d32',
    },
    secondary: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#e65100',
    },
    background: {
      default: '#e8f5e8',
      paper: '#ffffff',
    },
  },
  purple: {
    primary: {
      main: '#9c27b0',
      light: '#d05ce3',
      dark: '#6a0080',
    },
    secondary: {
      main: '#00bcd4',
      light: '#4dd0e1',
      dark: '#00838f',
    },
    background: {
      default: '#f3e5f5',
      paper: '#ffffff',
    },
  },
}

// 創建主題的函數
export const createAppTheme = (themeType: ThemeType = 'light'): Theme => {
  const palette = themePalettes[themeType]

  return createTheme({
    palette: {
      mode: themeType === 'dark' ? 'dark' : 'light',
      primary: palette.primary,
      secondary: palette.secondary,
      background: palette.background,
      // 根據主題類型調整文字顏色
      text: {
        primary: themeType === 'dark' ? '#ffffff' : 'rgba(0, 0, 0, 0.87)',
        secondary: themeType === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
      },
    },
    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: themeType === 'dark'
              ? '0 2px 8px rgba(0, 0, 0, 0.3)'
              : '0 2px 8px rgba(0, 0, 0, 0.1)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: palette.primary.main,
            color: '#ffffff',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: palette.background.paper,
            borderRight: `1px solid ${themeType === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
          },
        },
      },
    },
  })
}

// 預設主題
const defaultTheme = createAppTheme('light')

export default defaultTheme