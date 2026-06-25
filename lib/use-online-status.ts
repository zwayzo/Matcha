import { useEffect, useState, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

interface OnlineStatusHook {
  isConnected: boolean
  onlineUsers: string[]
  connectSocket: (userId: string) => void
  disconnectSocket: () => void
}

export function useOnlineStatus(): OnlineStatusHook {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [backendAvailable, setBackendAvailable] = useState(true)
  const socketRef = useRef<Socket | null>(null)

  // Update ref whenever socket changes
  useEffect(() => {
    socketRef.current = socket
  }, [socket])

  const disconnectSocket = useCallback(() => {
    const currentSocket = socketRef.current
    if (currentSocket) {
      currentSocket.disconnect()
      setSocket(null)
      setIsConnected(false)
    }
  }, [])

  const connectSocket = useCallback((userId: string) => {
    const currentSocket = socketRef.current
    if (currentSocket) {
      currentSocket.disconnect()
    }

    const newSocket = io(process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001", {
      query: { user_id: userId },
      timeout: 5000,
      autoConnect: backendAvailable
    })

    newSocket.on('connect', () => {
      setIsConnected(true)
      setBackendAvailable(true)
      console.log('Connected to socket server')
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
      console.log('Disconnected from socket server')
    })

    newSocket.on('connect_error', (error) => {
      console.warn('Socket connection failed:', error.message)
      setBackendAvailable(false)
      setIsConnected(false)
    })

    newSocket.on('user_online', (data: { user_id: string }) => {
      setOnlineUsers(prev => {
        if (!prev.includes(data.user_id)) {
          return [...prev, data.user_id]
        }
        return prev
      })
    })

    newSocket.on('user_offline', (data: { user_id: string }) => {
      setOnlineUsers(prev => prev.filter(id => id !== data.user_id))
    })

    setSocket(newSocket)
  }, [])

  useEffect(() => {
    return () => {
      disconnectSocket()
    }
  }, [disconnectSocket])

  // Fetch initial online users
  useEffect(() => {
    if (!backendAvailable) return

    const fetchOnlineUsers = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001"}/api/user/online_users`, {
          signal: AbortSignal.timeout(5000) // 5 second timeout
        })
        if (response.ok) {
          const data = await response.json()
          setOnlineUsers(data.online || [])
          setBackendAvailable(true)
        } else {
          console.warn('Failed to fetch online users: HTTP', response.status)
          setBackendAvailable(false)
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.warn('Backend server unavailable - disabling online user fetching')
          setBackendAvailable(false)
        }
      }
    }

    fetchOnlineUsers()
    const interval = setInterval(() => {
      if (backendAvailable) {
        fetchOnlineUsers()
      }
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [backendAvailable])

  return {
    isConnected,
    onlineUsers,
    connectSocket,
    disconnectSocket
  }
}