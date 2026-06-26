"use client"

import { useState, useEffect } from "react"
import { Heart, Loader2 } from "lucide-react"
import { apiService } from "@/lib/api-service"
import type { User } from "@/lib/auth-context"
import Link from "next/link"
import { AppHeader } from "@/components/app-header"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001'

export default function WhoLikedMePage() {
  return (
    <ProtectedRoute>
      <WhoLikedMeContent />
    </ProtectedRoute>
  )
}

function WhoLikedMeContent() {
  const { user } = useAuth()
  const [likedBy, setLikedBy] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      loadLikes()
    }
  }, [user?.id])

  const loadLikes = async () => {
    if (!user?.id) return
    
    setLoading(true)
    setError(null)
    
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setError('Authentication required. Please log in again.')
        setLoading(false)
        return
      }

      const response = await fetch(`${API_BASE_URL}/api/users/liked-me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expired. Please log in again.')
        } else if (response.status === 404) {
          setError('Likes service not available.')
        } else {
          setError(`Failed to fetch likes: ${response.status}`)
        }
        setLoading(false)
        return
      }

      const data = await response.json()
      console.log('Liked me response:', data)
      
      // Handle empty array
      if (!Array.isArray(data) || data.length === 0) {
        setLikedBy([])
        setLoading(false)
        return
      }
      
      // Transform backend data to frontend User format
      const transformedUsers = data.map((item: any) => {
        const userData = item.user.user // Backend returns nested user object
        const profileData = item.user.profile
        
        return {
          id: userData.id.toString(),
          email: userData.email,
          username: userData.username,
          firstName: userData.first_name,
          lastName: userData.last_name,
          name: `${userData.first_name} ${userData.last_name}`,
          age: userData.age,
          gender: userData.sex || "",
          sexualPreference: userData.sexualPreference || "",
          title: profileData?.title || "",
          company: profileData?.company || "",
          location: userData.location || profileData?.location || "",
          bio: profileData?.bio || "",
          interests: profileData?.interests || [],
          education: profileData?.education || "",
          industry: profileData?.industry || "",
          experienceLevel: profileData?.experienceLevel || "",
          profileImage: profileData?.image1 || "/avatar.png",
          photos: [
            profileData?.image1,
            profileData?.image2,
            profileData?.image3,
            profileData?.image4
          ].filter(Boolean),
          verified: profileData?.verified || false,
          onlineStatus: (profileData?.online ? "online" : "offline") as "online" | "offline",
          lastSeen: new Date().toISOString(),
          blocked: [],
          reported: [],
          emailVerified: userData.emailVerified || false,
          fameRating: profileData?.fame_rating || 0
        }
      })
      
      setLikedBy(transformedUsers as unknown as User[])

    } catch (error: any) {
      console.error('Error loading likes:', error)
      setError(error.message || 'Failed to load likes')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-0">
      <AppHeader />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Who Liked You</h1>
          <p className="text-white/70">See who's interested in connecting with you</p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-[#e65e6b] mx-auto mb-4" />
            <p className="text-white/70">Loading who liked you...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Oops! Something went wrong</h3>
            <p className="text-white/70 mb-4">{error}</p>
            <button
              onClick={loadLikes}
              className="px-6 py-2 bg-[#e65e6b] text-white rounded-lg hover:bg-[#d54556] transition-colors"
            >
              Try again
            </button>
          </div>
        ) : likedBy.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {likedBy.map((profile) => (
              <Link key={profile.id} href={`/profile/${profile.id}`}>
                <div className="bg-white/10 backdrop-blur rounded-2xl shadow-lg overflow-hidden border border-white/20 hover:shadow-xl transition-shadow cursor-pointer">
                  <div className="relative h-48 sm:h-64">
                    <img
                      src={profile.profileImage || "/avatar.png"}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 bg-[#e65e6b] text-white p-2 rounded-full">
                      <Heart className="w-5 h-5 fill-white" />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-xl font-bold text-white mb-1">{profile.name}</h3>
                    <p className="text-sm text-white/70 mb-2">
                      {profile.age} • {profile.location}
                    </p>
                    <p className="text-sm font-medium text-white">
                      {profile.title} at {profile.company}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-10 h-10 text-[#e65e6b]" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No one has liked you yet</h3>
            <p className="text-white/70 mb-6">Don't worry! Your perfect match is out there. Keep swiping and updating your profile to attract more likes.</p>
            <Link 
              href="/swipe"
              className="inline-block px-6 py-3 bg-[#e65e6b] text-white rounded-lg hover:bg-[#d54556] transition-colors font-medium"
            >
              Start Swiping
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
