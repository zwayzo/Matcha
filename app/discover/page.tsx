"use client"

import { useState, useEffect } from "react"
import { X, Heart, Info, SlidersHorizontal, Loader2, Sparkles, Shield, MapPin, Briefcase, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SwipeCard } from "@/components/swipe-card"
import { MatchModal } from "@/components/match-modal"
import { AppHeader } from "@/components/app-header"
import { apiService, type Match } from "@/lib/api-service"
import type { User } from "@/lib/auth-context"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
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

const INDUSTRIES = ["Technology", "Finance", "Healthcare", "Education", "Marketing", "Consulting", "Other"]
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001"

export default function DiscoverPage() {
  return <DiscoverContent />
}

function DiscoverContent() {
  const [profiles, setProfiles] = useState<User[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showMatch, setShowMatch] = useState(false)
  const [matchData, setMatchData] = useState<Match | null>(null)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [swiping, setSwiping] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null)
  const [showBlockDialog, setShowBlockDialog] = useState(false)

  // Filters
  const [ageMin, setAgeMin] = useState<number>(18)
  const [ageMax, setAgeMax] = useState<number>(100)
  const [locationFilter, setLocationFilter] = useState("")
  const [industryFilter, setIndustryFilter] = useState("Any industry")
  const [availableLocations, setAvailableLocations] = useState<string[]>([])

  // Get user_id from localStorage
  const getUserId = () => {
    return localStorage.getItem("user_id")
  }

  useEffect(() => {
    loadProfiles()
    fetchLocations()
    // eslint-disable-next-line
  }, [])

  const fetchLocations = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/locations`)
      const data = await res.json()
      if (data.locations) {
        setAvailableLocations(data.locations)
      }
    } catch (e) {
      console.error("Error fetching locations:", e)
    }
  }

  const loadProfiles = async () => {
    setLoading(true)
    const user_id = getUserId()
    if (!user_id) {
      setProfiles([])
      setLoading(false)
      return
    }
    const params = new URLSearchParams()
    params.append("user_id", user_id)
    params.append("limit", "500")
    if (ageMin) params.append("min_age", ageMin.toString())
    if (ageMax) params.append("max_age", ageMax.toString())
    if (locationFilter) params.append("localisation", locationFilter)
    if (industryFilter && industryFilter !== "Any industry") params.append("industry", industryFilter)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001"}/api/discover?${params.toString()}`)
      const data = await res.json()
      console.log("Discover API response:", data)
      // Map backend user+profile to User type
      const users: User[] = (data.results || []).map((item: any) => ({
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
        fameRating: item.profile?.fame_rating || 0,
        verified: true,
        onlineStatus: "online",
        lastSeen: new Date().toISOString(),
        blocked: [],
        reported: [],
        emailVerified: true
      }))
      setProfiles(users)
      setCurrentIndex(0)
      setLoading(false)
    } catch (e) {
      console.error("Error loading profiles:", e)
      setProfiles([])
      setLoading(false)
    }
  }

  const handleApplyFilters = () => {
    loadProfiles()
  }

  const currentProfile = profiles[currentIndex]

  // Convert User to Profile format for SwipeCard
  const userToProfile = (user: User) => {
    // Find the first non-empty image in photos
    let image = user.profileImage;
    if ((!image || image === "") && user.photos && user.photos.length > 0) {
      image = user.photos.find((img) => !!img && img !== "") || "/avatar.png";
    }
    if (!image || image === "") image = "/avatar.png";
    return {
      id: Number.parseInt(user.id) || 0,
      name: user.name,
      age: user.age,
      title: user.title || "",
      company: user.company || "",
      location: user.location || "",
      bio: user.bio || "",
      interests: user.interests || [],
      education: user.education || "",
      fameRating: user.fameRating || 50,
      image,
    };
  }

  const handleSwipe = async (direction: "left" | "right") => {
    if (!currentProfile || swiping) return
    setSwiping(true)
    setSwipeDirection(direction)
    const user_id = localStorage.getItem("user_id")
    if (!user_id) {
      setSwiping(false)
      setSwipeDirection(null)
      return
    }
    // Map direction to backend action
    const action = direction === "right" ? "like" : "dislike"
    let matchedConversationId: string | null = null
    try {
      const res = await fetch(`${API_BASE_URL}/api/swipe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from_id: user_id, to_id: currentProfile.id, action }),
      })
      const data = await res.json()
      console.log("🔍 Swipe response:", data)
      // If match, show match modal
      if (data.message && data.message.includes("match")) {
        console.log("✅ MATCH DETECTED!")
        matchedConversationId = data.conversation_id ? String(data.conversation_id) : null
        setMatchData({
          id: matchedConversationId || `match-${Date.now()}`,
          userId: user_id,
          matchedUserId: currentProfile.id,
          matchedAt: new Date().toISOString(),
          user: currentProfile,
          conversationId: matchedConversationId || undefined
        })
        // Delay match modal to allow card to exit first
        setTimeout(() => {
          setShowMatch(true)
        }, 400)
      } else {
        console.log("ℹ️ No match yet. Message:", data.message)
      }
    } catch (e) {
      console.error("❌ Swipe error:", e)
    }
    // Remove the swiped profile from the list and always show the next (index 0)
    setTimeout(() => {
      setProfiles((prev) => {
        const updated = [...prev]
        updated.splice(currentIndex, 1)
        return updated
      })
      setCurrentIndex(0)
      setSwiping(false)
      setSwipeDirection(null)
    }, 500)
  }

  const handlePass = () => handleSwipe("left")
  const handleLike = () => handleSwipe("right")

  const handleBlock = async () => {
    const user_id = getUserId()
    if (!user_id || !currentProfile) return
    
    try {
      await apiService.blockUser(user_id, currentProfile.id)
      
      // Remove the blocked user from profiles
      setProfiles(prev => {
        const updated = [...prev]
        updated.splice(currentIndex, 1)
        return updated
      })
      setCurrentIndex(0)
      setShowBlockDialog(false)
    } catch (error) {
      console.error("Error blocking user:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <AppHeader />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-white/70">Loading profiles...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-0">
      <AppHeader />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
            <span className="text-sm font-medium text-white">
              {profiles.length - currentIndex} profiles available
            </span>
          </div>

          {/* Filters */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full bg-white/10 border-white/20 hover:bg-white/20">
                <SlidersHorizontal className="w-5 h-5 text-white" />
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-gray-950 border-white/10 text-white overflow-y-auto w-[280px] sm:max-w-[300px] p-4">
              <SheetHeader className="mb-3">
                <SheetTitle className="text-white text-base font-bold">Filters</SheetTitle>
              </SheetHeader>
              <div className="space-y-4">

                {/* Age Range */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    <Label className="text-white/90 text-xs font-medium">Age Range</Label>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      min="18"
                      max="100"
                      value={ageMin}
                      onChange={(e) => setAgeMin(Number.parseInt(e.target.value))}
                      placeholder="Min"
                      className="bg-white/10 border-white/20 text-white text-xs h-8 placeholder:text-white/40"
                    />
                    <span className="text-white/40 text-xs">to</span>
                    <Input
                      type="number"
                      min="18"
                      max="100"
                      value={ageMax}
                      onChange={(e) => setAgeMax(Number.parseInt(e.target.value))}
                      placeholder="Max"
                      className="bg-white/10 border-white/20 text-white text-xs h-8 placeholder:text-white/40"
                    />
                  </div>
                </div>

                <div className="border-t border-white/10" />

                {/* Location */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-pink-400" />
                    <Label className="text-white/90 text-xs font-medium">Location</Label>
                  </div>
                  <Select value={locationFilter || "any"} onValueChange={(v) => setLocationFilter(v === "any" ? "" : v)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white text-xs h-8 [&>span]:text-white">
                      <SelectValue placeholder="Any location" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/20">
                      <SelectItem value="any" className="text-white/70 text-xs focus:bg-white/10 focus:text-white">Any location</SelectItem>
                      {availableLocations.map((loc) => (
                        <SelectItem key={loc} value={loc} className="text-white text-xs focus:bg-white/10 focus:text-white">
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-t border-white/10" />

                {/* Industry */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                    <Label className="text-white/90 text-xs font-medium">Industry</Label>
                  </div>
                  <Select value={industryFilter} onValueChange={setIndustryFilter}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white text-xs h-8 [&>span]:text-white">
                      <SelectValue placeholder="Any industry" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/20">
                      <SelectItem value="Any industry" className="text-white/70 text-xs focus:bg-white/10 focus:text-white">Any industry</SelectItem>
                      {INDUSTRIES.map((ind) => (
                        <SelectItem key={ind} value={ind} className="text-white text-xs focus:bg-white/10 focus:text-white">
                          {ind}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-t border-white/10" />

                {/* Action Buttons */}
                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={handleApplyFilters}
                    className="flex-1 bg-gradient-to-r from-[#FF5A5F] to-pink-600 hover:opacity-90 text-white text-xs font-semibold h-8"
                  >
                    Apply
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAgeMin(18)
                      setAgeMax(100)
                      setLocationFilter("")
                      setIndustryFilter("Any industry")
                    }}
                    className="flex-1 bg-transparent border-white/20 text-white/70 hover:bg-white/10 hover:text-white text-xs h-8"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Card Stack */}
        <AnimatePresence mode="wait">
          {currentProfile ? (
            <motion.div
              key={currentProfile.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative h-[calc(100vh-320px)] sm:h-[500px] md:h-[600px] mb-6 sm:mb-8">
                <SwipeCard profile={userToProfile(currentProfile)} onSwipe={handleSwipe} />
              </div>

              {/* Enhanced Action Buttons */}
              <motion.div 
                className="flex items-center justify-center gap-4 sm:gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-red-400 hover:bg-red-500/20 hover:border-red-500 transition-all bg-transparent shadow-lg"
                    onClick={handlePass}
                    disabled={swiping}
                  >
                    <X className="w-7 h-7 sm:w-8 sm:h-8 text-red-500" />
                  </Button>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-12 h-12 rounded-full border-2 border-blue-400 hover:bg-blue-500/20 hover:border-blue-500 transition-all bg-transparent shadow-lg"                    onClick={() => router.push(`/profile/${currentProfile.id}`)}
                    disabled={swiping}                  >
                    <Info className="w-6 h-6 text-blue-500" />
                  </Button>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-12 h-12 rounded-full border-2 border-gray-400 hover:bg-gray-500/20 hover:border-gray-500 transition-all bg-transparent shadow-lg"
                    onClick={() => setShowBlockDialog(true)}
                    disabled={swiping}
                  >
                    <Shield className="w-6 h-6 text-gray-500" />
                  </Button>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    size="lg"
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#FF5A5F] to-pink-600 hover:opacity-90 transition-all shadow-xl hover:shadow-2xl"
                    onClick={handleLike}
                    disabled={swiping}
                  >
                    <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-white fill-white" />
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div 
              className="text-center py-20"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-12 h-12 text-[#FF5A5F]" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">No more profiles</h3>
              <p className="text-white/70 mb-6">Check back later for new matches or adjust your filters</p>
              <Button 
                onClick={loadProfiles} 
                className="bg-gradient-to-r from-[#0B66C3] to-[#FF5A5F] hover:opacity-90 shadow-lg"
              >
                Refresh
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Match Modal */}
      <AnimatePresence>
        {showMatch && matchData && (
          <MatchModal 
            profile={userToProfile(matchData.user)}
            conversationId={matchData.conversationId}
            onClose={() => {
              setShowMatch(false)
              // Optionally redirect to chat after closing
              if (matchData.conversationId) {
                setTimeout(() => {
                  router.push(`/chat?conversationId=${matchData.conversationId}`)
                }, 300)
              }
            }} 
          />
        )}
      </AnimatePresence>
      
      {/* Block Dialog */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent className="bg-gray-900 border border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Block User?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              This will block this user and they won't appear in your discover feed anymore. They won't be able to see or interact with your profile. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-gray-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlock}
              className="bg-red-600 hover:bg-red-700"
            >
              Block User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
