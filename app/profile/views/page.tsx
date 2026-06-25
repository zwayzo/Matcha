"use client"

import { useState, useEffect } from "react"
import { Eye, Loader2 } from "lucide-react"
import { apiService, type ProfileView } from "@/lib/api-service"
import type { User } from "@/lib/auth-context"
import Link from "next/link"
import { AppHeader } from "@/components/app-header"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"

const API_BASE_URL = 'http://localhost:5001'

// Test function to check backend connectivity
const testBackendConnection = async () => {
  const testUrls = [
    'http://localhost:5001',
    'http://localhost:5001', 
    'http://127.0.0.1:5001',
    'http://127.0.0.1:5001'
  ]
  
  for (const baseUrl of testUrls) {
    try {
      console.log(`🔍 Testing connection to ${baseUrl}...`)
      
      // Test health endpoint
      const healthResponse = await fetch(`${baseUrl}/api/users/health`, {
        method: 'GET',
        mode: 'cors'
      })
      console.log(`✅ ${baseUrl}/api/users/health - Status: ${healthResponse.status}, OK: ${healthResponse.ok}`)
      
      // Test simple endpoint without auth
      const testResponse = await fetch(`${baseUrl}/api/users/test`, {
        method: 'GET',
        mode: 'cors'
      })
      console.log(`✅ ${baseUrl}/api/users/test - Status: ${testResponse.status}, OK: ${testResponse.ok}`)
      
      // Test profile visits without auth to check CORS
      const testProfileResponse = await fetch(`${baseUrl}/api/users/test-profile-visits`, {
        method: 'GET',
        mode: 'cors'
      })
      console.log(`✅ ${baseUrl}/api/users/test-profile-visits - Status: ${testProfileResponse.status}, OK: ${testProfileResponse.ok}`)
      
      if (healthResponse.ok && testResponse.ok && testProfileResponse.ok) {
        const healthData = await healthResponse.json()
        const testData = await testResponse.json()
        const testProfileData = await testProfileResponse.json()
        console.log(`✅ Health response from ${baseUrl}:`, healthData)
        console.log(`✅ Test response from ${baseUrl}:`, testData)
        console.log(`✅ Test profile visits response from ${baseUrl}:`, testProfileData)
        return baseUrl // Return the working URL
      }
    } catch (error) {
      console.log(`❌ ${baseUrl} failed:`, error.message)
    }
  }
  
  console.log('❌ No backend endpoints are accessible')
  return null
}

export default function ProfileViewsPage() {
  return (
    <ProtectedRoute>
      <ProfileViewsContent />
    </ProtectedRoute>
  )
}

function ProfileViewsContent() {
  const { user, retryAuth } = useAuth()
  const [views, setViews] = useState<ProfileView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      // Test backend connection first
      testBackendConnection().then(workingUrl => {
        if (workingUrl) {
          console.log('✅ Found working backend at:', workingUrl)
          // Update the API_BASE_URL if we found a different working URL
          if (workingUrl !== API_BASE_URL) {
            console.log(`🔄 Switching from ${API_BASE_URL} to ${workingUrl}`)
          }
          loadViews(workingUrl)
        } else {
          console.log('❌ No working backend found')
          setError('Cannot connect to backend server. Please check if it is running and accessible.')
          setLoading(false)
        }
      })
    }
  }, [user?.id])

  const loadViews = async (backendUrl = API_BASE_URL) => {
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

      const apiUrl = `${backendUrl}/api/users/profile/visits`
      console.log('Fetching profile visits from:', apiUrl)
      console.log('With token:', token ? 'Token present' : 'No token')

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response body:', errorText)
        if (response.status === 401) {
          setError('Session expired. Please log in again.')
        } else if (response.status === 404) {
          setError('Views service not available.')
        } else {
          setError(`Failed to fetch views: ${response.status} - ${errorText}`)
        }
        setLoading(false)
        return
      }

      const data = await response.json()
      console.log('Profile views response:', data)
      
      // Handle empty array
      if (!Array.isArray(data) || data.length === 0) {
        setViews([])
        setLoading(false)
        return
      }

      // Transform backend data to frontend format
      const transformedViews = data.map((item: any, index: number) => {
        const visitorData = item.visitor.user // Backend returns nested user object
        const profileData = item.visitor.profile
        
        return {
          id: `view_${index}`,
          viewerId: visitorData.id.toString(),
          viewedUserId: user.id,
          viewedAt: item.timestamp,
          viewer: {
            id: visitorData.id.toString(),
            email: visitorData.email,
            username: visitorData.username,
            firstName: visitorData.first_name,
            lastName: visitorData.last_name,
            name: `${visitorData.first_name} ${visitorData.last_name}`,
            age: visitorData.age,
            gender: visitorData.sex || "",
            sexualPreference: visitorData.sexualPreference || "",
            title: profileData?.title || "",
            company: profileData?.company || "",
            location: visitorData.location || profileData?.location || "",
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
            onlineStatus: profileData?.online ? "online" : "offline" as const,
            lastSeen: new Date().toISOString(),
            blocked: [],
            reported: [],
            emailVerified: visitorData.emailVerified || false,
            fameRating: profileData?.fame_rating || 0
          }
        } as ProfileView
      })
      
      setViews(transformedViews)
    } catch (error: any) {
      console.error('Network error loading views:', error)
      console.error('Error type:', error.name)
      console.error('Error message:', error.message)
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        // Try the test endpoint without authentication
        try {
          console.log('🔄 Trying test endpoint without authentication...')
          const testResponse = await fetch(`${backendUrl}/api/users/test-profile-visits`, {
            method: 'GET',
            mode: 'cors'
          })
          if (testResponse.ok) {
            const testData = await testResponse.json()
            console.log('✅ Test endpoint works:', testData)
            setError('CORS is working, but the authenticated endpoint is failing. This is likely a server configuration issue.')
          } else {
            console.log('❌ Test endpoint also failed:', testResponse.status)
            setError('Cannot connect to server. Please check if the backend is running on port 5001.')
          }
        } catch (testError) {
          console.log('❌ Test endpoint error:', testError)
          setError('Cannot connect to server. Please check if the backend is running on port 5001.')
        }
      } else {
        setError(error.message || 'Failed to load views')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-0">
      <AppHeader />
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6">Who Viewed Me</h1>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#e65e6b]" />
            <span className="ml-2 text-white/70">Loading profile views...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg inline-block">
              <p>{error}</p>
              <div className="mt-2 space-x-2">
                <button 
                  onClick={() => loadViews()}
                  className="bg-[#e65e6b] text-white px-4 py-2 rounded hover:bg-[#d54556] transition-colors"
                >
                  Try Again
                </button>
                {error.includes('Cannot connect') && (
                  <button 
                    onClick={retryAuth}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    Retry Auth
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : views.length === 0 ? (
          <div className="text-center py-12">
            <Eye className="h-16 w-16 text-white/30 mx-auto mb-4" />
            <p className="text-xl text-white mb-2">No views yet</p>
            <p className="text-white/70">Your profile hasn't been viewed by anyone yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {views.map((view) => (
              <Link 
                key={view.id}
                href={`/profile/${view.viewer.id}`}
                className="group"
              >
                <div className="bg-white/10 backdrop-blur rounded-2xl shadow-lg overflow-hidden border border-white/20 transform group-hover:scale-[1.02] transition-all duration-200">
                  <div className="relative">
                    <img
                      src={view.viewer.profileImage}
                      alt={view.viewer.name}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/avatar.png';
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-full text-sm">
                      {view.viewer.onlineStatus === 'online' ? (
                        <span className="flex items-center">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                          Online
                        </span>
                      ) : (
                        'Offline'
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg text-white">
                        {view.viewer.name}, {view.viewer.age}
                      </h3>
                      {view.viewer.verified && (
                        <div className="w-5 h-5 bg-[#e65e6b] text-white rounded-full flex items-center justify-center text-xs">
                          ✓
                        </div>
                      )}
                    </div>
                    
                    <p className="text-white/70 text-sm mb-1">{view.viewer.title}</p>
                    <p className="text-white/50 text-sm mb-3">{view.viewer.location}</p>
                    
                    <div className="text-xs text-white/40">
                      Viewed {new Date(view.viewedAt).toLocaleDateString()} at{' '}
                      {new Date(view.viewedAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
