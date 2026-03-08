import { useEffect, useState } from 'react'
import { initializeSocket, getSocket, disconnectSocket } from './socket'

export const useSocket = (userId) => {
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    if (userId) {
      initializeSocket(userId)
      setSocket(getSocket())

      return () => {
        // Optional: Disconnect only if no other components are using the socket
        // In a real app, you might track active components or use a ref counter
        // disconnectSocket(userId)
      }
    }
  }, [userId])

  return socket
}