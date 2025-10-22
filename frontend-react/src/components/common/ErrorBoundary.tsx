import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Box, Typography, Button, Alert } from '@mui/material'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="400px"
          p={3}
        >
          <Alert severity="error" sx={{ mb: 2, maxWidth: 600 }}>
            <Typography variant="h6" gutterBottom>
              發生未預期的錯誤
            </Typography>
            <Typography variant="body2" gutterBottom>
              系統發生錯誤，請嘗試重新載入頁面或聯繫系統管理員。
            </Typography>
            {this.state.error && (
              <Typography variant="caption" component="div" sx={{ mt: 1, fontFamily: 'monospace' }}>
                錯誤詳情: {this.state.error.message}
              </Typography>
            )}
          </Alert>
          <Button
            variant="contained"
            color="primary"
            onClick={this.handleReset}
          >
            重新載入頁面
          </Button>
        </Box>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary