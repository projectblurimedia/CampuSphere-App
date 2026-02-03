import { useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const authStatus = await AsyncStorage.getItem('is_authenticated')
      const userName = await AsyncStorage.getItem('user_name')
      const userRole = await AsyncStorage.getItem('user_role')
      
      if (authStatus === 'true' && userName) {
        setIsAuthenticated(true)
        setUser({
          name: userName,
          role: userRole || 'Staff'
        })
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    // Add your login logic here
    // For now, simulate successful login
    await AsyncStorage.setItem('is_authenticated', 'true')
    await AsyncStorage.setItem('user_name', 'John Doe')
    await AsyncStorage.setItem('user_role', 'Teacher')
    setIsAuthenticated(true)
    setUser({ name: 'John Doe', role: 'Teacher' })
  }

  const logout = async () => {
    await AsyncStorage.removeItem('is_authenticated')
    await AsyncStorage.removeItem('user_name')
    await AsyncStorage.removeItem('user_role')
    setIsAuthenticated(false)
    setUser(null)
  }

  return {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    checkAuthStatus,
  }
}