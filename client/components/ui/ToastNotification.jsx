// ToastNotification.js
import React, { useEffect } from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import { useTheme } from '@/hooks/useTheme'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

export const ToastNotification = ({ visible, type = 'info', message, duration = 3000, onHide, style: customStyle }) => {
  const { colors } = useTheme()

  useEffect(() => {
    if (visible && onHide) {
      const timer = setTimeout(() => {
        onHide()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [visible, duration, onHide])

  if (!visible || !message) return null

  const backgroundColor = type === 'error' ? colors.danger || '#ef4444' : colors.primary || '#3b82f6'
  const textColor = '#FFFFFF'

  return (
    <View
      style={[
        styles.toastContainer,
        { backgroundColor },
        customStyle,
      ]}
    >
      <Text style={[styles.toastText, { color: textColor }]}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    maxWidth: SCREEN_HEIGHT * 0.8,
    zIndex: 1000,
  },
  toastText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
})