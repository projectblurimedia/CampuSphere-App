import { Stack } from 'expo-router'
import 'react-native-reanimated'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import * as Font from 'expo-font'
import { View, ActivityIndicator, AppState, Text, TouchableOpacity, StyleSheet } from 'react-native'
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

export const unstable_settings = {
  anchor: '(tabs)',
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
      // Only act if user is logged in
      if (!employee.id) return

      const isInactiveOrBg = nextAppState === 'inactive'
      const isActive = nextAppState === 'active' || nextAppState === 'background'

      if (isInactiveOrBg && socketConnected.current) {
        disconnectSocket(employee.id)
        socketConnected.current = false
      } else if (isActive && !socketConnected.current) {
        initializeSocket(employee.id, dispatch)
        socketConnected.current = true
      }

      appState.current = nextAppState
    }

    // On mount: connect if active and user exists
    if (appState.current === 'active' && employee.id && !socketConnected.current) {
      initializeSocket(employee.id, dispatch)
      socketConnected.current = true
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)

    // Cleanup
    return () => {
      subscription.remove()
      if (employee.id && socketConnected.current) {
        disconnectSocket(employee.id)
        socketConnected.current = false
      }
    }
  }, [employee.id, dispatch])
  
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={'light'} />
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

// Lock Screen Component
const LockScreen = ({ onUnlockPress, isAuthenticating, colors }) => {
  return (
    <View style={[styles.lockContainer, { backgroundColor: colors.background }]}>
      <View style={styles.lockContent}>
        <MaterialIcons name="lock-outline" size={80} color={colors.primary} />
        <Text style={[styles.lockTitle, { color: colors.text }]}>
          App Locked
        </Text>
        <Text style={[styles.lockMessage, { color: colors.textSecondary }]}>
          This app is secured with biometric authentication. 
          Please unlock to continue.
        </Text>
        
        <TouchableOpacity 
          style={[styles.unlockButton, { backgroundColor: colors.primary }, isAuthenticating && styles.unlockButtonDisabled]}
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
              <Text style={styles.unlockButtonText}>Unlock Now</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

// App Content with Redux Integration
const AppContent = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false)
  const [appReady, setAppReady] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [isFirstLaunch, setIsFirstLaunch] = useState(true)
  const [appState, setAppState] = useState(AppState.currentState)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [toast, setToast] = useState(null)
  const dispatch = useDispatch()
  
  // Get authentication state from Redux
  const { isAuthenticated, employee } = useSelector((state) => state.employee)
  const { colors } = useSelector((state) => state.theme)

  // Track if we've already authenticated in this session
  const hasAuthenticatedRef = useRef(false)

  // Show toast notification
  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type })
  }, [])

  // Hide toast notification
  const hideToast = useCallback(() => {
    setToast(null)
  }, [])

  // Check if employee is still active in database
  const checkEmployeeActiveStatus = async () => {
    if (!employee?.id) {
      setCheckingStatus(false)
      return true
    }

    try {
      console.log('Checking if employee is still active:', employee.id)
      
      const response = await axiosApi.get(`/employees/${employee.id}`)
      
      if (response.data.success) {
        const employeeData = response.data.data
        
        if (!employeeData.isActive) {
          console.log('Employee is no longer active - logging out')
          
          showToast('Your account has been deactivated. Please contact administrator.', 'error')
          
          // Force logout
          setTimeout(() => {
            dispatch(logoutEmployee())
            disconnectSocket(employee.id)
          }, 2000)
          
          setCheckingStatus(false)
          return false
        }
        
        console.log('Employee is active - continuing')
        setCheckingStatus(false)
        return true
      }
    } catch (error) {
      console.error('Error checking employee active status:', error)
      
      if (error.response?.status === 404) {
        console.log('Employee not found in database - logging out')
        
        showToast('Your account no longer exists. Please contact administrator.', 'error')
        
        setTimeout(() => {
          dispatch(logoutEmployee())
          disconnectSocket(employee.id)
        }, 2000)
        
        setCheckingStatus(false)
        return false
      }
      
      showToast('Unable to verify account status. You may continue but some features might be limited.', 'warning')
      
      setCheckingStatus(false)
      return true
    }
  }

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
      } catch (error) {
        console.error('App initialization error:', error)
        setAppReady(true)
      }
    }
    
    initializeApp()
  }, [dispatch])

  useEffect(() => {
    if (appReady && fontsLoaded && isAuthenticated && employee) {
      checkEmployeeActiveStatus()
    } else if (appReady && fontsLoaded && !isAuthenticated) {
      setCheckingStatus(false)
    }
  }, [appReady, fontsLoaded, isAuthenticated, employee])

  useEffect(() => {
    if (appReady && fontsLoaded && isAuthenticated && employee && isFirstLaunch && !checkingStatus) {
      setTimeout(() => {
        setIsLocked(true)
        authenticateWithBiometric()
      }, 500)
    }
  }, [appReady, fontsLoaded, isAuthenticated, employee, isFirstLaunch, checkingStatus])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange)
    return () => {
      subscription.remove()
    }
  }, [])

  const handleAppStateChange = (nextAppState) => {
    setAppState(nextAppState)
    
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      console.log('App came from background - no authentication needed')
    }
  }

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
        setIsFirstLaunch(false)
        setIsAuthenticating(false)
        return
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync()
      
      if (!enrolled) {
        hasAuthenticatedRef.current = true
        setIsLocked(false)
        setIsFirstLaunch(false)
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
        setIsFirstLaunch(false)
      } else {
        console.log('Authentication cancelled - app remains locked')
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

  if (!appReady || !fontsLoaded || checkingStatus) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <View style={[styles.loadingCard, { backgroundColor: colors.cardBackground }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {checkingStatus ? 'Verifying account...' : 'Loading...'}
          </Text>
        </View>
        <ToastNotification
          visible={!!toast}
          type={toast?.type}
          message={toast?.message}
          onHide={hideToast}
          position="bottom-center"
          duration={3000}
          showCloseButton={true}
        />
      </View>
    )
  }

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
  },
  lockTitle: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  lockMessage: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    width: '100%',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  unlockButtonDisabled: {
    opacity: 0.7,
  },
  unlockButtonText: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#fff',
    marginLeft: 10,
  },
  loadingCard: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    gap: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
  },
})