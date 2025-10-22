import React from 'react'
import { Box, Typography, CircularProgress, Fade, Backdrop } from '@mui/material'
import { useTheme } from '@mui/material/styles'

interface LoadingScreenProps {
  open: boolean
  message?: string
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  open,
  message = '載入中...'
}) => {
  const theme = useTheme()

  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: theme.zIndex.tooltip + 1,
        flexDirection: 'column',
        gap: 3,
      }}
      open={open}
    >
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap={3}
        p={4}
      >
        <CircularProgress
          size={60}
          thickness={4}
          sx={{
            color: theme.palette.primary.main,
          }}
        />
        <Fade in={open} timeout={800}>
          <Typography
            variant="h6"
            component="div"
            sx={{
              color: theme.palette.text.primary,
              textAlign: 'center',
              fontWeight: 500,
            }}
          >
            {message}
          </Typography>
        </Fade>
      </Box>
    </Backdrop>
  )
}

export default LoadingScreen