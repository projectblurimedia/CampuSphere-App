import { Stack } from 'expo-router'
import 'react-native-reanimated'
import React, { useState, useEffect, useRef } from 'react'
import * as Font from 'expo-font'
import { View, ActivityIndicator, AppState, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Provider, useDispatch, useSelector } from 'react-redux'
import { store } from '@/redux/store'
import { loadEmployeeFromStorage } from '@/redux/employeeSlice'
import { GlobalToast } from '@/components/ui/GlobalToast'
import * as LocalAuthentication from 'expo-local-authentication'
import { MaterialIcons } from '@expo/vector-icons'

// Fonts
import PoppinsLight from '../assets/fonts/Poppins-Light.ttf'
import PoppinsRegular from '../assets/fonts/Poppins-Regular.ttf'
import PoppinsMedium from '../assets/fonts/Poppins-Medium.ttf'
import PoppinsSemiBold from '../assets/fonts/Poppins-SemiBold.ttf'
import PoppinsBold from '../assets/fonts/Poppins-Bold.ttf'
import PoppinsExtraBold from '../assets/fonts/Poppins-ExtraBold.ttf'

// Components
import LoginScreen from '@/pages/login/LoginScreen'

export const unstable_settings = {
  anchor: '(tabs)',
}

// Main App Component (Authenticated)
const MainApp = () => {
  const { employee } = useSelector((state) => state.employee)
  const { colors, currentTheme } = useSelector((state) => state.theme)
  
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />
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
  const dispatch = useDispatch()
  
  // Get authentication state from Redux
  const { isAuthenticated, employee } = useSelector((state) => state.employee)
  const { colors } = useSelector((state) => state.theme)

  // Track if we've already authenticated in this session
  const hasAuthenticatedRef = useRef(false)

  useEffect(() => {
    async function initializeApp() {
      try {
        // 1. Load fonts
        await Font.loadAsync({
          'Poppins-Light': PoppinsLight,
          'Poppins-Regular': PoppinsRegular,
          'Poppins-Medium': PoppinsMedium,
          'Poppins-SemiBold': PoppinsSemiBold,
          'Poppins-Bold': PoppinsBold,
          'Poppins-ExtraBold': PoppinsExtraBold,
        })
        setFontsLoaded(true)
        
        // 2. Load employee data from storage
        await dispatch(loadEmployeeFromStorage()).unwrap()
        
        // 3. Mark app as ready
        setAppReady(true)
      } catch (error) {
        console.error('App initialization error:', error)
        setAppReady(true)
      }
    }
    
    initializeApp()
  }, [dispatch])

  // Trigger biometric when app is ready and user is authenticated (only on first launch)
  useEffect(() => {
    if (appReady && fontsLoaded && isAuthenticated && employee && isFirstLaunch) {
      // Small delay to ensure UI is ready
      setTimeout(() => {
        setIsLocked(true)
        authenticateWithBiometric()
      }, 500)
    }
  }, [appReady, fontsLoaded, isAuthenticated, employee, isFirstLaunch])

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange)
    return () => {
      subscription.remove()
    }
  }, [appState, isAuthenticated, employee])

  const handleAppStateChange = (nextAppState) => {
    // Just track app state changes but don't trigger authentication
    setAppState(nextAppState)
    
    // If app comes to foreground and was in background
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      // DO NOT trigger authentication - only on fresh launch
      console.log('App came from background - no authentication needed')
    }
  }

  const authenticateWithBiometric = async () => {
    // Don't authenticate if already authenticated in this session
    if (hasAuthenticatedRef.current) {
      setIsLocked(false)
      return
    }

    setIsAuthenticating(true)
    
    try {
      // Check if biometric is available
      const compatible = await LocalAuthentication.hasHardwareAsync()
      
      if (!compatible) {
        // If no biometric hardware, just unlock
        hasAuthenticatedRef.current = true
        setIsLocked(false)
        setIsFirstLaunch(false)
        setIsAuthenticating(false)
        return
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync()
      
      if (!enrolled) {
        // If no biometrics enrolled, just unlock
        hasAuthenticatedRef.current = true
        setIsLocked(false)
        setIsFirstLaunch(false)
        setIsAuthenticating(false)
        return
      }

      // Show biometric dialog
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access School App',
        fallbackLabel: 'Use Password Instead',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      })

      if (result.success) {
        // Authentication successful - unlock the app
        hasAuthenticatedRef.current = true
        setIsLocked(false)
        setIsFirstLaunch(false)
      } else {
        // User clicked cancel or closed the dialog
        // Keep the app locked and show lock screen
        console.log('Authentication cancelled - app remains locked')
      }
    } catch (error) {
      console.error('Authentication error:', error)
      // On error, keep the app locked
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleUnlockPress = () => {
    authenticateWithBiometric()
  }

  // Show loading while initializing
  if (!appReady || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <View style={[styles.loadingCard, { backgroundColor: colors.cardBackground }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading...
          </Text>
        </View>
      </View>
    )
  }

  // If not authenticated with school credentials, show login screen
  if (!isAuthenticated || !employee) {
    return <LoginScreen />
  }

  // If app is locked (only on first launch), show lock screen with theme colors
  if (isLocked) {
    return (
      <LockScreen 
        onUnlockPress={handleUnlockPress} 
        isAuthenticating={isAuthenticating}
        colors={colors}
      />
    )
  }

  // If unlocked, show main app
  return <MainApp />
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
  },
})