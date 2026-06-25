"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Heart,
  X,
  MessageCircle,
  Share2,
  Ban,
  MapPin,
  Briefcase,
  GraduationCap,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Circle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiService } from "@/lib/api-service"
import type { User } from "@/lib/auth-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Link from "next/link"
import { AppHeader } from "@/components/app-header"
import { FameRating } from "@/components/fame-rating"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"

const API_BASE_URL = 'http://localhost:5001'

export default function ViewProfilePage() {
  return (
    <ProtectedRoute>
      <ViewProfileContent />
    </ProtectedRoute>
  )
}

function ViewProfileContent() {
  const { user } = useAuth() // Re-enable authentication
  const params = useParams()
  const router = useRouter()
  const profileId = params.id as string

  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [hasLiked, setHasLiked] = useState(false)
  const [isMatched, setIsMatched] = useState(false)
  const [showBlockDialog, setShowBlockDialog] = useState(false)
  const [showUnmatchDialog, setShowUnmatchDialog] = useState(false)

  useEffect(() => {
    if (user?.id && profileId && profileId !== user.id) {
      loadProfile()
      trackProfileView()
    }
  }, [profileId, user?.id])

  const trackProfileView = async () => {
    if (!user?.id || !profileId || profileId === user.id) return
    
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return
      
      const response = await fetch(`${API_BASE_URL}/api/users/view/${profileId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        console.log('Profile view tracked successfully')
      } else {
        console.warn('Failed to track profile view:', response.status)
      }
    } catch (error) {
      console.warn('Profile view tracking failed:', error)
    }
  }

  const loadProfile = async () => {
    if (!user?.id) return
    
    setLoading(true)
    
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        console.error('No auth token found')
        setLoading(false)
        return
      }

      console.log('Fetching profile for user:', profileId)
      console.log('API URL:', `${API_BASE_URL}/api/users/${profileId}`)

      const response = await fetch(`${API_BASE_URL}/api/users/${profileId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to fetch profile:', response.status, errorText)
        setLoading(false)
        return
      }

      const data = await response.json()
      console.log('Profile data received:', data)
      
      // Transform backend data to frontend format
      const userData = data.user
      const profileData = data.profile
      
      const transformedProfile: User = {
        id: userData.id.toString(),
        email: userData.email,
        username: userData.username,
        firstName: userData.first_name,
        lastName: userData.last_name,
        name: `${userData.first_name} ${userData.last_name}`,
        age: userData.age,
        gender: userData.sex || "",
        sexualPreference: userData.sexual_preference || "",
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
        fameRating: profileData?.fame_rating || 0,
        verified: profileData?.verified || false,
        onlineStatus: profileData?.online ? "online" : "offline" as const,
        lastSeen: new Date().toISOString(),
        blocked: [],
        reported: [],
        emailVerified: userData.email_verified || false
      }
      
      setProfile(transformedProfile)
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkLikeStatus = async () => {
    if (!user?.id || !profileId) return
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return
      const response = await fetch(`${API_BASE_URL}/api/users/liked-me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        // Check matches to see if we already matched
        const matchesRes = await fetch(`${API_BASE_URL}/api/matches?user_id=${user.id}`)
        if (matchesRes.ok) {
          const matchesData = await matchesRes.json()
          const matched = (matchesData.matches || []).some((m: any) => String(m.id) === profileId)
          if (matched) {
            setHasLiked(true)
            setIsMatched(true)
          }
        }
      }
    } catch (error) {
      console.warn('Failed to check like status:', error)
    }
  }

  useEffect(() => {
    if (user?.id && profileId) {
      checkLikeStatus()
    }
  }, [user?.id, profileId])

  const handleLike = async () => {
    if (!profile) return
    if (!user?.id) return

    if (!profile.photos || profile.photos.length === 0) {
      alert("Cannot like profiles without photos")
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/swipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_id: user.id, to_id: profileId, action: 'like' }),
      })
      const data = await res.json()
      setHasLiked(true)
      if (data.message && data.message.includes('match')) {
        setIsMatched(true)
        alert("It's a match! You can now start chatting.")
      }
    } catch (error) {
      console.error('Error liking profile:', error)
    }
  }

  const handleUnlike = async () => {
    if (!profile || !user?.id) return

    try {
      const res = await fetch(`${API_BASE_URL}/api/swipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_id: user.id, to_id: profileId, action: 'dislike' }),
      })
      if (res.ok) {
        setHasLiked(false)
        setIsMatched(false)
      }
    } catch (error) {
      console.error('Error unliking profile:', error)
    }
  }

  const handleBlock = async () => {
    if (!profile || !user?.id) return

    try {
      await fetch(`${API_BASE_URL}/api/swipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_id: user.id, to_id: profileId, action: 'block' }),
      })
      setShowBlockDialog(false)
      router.push("/discover")
    } catch (error) {
      console.error('Error blocking user:', error)
    }
  }

  const handleUnmatch = async () => {
    if (!profile || !user?.id) return

    try {
      await fetch(`${API_BASE_URL}/api/swipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_id: user.id, to_id: profileId, action: 'dislike' }),
      })
      setIsMatched(false)
      setHasLiked(false)
      setShowUnmatchDialog(false)
      router.push("/discover")
    } catch (error) {
      console.error('Error unmatching:', error)
    }
  }

  const nextPhoto = () => {
    if (profile && currentPhotoIndex < profile.photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1)
    }
  }

  const prevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1)
    }
  }

  const getTimeSinceLastSeen = (lastSeen: string) => {
    const now = new Date().getTime()
    const lastSeenTime = new Date(lastSeen).getTime()
    const diffMinutes = Math.floor((now - lastSeenTime) / (1000 * 60))

    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`
    return `${Math.floor(diffMinutes / 1440)}d ago`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <AppHeader />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="w-12 h-12 border-4 border-[#e65e6b] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black">
        <AppHeader />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Profile not found</h2>
            <Button onClick={() => router.push("/discover")} className="mt-4">
              Back to Discover
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-0">
      <AppHeader />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-5xl">
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Photos */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur rounded-3xl shadow-xl overflow-hidden border border-white/20">
              {/* Photo Gallery */}
              <div className="relative h-[50vh] sm:h-[500px] lg:h-[600px] bg-black">
                <img
                  src={profile.photos[currentPhotoIndex] || profile.profileImage || "/avatar.png"}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />

                {/* Photo Navigation */}
                {profile.photos.length > 1 && (
                  <>
                    {currentPhotoIndex > 0 && (
                      <button
                        onClick={prevPhoto}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-sm p-2 rounded-full hover:bg-white/20 transition-colors"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                    )}
                    {currentPhotoIndex < profile.photos.length - 1 && (
                      <button
                        onClick={nextPhoto}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-sm p-2 rounded-full hover:bg-white/20 transition-colors"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    )}

                    {/* Photo Indicators */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {profile.photos.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentPhotoIndex(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentPhotoIndex ? "bg-[#e65e6b] w-6" : "bg-white/50"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  {profile.verified && (
                    <div className="bg-[#e65e6b] text-white px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      
                      <span className="text-sm font-semibold">Verified</span>
                    </div>
                  )}
                </div>

                {/* Online Status */}
                <div className="absolute top-4 right-4">
                  <div className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
                    <Circle
                      className={`w-2 h-2 ${profile.onlineStatus === "online" ? "fill-green-500 text-green-500" : "fill-gray-400 text-gray-400"}`}
                    />
                    <span className="text-sm font-medium text-white">
                      {profile.onlineStatus === "online" ? "Online" : getTimeSinceLastSeen(profile.lastSeen)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="p-4 sm:p-6">
                <h3 className="text-lg font-bold text-white mb-3">About</h3>
                <p className="text-white/70 leading-relaxed">{profile.bio || "No bio available"}</p>
              </div>
            </div>
          </div>

          {/* Right Column - Info & Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur rounded-3xl shadow-xl p-4 sm:p-6 border border-white/20 sticky top-24">
              {/* Header */}
              <div className="mb-4 sm:mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">{profile.name}</h1>
                <p className="text-white/70">
                  {profile.age} • {profile.gender}
                </p>
              </div>

              {/* Professional Info */}
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-[#e65e6b] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">{profile.title}</p>
                    <p className="text-sm text-white/70">{profile.company}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#e65e6b] flex-shrink-0 mt-0.5" />
                  <p className="text-white/70">{profile.location}</p>
                </div>

                <div className="flex items-start gap-3">
                  <GraduationCap className="w-5 h-5 text-[#e65e6b] flex-shrink-0 mt-0.5" />
                  <p className="text-white/70">{profile.education}</p>
                </div>

                {/* Fame Rating */}
                <div className="pt-2">
                  <FameRating rating={profile.fameRating} size="md" showLabel={true} />
                </div>
              </div>

              {/* Interests */}
              {profile.interests.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-white mb-3">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interest) => (
                      <span
                        key={interest}
                        className="px-3 py-1.5 bg-white/10 text-white rounded-full text-sm font-medium border border-white/20"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Match Status */}
              {hasLiked && (
                <div className="mb-4 p-3 bg-[#e65e6b]/10 border border-[#e65e6b]/20 rounded-lg">
                  <p className="text-sm text-white font-medium">
                    {isMatched ? "You're connected! Start chatting." : "You liked this profile"}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 mb-6">
                {!hasLiked ? (
                  <Button
                    onClick={handleLike}
                    disabled={!profile.photos || profile.photos.length === 0}
                    className="w-full bg-[#e65e6b] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Heart className="w-5 h-5 mr-2" />
                    {!profile.photos || profile.photos.length === 0 ? "No Photos to Like" : "Like Profile"}
                  </Button>
                ) : (
                  <Button onClick={handleUnlike} variant="outline" className="w-full border-2 bg-transparent">
                    <X className="w-5 h-5 mr-2" />
                    Unlike
                  </Button>
                )}

                {isMatched && (
                  <>
                    <Button asChild className="w-full bg-[#e65e6b] hover:opacity-90">
                      <Link href={`/chat?userId=${profileId}`}>
                        <MessageCircle className="w-5 h-5 mr-2" />
                        Send Message
                      </Link>
                    </Button>
                    <Button 
                      onClick={() => setShowUnmatchDialog(true)}
                      variant="outline" 
                      className="w-full border-2 border-orange-500/50 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 hover:border-orange-400"
                    >
                      <X className="w-5 h-5 mr-2" />
                      Unmatch
                    </Button>
                  </>
                )}

                {/* Block Button - Always Visible */}
                <Button 
                  onClick={() => setShowBlockDialog(true)}
                  variant="outline" 
                  className="w-full border-2 border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-400"
                >
                  <Ban className="w-5 h-5 mr-2" />
                  Block User
                </Button>

                {/* Match Status Indicator */}
                {hasLiked && isMatched && (
                  <div className="text-center py-2">
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium border border-green-500/20">
                      <Heart className="w-4 h-4 fill-current" />
                      Connected
                    </span>
                  </div>
                )}
                {hasLiked && !isMatched && (
                  <div className="text-center py-2">
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium border border-blue-500/20">
                      <Heart className="w-4 h-4 fill-current" />
                      Liked
                    </span>
                  </div>
                )}
              </div>

              {/* More Actions */}
              <div className="pt-6 border-t border-white/20 space-y-2">
                <Button variant="ghost" className="w-full justify-start text-white/70 hover:text-white">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Profile
                </Button>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Block Confirmation Dialog */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block {profile.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This user will no longer appear in your search results or be able to contact you. You can unblock them
              later from your settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBlock} className="bg-red-600 hover:bg-red-700">
              Block User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>



      {/* Unmatch Confirmation Dialog */}
      <AlertDialog open={showUnmatchDialog} onOpenChange={setShowUnmatchDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unmatch with {profile.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove your match and you won't be able to message each other anymore. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnmatch} className="bg-orange-600 hover:bg-orange-700">
              Unmatch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
