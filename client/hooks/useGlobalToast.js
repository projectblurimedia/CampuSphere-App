import { useDispatch } from 'react-redux'
import { showToast } from '@/redux/toastSlice'
import { useCallback } from 'react'

export const useGlobalToast = () => {
  const dispatch = useDispatch()

  const showSuccess = useCallback((message, duration = 3000) => {
    dispatch(showToast({ type: 'success', message, duration }))
  }, [dispatch])

  const showError = useCallback((message, duration = 3000) => {
    dispatch(showToast({ type: 'error', message, duration }))
  }, [dispatch])

  const showWarning = useCallback((message, duration = 3000) => {
    dispatch(showToast({ type: 'warning', message, duration }))
  }, [dispatch])

  const showInfo = useCallback((message, duration = 3000) => {
    dispatch(showToast({ type: 'info', message, duration }))
  }, [dispatch])

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }
}