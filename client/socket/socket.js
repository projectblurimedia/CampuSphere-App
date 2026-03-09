import { immediateLogout } from '@/redux/employeeSlice'
import AsyncStorage from '@react-native-async-storage/async-storage'
import io from 'socket.io-client'

// const SOCKET_URL = 'https://campusphere-app-socket.onrender.com'
const SOCKET_URL = 'http://192.168.31.232:5000'

let socket = null

export const initializeSocket = (userId, dispatch) => {  
  if (!socket && userId) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: {
        userId,
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socket.on('connect', () => {
      console.log(`Socket connected for user: ${userId}`)
    })

    socket.on('forceLogout', async (data) => {      
      dispatch(immediateLogout())
      try {
        
        await AsyncStorage.removeItem('auth_token')
        await AsyncStorage.removeItem('employee_data')
      } catch (error) {
        console.error('Error during logout:', error)
      }
    })
  }
  return socket
}

export const getSocket = () => {
  if (!socket) {
    throw new Error('Socket not initialized. Call initializeSocket first.')
  }
  return socket
}

export const disconnectSocket = (userId) => {
  if (socket) {
    socket.emit('idleUser', userId)
    socket.disconnect()
    socket = null
    console.log(`Socket disconnected for user: ${userId}`)
  }
}

// New function to force logout an employee
export const forceLogoutEmployee = (userId, reason = 'Your account has been updated. Please login again.') => {
  if (socket) {
    socket.emit('forceLogout', {
      userId,
      reason,
      timestamp: new Date().toISOString()
    })
    console.log(`Force logout emitted for user: ${userId}`)
  }
}