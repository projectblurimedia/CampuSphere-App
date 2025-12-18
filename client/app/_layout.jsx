import { Stack } from 'expo-router'
import 'react-native-reanimated'
import React, { useState, useEffect } from 'react'
import * as Font from 'expo-font'
import { View, ActivityIndicator, Platform, Alert } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Provider } from 'react-redux'
import { store } from '@/redux/store'
import { useTheme } from '@/hooks/useTheme'
import * as Updates from 'expo-updates'

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
const UPDATE_CHECK_INTERVAL = 30000 // 30 seconds
const IS_DEV = __DEV__

function AppContent() {
  const [fontsLoaded, setFontsLoaded] = useState(false)
  const [updateChecking, setUpdateChecking] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const { colors } = useTheme()

  // Load fonts
  useEffect(() => {
    async function loadFonts() {
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
      } catch (error) {
        console.error('Error loading fonts:', error)
        // Fallback - set fonts loaded anyway
        setFontsLoaded(true)
      }
    }
    loadFonts()
  }, [])

  // Auto-update checker for development/preview builds
  useEffect(() => {
    let intervalId

    // Only run update checks in development/preview builds
    const shouldCheckUpdates = !IS_DEV || Platform.OS !== 'web'

    if (shouldCheckUpdates && fontsLoaded) {
      // Initial check
      checkForUpdates()

      // Set up interval for checking updates
      intervalId = setInterval(checkForUpdates, UPDATE_CHECK_INTERVAL)

      // Check on app focus
      const subscription = AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'active') {
          checkForUpdates()
        }
      })

      return () => {
        if (intervalId) clearInterval(intervalId)
        subscription.remove()
      }
    }
  }, [fontsLoaded])

  const checkForUpdates = async () => {
    if (updateChecking || Platform.OS === 'web') return

    try {
      setUpdateChecking(true)
      
      // Check if an update is available
      const update = await Updates.checkForUpdateAsync()
      
      if (update.isAvailable) {
        setUpdateAvailable(true)
        
        // Show notification to user
        Alert.alert(
          'Update Available',
          'A new version of the app is available. Would you like to update now?',
          [
            {
              text: 'Later',
              style: 'cancel'
            },
            {
              text: 'Update Now',
              onPress: fetchAndApplyUpdate
            }
          ]
        )
      }
    } catch (error) {
      console.error('Error checking for updates:', error)
    } finally {
      setUpdateChecking(false)
    }
  }

  const fetchAndApplyUpdate = async () => {
    try {
      setUpdateChecking(true)
      
      // Fetch the update
      await Updates.fetchUpdateAsync()
      
      // Notify user and reload
      Alert.alert(
        'Update Downloaded',
        'The update has been downloaded. The app will now restart.',
        [
          {
            text: 'OK',
            onPress: () => Updates.reloadAsync()
          }
        ]
      )
      
    } catch (error) {
      console.error('Error fetching update:', error)
      Alert.alert('Update Error', 'Failed to download update. Please try again later.')
    } finally {
      setUpdateChecking(false)
      setUpdateAvailable(false)
    }
  }

  // Manual update check (can be triggered from settings)
  const manualCheckForUpdates = async () => {
    if (updateChecking) return
    
    Alert.alert(
      'Check for Updates',
      'Would you like to check for updates now?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Check',
          onPress: async () => {
            try {
              setUpdateChecking(true)
              const update = await Updates.checkForUpdateAsync()
              
              if (update.isAvailable) {
                Alert.alert(
                  'Update Available',
                  'A new update is available. Would you like to download and install it now?',
                  [
                    {
                      text: 'Later',
                      style: 'cancel'
                    },
                    {
                      text: 'Update Now',
                      onPress: fetchAndApplyUpdate
                    }
                  ]
                )
              } else {
                Alert.alert('Up to Date', 'You have the latest version of the app.')
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to check for updates. Please check your connection.')
            } finally {
              setUpdateChecking(false)
            }
          }
        }
      ]
    )
  }

  if (!fontsLoaded) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: colors.background || '#ffffff'
      }}>
        <ActivityIndicator size="large" color={APP_THEME_COLOR} />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="light" />
      
      {/* Update Indicator */}
      {updateChecking && (
        <View style={{
          position: 'absolute',
          top: Platform.OS === 'ios' ? 50 : 30,
          right: 20,
          zIndex: 9999,
          backgroundColor: APP_THEME_COLOR,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 15,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5
        }}>
          <ActivityIndicator size="small" color="#ffffff" />
        </View>
      )}
      
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: APP_THEME_COLOR,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontFamily: 'Poppins-SemiBold',
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
        
        {/* Development/Update Screens */}
        <Stack.Screen
          name="dev/updates"
          options={{
            title: 'App Updates',
            presentation: 'modal'
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

import { AppState } from 'react-native'