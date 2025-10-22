import React from 'react'
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  useTheme,
} from '@mui/material'
import {
  Palette as PaletteIcon,
  Brightness6 as ThemeIcon,
} from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { setTheme } from '@/store/slices/uiSlice'
import { ThemeType } from '@/styles/theme'

const ThemeSwitcher: React.FC = () => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const theme = useTheme()
  const dispatch = useDispatch()
  const currentTheme = useSelector((state: RootState) => state.ui.theme)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleThemeChange = (themeType: ThemeType) => {
    dispatch(setTheme(themeType))
    handleClose()
  }

  const themes = [
    { type: 'light' as ThemeType, name: '淺色主題', icon: '☀️' },
    { type: 'dark' as ThemeType, name: '深色主題', icon: '🌙' },
    { type: 'pink' as ThemeType, name: '粉色主題', icon: '🌸' },
    { type: 'green' as ThemeType, name: '綠色主題', icon: '🌿' },
    { type: 'purple' as ThemeType, name: '紫色主題', icon: '💜' },
  ]

  const getThemeIcon = (themeType: ThemeType) => {
    switch (themeType) {
      case 'light':
        return '☀️'
      case 'dark':
        return '🌙'
      case 'pink':
        return '🌸'
      case 'green':
        return '🌿'
      case 'purple':
        return '💜'
      default:
        return '🎨'
    }
  }

  return (
    <Box>
      <Tooltip title="切換主題">
        <IconButton
          onClick={handleClick}
          sx={{
            color: 'inherit',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <ThemeIcon />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            minWidth: 200,
            mt: 1,
          },
        }}
      >
        {themes.map((themeOption) => (
          <MenuItem
            key={themeOption.type}
            onClick={() => handleThemeChange(themeOption.type)}
            selected={currentTheme === themeOption.type}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Box sx={{ fontSize: '1.2em', mr: 1 }}>
              {themeOption.icon}
            </Box>
            <ListItemText primary={themeOption.name} />
            {currentTheme === themeOption.type && (
              <Box sx={{ color: 'primary.main', fontSize: '1.2em' }}>
                ✓
              </Box>
            )}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  )
}

export default ThemeSwitcher