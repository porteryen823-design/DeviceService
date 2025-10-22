import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '@/store/store'
import { addNotification } from '@/store/slices/uiSlice'

export const useNotification = () => {
  const dispatch = useDispatch<AppDispatch>()

  const showSuccess = useCallback((message: string, duration?: number) => {
    dispatch(addNotification({
      type: 'success',
      message,
      duration
    }))
  }, [dispatch])

  const showError = useCallback((message: string, duration?: number) => {
    dispatch(addNotification({
      type: 'error',
      message,
      duration
    }))
  }, [dispatch])

  const showWarning = useCallback((message: string, duration?: number) => {
    dispatch(addNotification({
      type: 'warning',
      message,
      duration
    }))
  }, [dispatch])

  const showInfo = useCallback((message: string, duration?: number) => {
    dispatch(addNotification({
      type: 'info',
      message,
      duration
    }))
  }, [dispatch])

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }
}