import { createSlice } from '@reduxjs/toolkit'
import AsyncStorage from '@react-native-async-storage/async-storage'

const lightTheme = {
  tint: '#1d9bf0',
  cardBackground: '#FFFFFF',
  text: '#11181C',
  textSecondary: '#474d51',
  border: '#E6E8EB',
  background: '#fbfbfc',
  primary: '#1d9bf0',
  secondary: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  success: '#10b981',
  icon: '#1d9bf0',
  gradientStart: '#1394e9',
  gradientEnd: '#0066cc',
  tabBarBackground: '#fbfbfc',
  tabBarActive: '#1d9bf0',
  tabBarInactive: '#4b5963',
}

const darkTheme = {
  tint: '#1d9bf0',
  cardBackground: '#141820',
  text: '#FFFFFF',
  textSecondary: '#dedede',
  border: '#2C2C2E',
  background: '#0c0f14',
  primary: '#1d9bf0',
  secondary: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  success: '#10b981',
  icon: '#1d9bf0',
  gradientStart: '#1394e9',
  gradientEnd: '#0066cc',
  tabBarBackground: '#0c0f14',
  tabBarActive: '#1d9bf0',
  tabBarInactive: '#e9eff7',
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
      
      // Also update currentTheme if not 'system'
      if (action.payload !== 'system') {
        state.currentTheme = action.payload
        state.colors = action.payload === 'dark' ? darkTheme : lightTheme
      }
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