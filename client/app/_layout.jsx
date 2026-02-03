import { Stack } from 'expo-router'
import 'react-native-reanimated'
import React, { useState, useEffect } from 'react'
import * as Font from 'expo-font'
import { View, ActivityIndicator, Platform } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Provider } from 'react-redux'
import { store } from '@/redux/store'
import { useTheme } from '@/hooks/useTheme'

// Fonts
import PoppinsLight from '../assets/fonts/Poppins-Light.ttf'
import PoppinsRegular from '../assets/fonts/Poppins-Regular.ttf'
import PoppinsMedium from '../assets/fonts/Poppins-Medium.ttf'
import PoppinsSemiBold from '../assets/fonts/Poppins-SemiBold.ttf'
import PoppinsBold from '../assets/fonts/Poppins-Bold.ttf'
import PoppinsExtraBold from '../assets/fonts/Poppins-ExtraBold.ttf'

export const unstable_settings = {
  anchor: '(tabs)',
}

const APP_THEME_COLOR = '#1d9bf0'

// Login Component
import LoginScreen from '@/pages/login/LoginScreen'

function AppContent() {
  const [fontsLoaded, setFontsLoaded] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { colors } = useTheme()

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'Poppins-Light': PoppinsLight,
        'Poppins-Regular': PoppinsRegular,
        'Poppins-Medium': PoppinsMedium,
        'Poppins-SemiBold': PoppinsSemiBold,
        'Poppins-Bold': PoppinsBold,
        'Poppins-ExtraBold': PoppinsExtraBold,
      })
      setFontsLoaded(true)
    }
    loadFonts()
  }, [])

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
        <ActivityIndicator size="large" color={APP_THEME_COLOR} />
      </View>
    )
  }

  if (!isAuthenticated) {
    return (
      <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
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

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  )
}