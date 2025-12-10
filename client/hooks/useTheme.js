import { useSelector, useDispatch } from 'react-redux'
import { setTheme, setCurrentTheme, loadTheme } from '@/redux/themeSlice'
import { useColorScheme } from 'react-native'
import { useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const useTheme = () => {
  const dispatch = useDispatch()
  const deviceTheme = useColorScheme()
  const { theme, colors, currentTheme } = useSelector(state => state.theme)
  
  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('app_theme')
        if (savedTheme) {
          dispatch(loadTheme(savedTheme))
        }
      } catch (error) {
        console.error('Failed to load theme:', error)
      }
    }
    
    loadSavedTheme()
  }, [dispatch])
  
  useEffect(() => {
    const determineTheme = () => {
      if (theme === 'system') {
        return deviceTheme || 'light'
      }
      return theme
    }
    
    const newTheme = determineTheme()
    if (newTheme !== currentTheme) {
      dispatch(setCurrentTheme(newTheme))
    }
  }, [theme, deviceTheme, currentTheme, dispatch])
  
  const changeTheme = (newTheme) => {
    dispatch(setTheme(newTheme))
  }
  
  return {
    theme,           
    currentTheme,    
    colors,
    changeTheme,
    isDark: currentTheme === 'dark'
  }
}