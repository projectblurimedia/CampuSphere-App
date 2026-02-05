import { Stack } from 'expo-router'
import 'react-native-reanimated'
import React, { useState, useEffect } from 'react'
import * as Font from 'expo-font'
import { View, ActivityIndicator } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Provider, useDispatch, useSelector } from 'react-redux'
import { store } from '@/redux/store'
import { loadEmployeeFromStorage } from '@/redux/employeeSlice'

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

const APP_THEME_COLOR = '#1d9bf0'

// Main App Component (Authenticated)
const MainApp = () => {
  const { employee } = useSelector((state) => state.employee)
  
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" />
      
      <Stack>
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="modal" 
          options={{ 
            presentation: 'modal', 
            title: 'Modal',
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
  const dispatch = useDispatch()
  
  // Get authentication state from Redux
  const { 
    isAuthenticated, 
    isLoading: authLoading,
    employee 
  } = useSelector((state) => state.employee)

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
        setAppReady(true) // Still proceed even if there's an error
      }
    }
    
    initializeApp()
  }, [dispatch])

  // Show loading while initializing
  if (!appReady || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
        <ActivityIndicator size="large" color={APP_THEME_COLOR} />
      </View>
    )
  }

  // If not authenticated, show login screen
  if (!isAuthenticated || !employee) {
    return <LoginScreen />
  }

  // If authenticated, show main app
  return <MainApp />
}

// Root Layout
export default function RootLayout() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  )
}