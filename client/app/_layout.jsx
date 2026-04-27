import { Stack } from 'expo-router'
import 'react-native-reanimated'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import * as Font from 'expo-font'
import { View, ActivityIndicator, AppState, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Provider, useDispatch, useSelector } from 'react-redux'
import { store } from '@/redux/store'
import { loadEmployeeFromStorage, logoutEmployee } from '@/redux/employeeSlice'
import { GlobalToast } from '@/components/ui/GlobalToast'
import * as LocalAuthentication from 'expo-local-authentication'
import { MaterialIcons } from '@expo/vector-icons'
import { disconnectSocket, initializeSocket } from '@/socket/socket'
import axiosApi from '@/utils/axiosApi'
import { ToastNotification } from '@/components/ui/ToastNotification'
import * as SplashScreen from 'expo-splash-screen'
import * as Updates from 'expo-updates'

// Fonts
import PoppinsLight from '../assets/fonts/Poppins-Light.ttf'
import PoppinsRegular from '../assets/fonts/Poppins-Regular.ttf'
import PoppinsMedium from '../assets/fonts/Poppins-Medium.ttf'
import PoppinsSemiBold from '../assets/fonts/Poppins-SemiBold.ttf'
import PoppinsBold from '../assets/fonts/Poppins-Bold.ttf'
import PoppinsExtraBold from '../assets/fonts/Poppins-ExtraBold.ttf'

// Components
import LoginScreen from '@/pages/login/LoginScreen'
import { useTheme } from '@/hooks/useTheme'
import { ThemedText } from '@/components/ui/themed-text'

export const unstable_settings = {
  anchor: '(tabs)',
}

SplashScreen.preventAutoHideAsync()

// Animated Loading Component
const AnimatedLoadingScreen = ({ message, colors }) => {
  const spinValue = useRef(new Animated.Value(0)).current
  const pulseValue = useRef(new Animated.Value(1)).current
  const translateY = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Rotation animation
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start()

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start()

    // Bounce animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -10,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [])

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  return (
    <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.loadingCard, { backgroundColor: colors.cardBackground }]}>
        <Animated.View>
          <MaterialIcons name="school" size={60} color={colors.primary} />
        </Animated.View>
        
        <Animated.View style={{ transform: [{ scale: pulseValue }] }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </Animated.View>
        
        <Animated.Text 
          style={[
            styles.loadingTitle, 
            { color: colors.primary, transform: [{ translateY }] }
          ]}
        >
          {message || 'Loading...'}
        </Animated.Text>
        
        <View style={[styles.loadingProgressBar, { backgroundColor: colors.border }]}>
          <Animated.View style={[styles.loadingProgressFill, { backgroundColor: colors.primary }]} />
        </View>
        
        <ThemedText style={[styles.loadingSubtext, { color: colors.textSecondary }]}>
          Please wait while we prepare your experience
        </ThemedText>
      </Animated.View>
    </View>
  )
}

// Enhanced Lock Screen Component with Theme Support
const LockScreen = ({ onUnlockPress, isAuthenticating, colors }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start()

    // Pulse animation for fingerprint icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [])

  return (
    <View style={[styles.lockContainer, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.statusBarStyle || 'light'} />
      <Animated.View 
        style={[
          styles.lockContent, 
          { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            backgroundColor: colors.cardBackground,
            borderColor: colors.border
          }
        ]}
      >
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
            <MaterialIcons name="fingerprint" size={80} color={colors.primary} />
          </View>
        </Animated.View>
        
        <Text style={[styles.lockTitle, { color: colors.text }]}>
          Authentication Required
        </Text>
        
        <Text style={[styles.lockMessage, { color: colors.textSecondary }]}>
          Verify your identity to access your account
        </Text>
        
        <TouchableOpacity 
          style={[styles.unlockButton, { backgroundColor: colors.primary }]}
          onPress={onUnlockPress}
          disabled={isAuthenticating}
          activeOpacity={0.8}
        >
          {isAuthenticating ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.unlockButtonText}>Authenticating...</Text>
            </>
          ) : (
            <>
              <MaterialIcons name="fingerprint" size={24} color="#fff" />
              <Text style={styles.unlockButtonText}>Unlock with Biometrics</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => {}}
          activeOpacity={0.7}
        >
          <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
            Cancel
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

// Main App Component (Authenticated)
const MainApp = () => {
  const dispatch = useDispatch()
  const { employee } = useSelector((state) => state.employee)
  const { colors } = useTheme()
  const appState = useRef(AppState.currentState)
  const socketConnected = useRef(false)

  useEffect(() => {
    function handleAppStateChange(nextAppState) {
      if (!employee.id) return

      const isInactiveOrBg = nextAppState === 'inactive' || nextAppState === 'background'
      const isActive = nextAppState === 'active'

      if (isInactiveOrBg && socketConnected.current) {
        disconnectSocket(employee.id)
        socketConnected.current = false
      } else if (isActive && !socketConnected.current) {
        initializeSocket(employee.id, dispatch)
        socketConnected.current = true
      }

      appState.current = nextAppState
    }

    if (appState.current === 'active' && employee.id && !socketConnected.current) {
      initializeSocket(employee.id, dispatch)
      socketConnected.current = true
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)

    return () => {
      subscription.remove()
      if (employee.id && socketConnected.current) {
        disconnectSocket(employee.id)
        socketConnected.current = false
      }
    }
  }, [employee.id, dispatch])

  useEffect(() => {
    async function checkUpdate() {
      try {
        const update = await Updates.checkForUpdateAsync()
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync()
          await Updates.reloadAsync()
        }
      } catch (error) {
        console.log('Upload Check failed', error)
      }
    }
  }, [])
  
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={colors.statusBarStyle || 'light'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.cardBackground,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontFamily: 'Poppins-SemiBold',
            color: colors.text,
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen 
          name="(tabs)" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="modal" 
          options={{ 
            presentation: 'modal',
            title: 'Modal',
            headerStyle: {
              backgroundColor: colors.cardBackground,
            },
            headerTintColor: colors.text,
          }} 
        />
      </Stack>
    </View>
  )
}

// App Content with Redux Integration
const AppContent = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false)
  const [appReady, setAppReady] = useState(false)
  const [isLocked, setIsLocked] = useState(true) // Start locked by default
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState('loading') // 'loading', 'checking', 'ready'
  const [toast, setToast] = useState(null)
  const dispatch = useDispatch()
  
  const { isAuthenticated, employee } = useSelector((state) => state.employee)
  const { colors } = useSelector((state) => state.theme)

  const hasAuthenticatedRef = useRef(false)
  const initialCheckComplete = useRef(false)

  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type })
  }, [])

  const hideToast = useCallback(() => {
    setToast(null)
  }, [])

  const checkEmployeeActiveStatus = async () => {
    if (!employee?.id) {
      setVerificationStatus('ready')
      return true
    }

    try {
      const response = await axiosApi.get(`/employees/${employee.id}`)
      
      if (response.data.success && !response.data.data.isActive) {
        showToast('Your account has been deactivated. Please contact administrator.', 'error')
        setTimeout(() => {
          dispatch(logoutEmployee())
          disconnectSocket(employee.id)
        }, 2000)
        setVerificationStatus('ready')
        return false
      }
      
      setVerificationStatus('ready')
      return true
    } catch (error) {
      if (error.response?.status === 404) {
        showToast('Your account no longer exists. Please contact administrator.', 'error')
        setTimeout(() => {
          dispatch(logoutEmployee())
          disconnectSocket(employee.id)
        }, 2000)
      } else {
        showToast('Unable to verify account status. Some features might be limited.', 'warning')
      }
      
      setVerificationStatus('ready')
      return true
    }
  }

  // Load fonts and stored user data
  useEffect(() => {
    async function initializeApp() {
      try {
        await Font.loadAsync({
          'Poppins-Light': PoppinsLight,
          'Poppins-Regular': PoppinsRegular,
          'Poppins-Medium': PoppinsMedium,
          'Poppins-SemiBold': PoppinsSemiBold,
          'Poppins-Bold': PoppinsBold,
          'Poppins-ExtraBold': PoppinsExtraBold,
        })
        setFontsLoaded(true)
        
        await dispatch(loadEmployeeFromStorage()).unwrap()
        setAppReady(true)
        
        await SplashScreen.hideAsync()
      } catch (error) {
        console.error('App initialization error:', error)
        setAppReady(true)
        await SplashScreen.hideAsync()
      }
    }
    
    initializeApp()
  }, [dispatch])

  // Handle verification after app is ready
  useEffect(() => {
    if (appReady && fontsLoaded && isAuthenticated && employee && !initialCheckComplete.current) {
      setVerificationStatus('checking')
      checkEmployeeActiveStatus().then(() => {
        initialCheckComplete.current = true
      })
    } else if (appReady && fontsLoaded && !isAuthenticated) {
      setVerificationStatus('ready')
      initialCheckComplete.current = true
    }
  }, [appReady, fontsLoaded, isAuthenticated, employee])

  // Trigger biometric authentication when ready and user is authenticated
  useEffect(() => {
    if (
      verificationStatus === 'ready' && 
      isAuthenticated && 
      employee && 
      !hasAuthenticatedRef.current &&
      isLocked === true // Only if still locked
    ) {
      authenticateWithBiometric()
    }
  }, [verificationStatus, isAuthenticated, employee, isLocked])

  const authenticateWithBiometric = async () => {
    if (hasAuthenticatedRef.current) {
      setIsLocked(false)
      return
    }

    setIsAuthenticating(true)
    
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync()
      
      if (!compatible) {
        hasAuthenticatedRef.current = true
        setIsLocked(false)
        setIsAuthenticating(false)
        return
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync()
      
      if (!enrolled) {
        hasAuthenticatedRef.current = true
        setIsLocked(false)
        setIsAuthenticating(false)
        return
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access School App',
        fallbackLabel: 'Use Password Instead',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      })

      if (result.success) {
        hasAuthenticatedRef.current = true
        setIsLocked(false)
      } else {
        console.log('Authentication cancelled - app remains locked')
        // Keep locked state
      }
    } catch (error) {
      console.error('Authentication error:', error)
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleUnlockPress = () => {
    authenticateWithBiometric()
  }

  // Show loading states
  if (!appReady || !fontsLoaded || verificationStatus === 'loading' || verificationStatus === 'checking') {
    let loadingMessage = 'Loading...'
    if (verificationStatus === 'checking') {
      loadingMessage = 'Verifying Account...'
    }
    
    return (
      <>
        <AnimatedLoadingScreen message={loadingMessage} colors={colors} />
        <ToastNotification
          visible={!!toast}
          type={toast?.type}
          message={toast?.message}
          onHide={hideToast}
          position="bottom-center"
          duration={3000}
          showCloseButton={true}
        />
      </>
    )
  }

  // Show login screen if not authenticated
  if (!isAuthenticated || !employee) {
    return (
      <>
        <LoginScreen />
        <ToastNotification
          visible={!!toast}
          type={toast?.type}
          message={toast?.message}
          onHide={hideToast}
          position="bottom-center"
          duration={3000}
          showCloseButton={true}
        />
      </>
    )
  }

  // Show lock screen if app is locked (before biometric authentication)
  if (isLocked) {
    return (
      <>
        <LockScreen 
          onUnlockPress={handleUnlockPress} 
          isAuthenticating={isAuthenticating}
          colors={colors}
        />
        <ToastNotification
          visible={!!toast}
          type={toast?.type}
          message={toast?.message}
          onHide={hideToast}
          position="bottom-center"
          duration={3000}
          showCloseButton={true}
        />
      </>
    )
  }

  // Show main app after successful authentication
  return (
    <>
      <MainApp />
      <ToastNotification
        visible={!!toast}
        type={toast?.type}
        message={toast?.message}
        onHide={hideToast}
        position="bottom-center"
        duration={3000}
        showCloseButton={true}
      />
    </>
  )
}

// Root Layout
export default function RootLayout() {
  return (
    <Provider store={store}>
      <AppContent />
      <GlobalToast />
    </Provider>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingCard: {
    padding: 40,
    borderRadius: 30,
    alignItems: 'center',
    gap: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    minWidth: 280,
  },
  loadingTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
    marginTop: 10,
  },
  loadingSubtext: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
  },
  loadingProgressBar: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 10,
  },
  loadingProgressFill: {
    width: '70%',
    height: '100%',
    borderRadius: 2,
  },
  lockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  lockContent: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
    padding: 30,
    borderRadius: 30,
    borderWidth: 1,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  lockTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  lockMessage: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    width: '100%',
  },
  unlockButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#fff',
    marginLeft: 10,
  },
  cancelButton: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
})