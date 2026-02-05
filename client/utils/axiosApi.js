import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Create axios instance
const axiosApi = axios.create({
  baseURL: 'http://192.168.31.232:8080/api', 
  // baseURL: 'https://campusphere-app-backend.onrender.com/server', 
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add token
axiosApi.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
axiosApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // Handle token expiration (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      // Clear auth data
      await AsyncStorage.removeItem('auth_token')
      await AsyncStorage.removeItem('employee_data')
      
      // You can dispatch a logout action here if needed
      // store.dispatch(logoutEmployee())
      
      return Promise.reject(error)
    }
    
    return Promise.reject(error)
  }
)

export default axiosApi