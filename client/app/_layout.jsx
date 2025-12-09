import { Stack } from 'expo-router'
import 'react-native-reanimated'
import React, { useState, useEffect } from 'react'
import * as Font from 'expo-font'
import { View, ActivityIndicator } from 'react-native'
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

function ThemeContainer({ children }) {
  const { colors, isDark } = useTheme()
  
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* StatusBar component */}
      <StatusBar style={isDark ? "light" : "dark"} />
      {children}
    </View>
  )
}

function AppContent() {
  const [fontsLoaded, setFontsLoaded] = useState(false)
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <ThemeContainer>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.headerBackground,
          },
          headerTintColor: colors.headerText,
          headerTitleStyle: {
            fontFamily: 'Poppins-SemiBold',
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
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
    </ThemeContainer>
  )
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  )
}