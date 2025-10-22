import React, { ReactNode } from 'react'
import { Box } from '@mui/material'

interface LayoutProps {
  children: ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
      {children}
    </Box>
  )
}

export default Layout