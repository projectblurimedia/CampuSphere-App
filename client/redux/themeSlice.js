import { createSlice } from '@reduxjs/toolkit'
import AsyncStorage from '@react-native-async-storage/async-storage'

const lightTheme = {
  tint: '#1d9bf0',
  cardBackground: '#FFFFFF',
  text: '#11181C',
  textSecondary: '#687076',
  border: '#E6E8EB',
  background: '#F8F9FA',
  primary: '#1d9bf0',
  secondary: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  success: '#10b981',
  icon: '#1d9bf0',
  gradientStart: '#1d9bf0',
  gradientEnd: '#0066cc',
  headerBackground: '#1d9bf0',
  headerText: '#FFFFFF',
  tabBarBackground: '#FFFFFF',
  tabBarActive: '#1d9bf0',
  tabBarInactive: '#687076',
}

const darkTheme = {
  tint: '#1d9bf0',
  cardBackground: '#1C1C1E',
  text: '#FFFFFF',
  textSecondary: '#98989F',
  border: '#2C2C2E',
  background: '#000000',
  primary: '#1d9bf0',
  secondary: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  success: '#10b981',
  icon: '#1d9bf0',
  gradientStart: '#1d9bf0',
  gradientEnd: '#0066cc',
  headerBackground: '#0A0A0A',
  headerText: '#FFFFFF',
  tabBarBackground: '#0A0A0A',
  tabBarActive: '#1d9bf0',
  tabBarInactive: '#98989F',
}

const initialState = {
  theme: 'system',
  currentTheme: 'light',
  light: lightTheme,
  dark: darkTheme,
  colors: lightTheme,
}

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload
      AsyncStorage.setItem('app_theme', action.payload)
    },
    setCurrentTheme: (state, action) => {
      state.currentTheme = action.payload
      state.colors = action.payload === 'dark' ? darkTheme : lightTheme
    },
    loadTheme: (state, action) => {
      if (action.payload) {
        state.theme = action.payload
      }
    },
  },
})

export const { setTheme, setCurrentTheme, loadTheme } = themeSlice.actions
export default themeSlice.reducer