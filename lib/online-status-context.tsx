"use client"

import { createContext, useContext, useEffect, type ReactNode } from "react"
import { useOnlineStatus } from "./use-online-status"

interface OnlineStatusContextType {
  onlineUsers: string[]
  isUserOnline: (userId: string) => boolean
}

const OnlineStatusContext = createContext<OnlineStatusContextType | undefined>(undefined)

export function OnlineStatusProvider({ children }: { children: ReactNode }) {
  const { onlineUsers, connectSocket, disconnectSocket } = useOnlineStatus()

  useEffect(() => {
    // Connect to socket when component mounts
    const userId = localStorage.getItem("user_id")
    if (userId) {
      connectSocket(userId)
    }

    // Cleanup on unmount
    return () => {
      disconnectSocket()
    }
  }, [connectSocket, disconnectSocket])

  const isUserOnline = (userId: string): boolean => {
    return onlineUsers.includes(userId)
  }

  const value: OnlineStatusContextType = {
    onlineUsers,
    isUserOnline,
  }

  return (
    <OnlineStatusContext.Provider value={value}>
      {children}
    </OnlineStatusContext.Provider>
  )
}

export function useOnlineStatusContext(): OnlineStatusContextType {
  const context = useContext(OnlineStatusContext)
  if (context === undefined) {
    throw new Error("useOnlineStatusContext must be used within an OnlineStatusProvider")
  }
  return context
}