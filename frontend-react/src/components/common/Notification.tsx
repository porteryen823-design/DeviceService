import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Alert, Snackbar } from '@mui/material'
import { RootState } from '@/store/store'
import { removeNotification } from '@/store/slices/uiSlice'

const Notification: React.FC = () => {
  const dispatch = useDispatch()
  const notifications = useSelector((state: RootState) => state.ui.notifications)

  const handleClose = (id: string) => {
    dispatch(removeNotification(id))
  }

  return (
    <>
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={notification.duration}
          onClose={() => handleClose(notification.id)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            onClose={() => handleClose(notification.id)}
            severity={notification.type}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  )
}

export default Notification