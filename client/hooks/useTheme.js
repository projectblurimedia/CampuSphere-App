import { useSelector, useDispatch } from 'react-redux'
import { setTheme, setCurrentTheme } from '@/redux/themeSlice'
import { useColorScheme } from 'react-native'
import { useEffect } from 'react'

export const useTheme = () => {
  const dispatch = useDispatch()
  const deviceTheme = useColorScheme()
  const { theme, colors, currentTheme } = useSelector(state => state.theme)
  
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