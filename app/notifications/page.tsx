"use client"

import { useState, useEffect } from "react"
import { Bell, Heart, Eye, MessageCircle, Users, HeartCrack, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiService, type Notification } from "@/lib/api-service"
import Link from "next/link"
import { AppHeader } from "@/components/app-header"
import type { User } from "@/lib/auth-context"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001"

export default function NotificationsPage() {
  return <NotificationsContent />
}

function NotificationsContent() {
  // Authentication removed
  // const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifications()
    // Poll for new notifications every 10 seconds
    const interval = setInterval(loadNotifications, 10000)
    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async () => {
    try {
      const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null
      if (!userId) {
        setNotifications([])
        setLoading(false)
        return
      }

      const res = await fetch(`${API_BASE_URL}/api/notifications?user_id=${userId}`)
      if (!res.ok) {
        console.error("Failed to fetch notifications:", res.status, res.statusText)
        setNotifications([])
        setLoading(false)
        return
      }

      const data = await res.json()
      console.log("📥 Notifications received:", data)
      
      // Map backend notifications to frontend format
      const mappedNotifications: Notification[] = (data.notifications || []).map((notif: any) => {
        const fromUser = notif.fromUser ? {
          id: notif.fromUser.id?.toString() || '',
          email: notif.fromUser.email || '',
          username: notif.fromUser.username || '',
          firstName: notif.fromUser.first_name || '',
          lastName: notif.fromUser.last_name || '',
          name: notif.fromUser.first_name && notif.fromUser.last_name 
            ? `${notif.fromUser.first_name} ${notif.fromUser.last_name}` 
            : notif.fromUser.username || '',
          age: notif.fromUser.age || 0,
          gender: notif.fromUser.sex || 'male' as const,
          sexualPreference: notif.fromUser.sexualPreference || 'everyone' as const,
          title: notif.fromUser.profile?.title || '',
          company: notif.fromUser.profile?.company || '',
          location: notif.fromUser.profile?.location || '',
          bio: notif.fromUser.profile?.bio || '',
          interests: notif.fromUser.profile?.interests || [],
          education: notif.fromUser.profile?.education || '',
          industry: notif.fromUser.profile?.industry || '',
          experienceLevel: notif.fromUser.profile?.experienceLevel || '',
          profileImage: notif.fromUser.profile?.image1 || '/avatar.png',
          photos: [
            notif.fromUser.profile?.image1,
            notif.fromUser.profile?.image2,
            notif.fromUser.profile?.image3,
            notif.fromUser.profile?.image4
          ].filter(Boolean) || ['/avatar.png'],
          verified: notif.fromUser.profile?.verified || false,
          onlineStatus: 'online' as const,
          lastSeen: new Date().toISOString(),
          blocked: [],
          reported: [],
          emailVerified: notif.fromUser.emailVerified || false
        } as User : undefined

        return {
          id: notif.id?.toString() || '',
          userId: notif.userId?.toString() || userId,
          type: notif.type as Notification["type"],
          fromUserId: notif.fromUserId?.toString() || '',
          content: notif.content || '',
          read: notif.read || false,
          createdAt: notif.createdAt || new Date().toISOString(),
          fromUser
        } as Notification
      })

      console.log("✅ Loaded notifications:", mappedNotifications.length)
      setNotifications(mappedNotifications)
    } catch (e) {
      console.error("❌ Error loading notifications:", e)
      setNotifications([])
    }
    setLoading(false)
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      })
      if (res.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        )
      }
    } catch (e) {
      console.error("Error marking notification as read:", e)
      // Optimistically update UI even if API call fails
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      )
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null
      if (!userId) return

      const res = await fetch(`${API_BASE_URL}/api/notifications/read-all?user_id=${userId}`, {
        method: 'PUT'
      })
      if (res.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        )
      }
    } catch (e) {
      console.error("Error marking all notifications as read:", e)
      // Optimistically update UI even if API call fails
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      )
    }
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "like":
        return <Heart className="w-5 h-5 text-[#e65e6b]" />
      case "view":
        return <Eye className="w-5 h-5 text-blue-400" />
      case "message":
        return <MessageCircle className="w-5 h-5 text-purple-400" />
      case "match":
        return <Users className="w-5 h-5 text-green-400" />
      case "unlike":
        return <HeartCrack className="w-5 h-5 text-white/50" />
      default:
        return <Bell className="w-5 h-5 text-white/50" />
    }
  }

  const getNotificationText = (notif: Notification) => {
    const name = notif.fromUser?.name || "Someone"

    switch (notif.type) {
      case "like":
        return `${name} liked your profile`
      case "view":
        return `${name} viewed your profile`
      case "message":
        return `${name}: ${notif.content}`
      case "match":
        return `You matched with ${name}!`
      case "unlike":
        return `${name} unmatched with you`
      default:
        return notif.content
    }
  }

  const getTimeAgo = (date: string) => {
    const now = new Date().getTime()
    const notifTime = new Date(date).getTime()
    const diffMinutes = Math.floor((now - notifTime) / (1000 * 60))

    if (diffMinutes < 1) return "Just now"
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`
    return `${Math.floor(diffMinutes / 1440)}d ago`
  }

  const getNotificationLink = (notif: Notification) => {
    switch (notif.type) {
      case "like":
      case "view":
        return `/profile/${notif.fromUserId}`
      case "match":
        return `/profile/${notif.fromUserId}`
      case "message":
        // Find the conversation ID for this match
        return `/chat?conversationId=${notif.fromUserId}`
      default:
        return "#"
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-0">
      <AppHeader />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Notifications</h1>
            <p className="text-white/70">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}` : "All caught up!"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} variant="outline">
              Mark all as read
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-[#e65e6b] mx-auto mb-4" />
            <p className="text-white/70">Loading notifications...</p>
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`bg-white/10 backdrop-blur rounded-2xl shadow-lg border transition-all ${
                  notif.read ? "border-white/20" : "border-[#e65e6b]/50 bg-[#e65e6b]/10"
                }`}
              >
                <Link href={getNotificationLink(notif)} onClick={() => !notif.read && handleMarkAsRead(notif.id)}>
                  <div className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/5 rounded-2xl">
                    {/* Icon */}
                    <div className="flex-shrink-0">{getNotificationIcon(notif.type)}</div>

                    {/* User Avatar */}
                    {notif.fromUser && (
                      <img
                        src={notif.fromUser.profileImage || "/avatar.png"}
                        alt={notif.fromUser.name}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      />
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${notif.read ? "text-white/70" : "text-white font-semibold"}`}>
                        {getNotificationText(notif)}
                      </p>
                      <p className="text-xs text-white/50 mt-1">{getTimeAgo(notif.createdAt)}</p>
                    </div>

                    {/* Unread Indicator */}
                    {!notif.read && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-[#e65e6b] rounded-full" />
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-10 h-10 text-[#e65e6b]" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No notifications yet</h3>
            <p className="text-white/70">When you get likes, views, and messages, they'll appear here</p>
          </div>
        )}
      </div>
    </div>
  )
}
