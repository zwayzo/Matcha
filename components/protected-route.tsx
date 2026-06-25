"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isProfileComplete, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Get current pathname
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
    
    // Pages that don't require complete profile
    const allowedWithIncompleteProfile = [
      '/profile/likes',
      '/profile/views', 
      '/notifications',
      '/matches',
      '/chat',
      '/discover'
    ]
    
    // Check if it's a profile viewing page (e.g., /profile/123)
    const isProfileViewPage = /^\/profile\/\d+$/.test(currentPath)
    
    const isAllowedPage = allowedWithIncompleteProfile.some(path => currentPath.startsWith(path)) || isProfileViewPage
    
    console.log('🔄 ProtectedRoute check:', { 
      currentPath, 
      isAllowedPage, 
      loading, 
      isAuthenticated, 
      isProfileComplete 
    })
    
    if (!loading && !isAuthenticated) {
      console.log('🚨 Not authenticated, redirecting to login')
      router.push("/login")
    } else if (!loading && isAuthenticated && !isProfileComplete && !isAllowedPage) {
      console.log('🚨 Profile incomplete and not allowed page, redirecting to setup')
      router.push("/profile/setup")
    } else if (!loading && isAuthenticated) {
      console.log('✅ Authenticated, allowing access')
    }
  }, [isAuthenticated, isProfileComplete, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Only require authentication - profile completion is handled in useEffect above
  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
