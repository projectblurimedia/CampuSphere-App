import React from 'react'
import { useEffect } from 'react'
import { useGlobalToast } from '@/hooks/useGlobalToast'

export const ToastNotification = ({ 
  visible, 
  type = 'info', 
  message, 
  duration = 3000, 
  onHide, 
  position = 'top-center',
  showCloseButton = true,
  style: customStyle 
}) => {
  const { showSuccess, showError, showWarning, showInfo } = useGlobalToast()

  useEffect(() => {
    if (visible && message) {
      // Show the appropriate toast based on type
      switch (type) {
        case 'success':
          showSuccess(message, duration)
          break
        case 'error':
          showError(message, duration)
          break
        case 'warning':
          showWarning(message, duration)
          break
        case 'info':
        default:
          showInfo(message, duration)
          break
      }
      
      // Call onHide after the toast duration
      if (onHide) {
        setTimeout(() => {
          onHide()
        }, duration)
      }
    }
  }, [visible, message, type, duration])

  // This component now doesn't render anything
  // It just triggers the global toast
  return null
}