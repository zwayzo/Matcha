"use client"

import { useState, useEffect } from "react"
import { MessageCircle, Loader2, Heart, Briefcase, MapPin, Sparkles, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiService, type Match } from "@/lib/api-service"
import Link from "next/link"
import { UserImage } from "@/components/user-image"
import { AppHeader } from "@/components/app-header"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001'

export default function MatchesPage() {
  return (
    <ProtectedRoute>
      <MatchesContent />
    </ProtectedRoute>
  )
}

function MatchesContent() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [showBlockDialog, setShowBlockDialog] = useState(false)
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null)
  const [isBlocking, setIsBlocking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { token } = useAuth()

  useEffect(() => {
    loadMatches()
    // eslint-disable-next-line
  }, [])

  const loadMatches = async () => {
    setLoading(true)
    const user_id = localStorage.getItem("user_id")
    if (!user_id) {
      setMatches([])
      setLoading(false)
      return
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001"}/api/matches?user_id=${user_id}`)
      const data = await res.json()
      // Map backend users to Match[]
      const matches: Match[] = (data.matches || []).map((item: any) => ({
        id: String(item.conversation_id || item.id),
        userId: String(user_id),
        matchedUserId: String(item.id),
        matchedAt: new Date().toISOString(), // Backend does not return match time
        user: {
          id: String(item.id),
          email: item.email,
          username: item.username,
          firstName: item.first_name,
          lastName: item.last_name,
          name: `${item.first_name} ${item.last_name}`,
          age: item.age,
          gender: item.sex,
          sexualPreference: item.sexualPreference || "",
          title: item.profile?.title || "",
          company: item.profile?.company || "",
          location: item.profile?.location || "",
          bio: item.profile?.bio || "",
          interests: item.profile?.interests || [],
          education: item.profile?.education || "",
          industry: item.profile?.industry || "",
          experienceLevel: item.profile?.experienceLevel || "",
          profileImage: item.profile?.image1 || "/avatar.png",
          photos: [item.profile?.image1, item.profile?.image2, item.profile?.image3, item.profile?.image4].filter(Boolean),
          verified: true,
          onlineStatus: "online",
          lastSeen: new Date().toISOString(),
          blocked: [],
          reported: [],
          emailVerified: true
        },
        conversationId: item.conversation_id ? String(item.conversation_id) : undefined
      }))
      setMatches(matches)
      setLoading(false)
    } catch (e) {
      setMatches([])
      setLoading(false)
    }
  }

  const handleBlock = async (matchId: string) => {
    if (!token) {
      setError('Authentication required. Please log in again.')
      return
    }
    
    try {
      setIsBlocking(true)
      setError(null)
      const match = matches.find(m => m.id === matchId)
      if (!match) {
        setError('Match not found')
        return
      }

      console.log('Blocking user with ID:', match.matchedUserId)
      
      const response = await fetch(`${API_BASE_URL}/api/block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ blocked_id: parseInt(match.matchedUserId) }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Block response error:', errorData)
        throw new Error(errorData.error || 'Failed to block user')
      }

      const result = await response.json()
      console.log('Block success:', result)
      
      // Update local state - remove the match since blocking removes matches
      setMatches(prev => prev.filter(m => m.id !== matchId))
      setShowBlockDialog(false)
      setSelectedMatchId(null)
    } catch (error) {
      console.error("Error blocking user:", error)
      setError(error instanceof Error ? error.message : 'Failed to block user. Please try again.')
    } finally {
      setIsBlocking(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <AppHeader />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-[#e65e6b] mx-auto mb-4" />
            <p className="text-white/70">Loading your matches...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-0">
      <AppHeader />

      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-7xl">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300 text-xs mt-1 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Your Matches</h1>
          <p className="text-base sm:text-lg text-white/70">
            {matches.length === 0
              ? "Start swiping to find your matches"
              : `You have ${matches.length} ${matches.length === 1 ? "match" : "matches"}`}
          </p>
        </div>

        {matches.length === 0 ? (
          // Enhanced Empty State
          <div className="text-center py-16 sm:py-20">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-[#e65e6b]/20 to-[#e65e6b]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#e65e6b]/20">
              <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-[#e65e6b]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">No matches yet</h2>
            <p className="text-white/70 mb-8 max-w-md mx-auto text-sm sm:text-base leading-relaxed">
              Start swiping to find your perfect professional match. Your next connection could be just a swipe away!
            </p>
            <Button asChild className="bg-[#e65e6b] hover:bg-[#d54c58] px-6 py-3 text-base">
              <Link href="/discover">Start Swiping</Link>
            </Button>
          </div>
        ) : (
          // Matches Grid - Enhanced Responsive Design
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {matches.map((match) => (
              <div
                key={match.id}
                className="bg-white/10 backdrop-blur-sm rounded-3xl shadow-lg overflow-hidden border border-white/20 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-white/30"
              >
                {/* Profile Image */}
                <Link href={`/profile/${match.user.id}`}>
                  <div className="relative h-48 sm:h-56 lg:h-64 bg-black cursor-pointer hover:opacity-90 transition-opacity group">
                    <UserImage
                      src={match.user.profileImage || "/avatar.png"}
                      alt={match.user.name}
                      fill
                      className="object-cover"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                    {/* Verified Badge */}
                    {match.user.verified && (
                      <div className="absolute top-3 right-3 px-2.5 py-1.5 bg-black/60 backdrop-blur-sm rounded-full border border-white/20">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-[#e65e6b]" />
                          <span className="text-xs font-semibold text-white">Verified</span>
                        </div>
                      </div>
                    )}

                    {/* Name Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <h3 className="text-xl sm:text-2xl font-bold mb-1 leading-tight">
                        {match.user.name}, {match.user.age}
                      </h3>
                      <p className="text-xs sm:text-sm text-white/80 truncate">
                        {match.user.title}
                      </p>
                    </div>
                  </div>
                </Link>

                {/* Profile Details */}
                <div className="p-4 sm:p-5">
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2 text-xs sm:text-sm text-white/70">
                      <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#e65e6b] mt-0.5 flex-shrink-0" />
                      <span className="font-medium leading-tight">
                        {match.user.title} {match.user.company && `at ${match.user.company}`}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-xs sm:text-sm text-white/70">
                      <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#e65e6b] mt-0.5 flex-shrink-0" />
                      <span className="leading-tight">{match.user.location}</span>
                    </div>
                  </div>

                  {/* Interests */}
                  {match.user.interests && match.user.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {match.user.interests.slice(0, 2).map((interest) => (
                        <span
                          key={interest}
                          className="px-2 py-1 bg-white/10 text-white rounded-full text-xs font-medium border border-white/20 truncate"
                        >
                          {interest}
                        </span>
                      ))}
                      {match.user.interests.length > 2 && (
                        <span className="px-2 py-1 text-white/50 text-xs">+{match.user.interests.length - 2}</span>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Button asChild className="w-full bg-[#e65e6b] hover:bg-[#d54c58] transition-colors text-sm">
                      <Link href={`/chat?matchId=${match.id}`}>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Message
                      </Link>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-red-500/60 text-red-400 hover:bg-red-500/10 hover:border-red-500 transition-all"
                      disabled={isBlocking}
                      onClick={() => {
                        setSelectedMatchId(match.id)
                        setShowBlockDialog(true)
                      }}
                    >
                      {isBlocking ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Shield className="w-4 h-4 mr-2" />
                      )}
                      {isBlocking ? 'Blocking...' : 'Block User'}
                    </Button>
                  </div>

                  {/* Match Time */}
                  <p className="text-xs text-white/40 text-center mt-3">
                    Matched {new Date(match.matchedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Block Dialog */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent className="bg-gray-900 border border-gray-700 max-w-md mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-400" />
              Block User?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              This will permanently block this user and remove them from your matches. They won't be able to contact you, view your profile, or appear in your swipe deck. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
              disabled={isBlocking}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedMatchId && handleBlock(selectedMatchId)}
              disabled={isBlocking}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {isBlocking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Blocking...
                </>
              ) : (
                'Block User'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
