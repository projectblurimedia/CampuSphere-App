// components/ui/GlobalToast.js
import React, { useEffect, useRef } from 'react'
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  TouchableOpacity,
  Platform,
  Modal,
} from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { Ionicons } from '@expo/vector-icons'
import { ThemedText } from './themed-text'
import { hideToast } from '@/redux/toastSlice'
import { useTheme } from '@/hooks/useTheme'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export const GlobalToast = () => {
  const { colors } = useTheme()
  const dispatch = useDispatch()
  const { visible, type, message, duration, position } = useSelector(state => state.toast)
  
  const translateX = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(position?.includes('top') ? -100 : 100)).current
  const progressAnim = useRef(new Animated.Value(1)).current
  const autoHideTimer = useRef(null)

  // Get position styles
  const getPositionStyle = () => {
    const positions = {
      'top-left': { top: 50, left: 20, right: undefined },
      'top-right': { top: 50, right: 20, left: undefined },
      'top-center': { top: 20, left: 20, right: 20, alignItems: 'center' },
      'bottom-left': { bottom: 20, left: 20, right: undefined },
      'bottom-right': { bottom: 20, right: 20, left: undefined },
      'bottom-center': { bottom: 20, left: 20, right: 20, alignItems: 'center' }
    }
    return positions[position] || positions['bottom-center']
  }

  // Get icon based on type
  const getIconConfig = () => {
    switch (type) {
      case 'success':
        return { name: 'checkmark-circle', color: '#10b981' }
      case 'error':
        return { name: 'close-circle', color: '#ef4444' }
      case 'warning':
        return { name: 'warning', color: '#f59e0b' }
      case 'info':
      default:
        return { name: 'information-circle', color: '#078ce4' }
    }
  }

  const getTitle = () => {
    switch (type) {
      case 'success':
        return 'Success'
      case 'error':
        return 'Error'
      case 'warning':
        return 'Warning'
      case 'info':
      default:
        return 'Info'
    }
  }

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      translateX.setValue(gestureState.dx)
      opacity.setValue(1 - Math.abs(gestureState.dx) / 200)
    },
    onPanResponderRelease: (_, gestureState) => {
      if (Math.abs(gestureState.dx) > 100 || Math.abs(gestureState.vx) > 0.5) {
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: gestureState.dx > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true
          })
        ]).start(() => {
          clearTimeout(autoHideTimer.current)
          dispatch(hideToast())
        })
      } else {
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            friction: 5
          }),
          Animated.spring(opacity, {
            toValue: 1,
            useNativeDriver: true,
            friction: 5
          })
        ]).start()
      }
    }
  })

  useEffect(() => {
    if (visible && message) {
      translateX.setValue(0)
      opacity.setValue(0)
      slideAnim.setValue(position?.includes('top') ? -100 : 100)
      progressAnim.setValue(1)

      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 8
        }),
        Animated.spring(opacity, {
          toValue: 1,
          useNativeDriver: true,
          tension: 60,
          friction: 8
        })
      ]).start()

      Animated.timing(progressAnim, {
        toValue: 0,
        duration: duration,
        useNativeDriver: true,
      }).start()

      autoHideTimer.current = setTimeout(() => {
        slideOutAndHide()
      }, duration)

      return () => {
        clearTimeout(autoHideTimer.current)
      }
    }
  }, [visible, message, duration, position])

  const slideOutAndHide = () => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: position?.includes('top') ? -100 : 100,
        useNativeDriver: true,
        tension: 60,
        friction: 8
      }),
      Animated.spring(opacity, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 8
      })
    ]).start(() => {
      dispatch(hideToast())
    })
  }

  const handleClose = () => {
    clearTimeout(autoHideTimer.current)
    slideOutAndHide()
  }

  if (!visible || !message) return null

  const backgroundColor = type === 'error' 
    ? '#ef4444' 
    : type === 'success' 
      ? '#10b981'
      : type === 'warning'
        ? '#f59e0b'
        : '#078ce4'
  
  const iconConfig = getIconConfig()
  const title = getTitle()
  const positionStyle = getPositionStyle()

  const toastContent = (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.toastContainer,
        positionStyle,
        { 
          backgroundColor,
          transform: [
            { translateX },
            { translateY: slideAnim }
          ],
          opacity
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.contentContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name={iconConfig.name} size={30} color="#FFFFFF" />
        </View>

        <View style={styles.textContainer}>
          <ThemedText style={styles.toastTitle}>{title}</ThemedText>
          <ThemedText style={styles.toastText}>{message}</ThemedText>
        </View>

        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.progressBarContainer}>
        <Animated.View 
          style={[
            styles.progressBar,
            { 
              backgroundColor: '#FFFFFF',
              transform: [{
                scaleX: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1]
                })
              }]
            }
          ]} 
        />
      </View>
    </Animated.View>
  )

  // Render in a Modal to ensure it appears above everything
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      {toastContent}
    </Modal>
  )
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    maxWidth: SCREEN_WIDTH * 0.95,
    minWidth: 350,
    minHeight: 70,
    zIndex: 999999,
    elevation: 999999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  iconContainer: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  toastText: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
    lineHeight: 18,
  },
  closeButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '100%',
    transformOrigin: 'left center',
  },
})