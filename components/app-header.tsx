"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Flame, User, Heart, MessageCircle, Compass, Search, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { apiService } from "@/lib/api-service"
import { useState, useEffect } from "react"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001"

// Helper function to create a lightweight profile for localStorage (without large base64 images)
function createLightweightProfile(data: any) {
  return {
    user: {
      id: data.user?.id,
      username: data.user?.username,
      email: data.user?.email,
      first_name: data.user?.first_name,
      last_name: data.user?.last_name,
      age: data.user?.age,
      location: data.user?.location
    },
    profile: {
      id: data.profile?.id,
      title: data.profile?.title,
      company: data.profile?.company,
      bio: data.profile?.bio,
      education: data.profile?.education,
      experienceLevel: data.profile?.experienceLevel,
      industry: data.profile?.industry,
      location: data.profile?.location,
      interests: data.profile?.interests,
      // Only store image URLs, not base64 data (base64 images can be several MB each)
      image1: data.profile?.image1?.startsWith('data:') ? null : data.profile?.image1,
      image2: data.profile?.image2?.startsWith('data:') ? null : data.profile?.image2,
      image3: data.profile?.image3?.startsWith('data:') ? null : data.profile?.image3,
      image4: data.profile?.image4?.startsWith('data:') ? null : data.profile?.image4,
    }
  }
}

// Helper function to safely store profile in localStorage
function safeStoreProfile(data: any) {
  try {
    const lightweightProfile = createLightweightProfile(data)
    localStorage.setItem("user_profile", JSON.stringify(lightweightProfile))
  } catch (storageError: any) {
    // If still too large, store only minimal essential data
    if (storageError.name === 'QuotaExceededError') {
      console.warn("Profile too large for localStorage, storing minimal data only")
      const minimalProfile = {
        user: {
          id: data.user?.id,
          username: data.user?.username,
          email: data.user?.email,
          first_name: data.user?.first_name,
          last_name: data.user?.last_name,
          age: data.user?.age
        },
        profile: {
          id: data.profile?.id,
          title: data.profile?.title,
          company: data.profile?.company,
          interests: data.profile?.interests
        }
      }
      try {
        localStorage.setItem("user_profile", JSON.stringify(minimalProfile))
      } catch (e) {
        console.error("Failed to store even minimal profile:", e)
        // Clear old data and try again
        localStorage.removeItem("user_profile")
        try {
          localStorage.setItem("user_profile", JSON.stringify(minimalProfile))
        } catch (finalError) {
          console.error("Final attempt to store profile failed:", finalError)
        }
      }
    } else {
      throw storageError
    }
  }
}

export function AppHeader() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [profileImage, setProfileImage] = useState<string | null>(null)

  useEffect(() => {
    loadUnreadCount()
    loadUserProfileImage()
    // Poll for new notifications every 10 seconds
    const interval = setInterval(loadUnreadCount, 10000)
    return () => clearInterval(interval)
  }, [])

  // Reload profile image when user changes
  useEffect(() => {
    if (user?.profileImage) {
      setProfileImage(user.profileImage)
    } else {
      loadUserProfileImage()
    }
  }, [user])

  const loadUserProfileImage = async () => {
    // First try to get from auth context
    if (user?.profileImage) {
      setProfileImage(user.profileImage)
      return
    }

    // Try to get from stored profile
    const storedProfile = localStorage.getItem("user_profile")
    if (storedProfile) {
      try {
        const data = JSON.parse(storedProfile)
        if (data.profile?.image1) {
          setProfileImage(data.profile.image1)
          return
        }
        // If stored profile has base64 images, clean it up
        if (data.profile?.image1?.startsWith('data:')) {
          console.warn("Found base64 image in stored profile, cleaning up...")
          safeStoreProfile(data)
        }
      } catch (e) {
        console.error("Error parsing stored profile:", e)
        // If parsing fails, might be corrupted - remove it
        localStorage.removeItem("user_profile")
      }
    }

    // Fetch from API as fallback
    const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null
    if (!userId) return

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${userId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.profile?.image1) {
          setProfileImage(data.profile.image1)
          // Store profile safely without large base64 images
          safeStoreProfile(data)
        }
      }
    } catch (e) {
      console.error("Error loading user profile image:", e)
    }
  }

  const loadUnreadCount = async () => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null
    if (!userId) {
      setUnreadCount(0)
      return
    }
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/unread-count?user_id=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.count || 0)
      }
    } catch (e) {
      console.error("Error loading unread count:", e)
    }
  }

  const navItems = [
    { href: "/discover", icon: Compass, label: "Discover" },
    { href: "/search", icon: Search, label: "Search" },
    { href: "/matches", icon: Heart, label: "Matches" },
    { href: "/chat", icon: MessageCircle, label: "Chat" },
  ]

  return (
    <>
    <header className="border-b border-white/20 bg-black/80 backdrop-blur-lg sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/discover" className="flex items-center">
          <Image src="/linder-white.png" alt="Linder" width={48} height={48} />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                pathname === item.href
                  ? "bg-gradient-to-r from-[#0B66C3] to-[#FF5A5F] text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Link href="/notifications">
            <Button
              variant="ghost"
              size="icon"
              className={`relative rounded-full ${pathname === "/notifications" ? "bg-purple-900/20" : ""}`}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </Link>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full overflow-hidden">
                {profileImage || user?.profileImage ? (
                  <img
                    src={profileImage || user?.profileImage || "/avatar.png"}
                    alt={user?.name || "User"}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
                    onError={(e) => {
                      // Fallback to default avatar if image fails to load
                      e.currentTarget.src = "/avatar.png"
                    }}
                  />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <User className="w-4 h-4 mr-2" />
                  My Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile/views" className="cursor-pointer">
                  <Heart className="w-4 h-4 mr-2" />
                  Profile Views
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile/likes" className="cursor-pointer">
                  <Heart className="w-4 h-4 mr-2" />
                  Who Liked Me
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>

    {/* Mobile Bottom Navigation Bar */}
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-lg border-t border-white/20 z-50">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
              pathname === item.href
                ? "text-[#e65e6b]"
                : "text-white/50 hover:text-white"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
        <Link
          href="/profile"
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
            pathname === "/profile"
              ? "text-[#e65e6b]"
              : "text-white/50 hover:text-white"
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-xs font-medium">Profile</span>
        </Link>
      </div>
    </nav>
    </>
  )
}
