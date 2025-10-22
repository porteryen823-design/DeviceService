import React from 'react'
import { Box, Typography, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'

const NotFound: React.FC = () => {
  const navigate = useNavigate()

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="400px"
      textAlign="center"
    >
      <Typography variant="h1" color="primary" gutterBottom>
        404
      </Typography>
      <Typography variant="h4" gutterBottom>
        頁面不存在
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        抱歉，您訪問的頁面不存在或已被移除。
      </Typography>
      <Button
        variant="contained"
        onClick={() => navigate('/')}
        size="large"
      >
        返回首頁
      </Button>
    </Box>
  )
}

export default NotFound