"use client"

import { useState, useEffect } from "react"
import { Search, SlidersHorizontal, Sparkles, MapPin, TrendingUp, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { apiService } from "@/lib/api-service"
import type { User } from "@/lib/auth-context"
import { AppHeader } from "@/components/app-header"
import Link from "next/link"
import { m } from "framer-motion"

const INDUSTRIES = ["Technology", "Finance", "Healthcare", "Education", "Marketing", "Consulting", "Other"]
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001"

export default function SearchPage() {
  return <SearchContent />
}

function SearchContent() {
  // Authentication removed
  // const { user } = useAuth()
  const [profiles, setProfiles] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(true)

  // Filters
  const [ageRange, setAgeRange] = useState<number[]>([18, 65])
  const [locationFilter, setLocationFilter] = useState("")
  const [industryFilter, setIndustryFilter] = useState("Any industry")

  const [availableLocations, setAvailableLocations] = useState<string[]>([])

  // Sorting
  const [sortBy, setSortBy] = useState<"age" | "location">("age")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    handleSearch()
    fetchLocations()
  }, [sortBy, sortOrder])

  const fetchLocations = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/locations`)
      const data = await res.json()
      if (data.locations) setAvailableLocations(data.locations)
    } catch (e) {
      console.error("Error fetching locations:", e)
    }
  }

  const handleSearch = async () => {
    setLoading(true)
    try {
      const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null
      if (!userId) {
        console.error("No user ID found")
        setProfiles([])
        setLoading(false)
        return
      }

      // Build query parameters
      const params = new URLSearchParams()
      params.append("user_id", userId)
      params.append("search_mode", "true")
      
      // Apply filters
      if (ageRange[0] > 18) params.append("min_age", ageRange[0].toString())
      if (ageRange[1] < 100) params.append("max_age", ageRange[1].toString())
      if (locationFilter) params.append("localisation", locationFilter)
      if (industryFilter && industryFilter !== "Any industry") params.append("industry", industryFilter)

      console.log("🔍 Searching with params:", params.toString())
      const res = await fetch(`${API_BASE_URL}/api/discover?${params.toString()}`)
      
      if (!res.ok) {
        console.error("Failed to fetch search results:", res.status, res.statusText)
        setProfiles([])
        setLoading(false)
        return
      }

      const data = await res.json()
      console.log("📥 Search results received:", data)
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
      
      // Apply client-side sorting
      let sortedUsers = [...users]
      if (sortBy === "age") {
        sortedUsers.sort((a, b) => {
          const diff = a.age - b.age
          return sortOrder === "asc" ? diff : -diff
        })
      } else if (sortBy === "location") {
        sortedUsers.sort((a, b) => {
          const aLoc = a.location || ""
          const bLoc = b.location || ""
          const diff = aLoc.localeCompare(bLoc)
          return sortOrder === "asc" ? diff : -diff
        })
      }
      
      console.log("✅ Loaded profiles:", sortedUsers.length)
      setProfiles(sortedUsers)
    } catch (e) {
      console.error("❌ Error loading search results:", e)
      setProfiles([])
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-0">
      <AppHeader />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Advanced Search</h1>
            <p className="text-white/70">Find your perfect professional match</p>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className={`lg:col-span-1 ${showFilters ? "block" : "hidden lg:block"}`}>
              <div className="bg-white/10 backdrop-blur rounded-2xl shadow-lg p-6 border border-white/20 sticky top-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-white">Filters</h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)} className="lg:hidden">
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Age Range */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      
                      Age Range
                    </Label>
                    <div className="px-2">
                      <Slider
                        min={18}
                        max={100}
                        step={1}
                        value={ageRange}
                        onValueChange={setAgeRange}
                        className="mb-2"
                      />
                      <div className="flex justify-between text-sm text-white/70">
                        <span>{ageRange[0]}</span>
                        <span>{ageRange[1]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="location" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#e65e6b]" />
                      Location
                    </Label>
                    <Select value={locationFilter || "any"} onValueChange={(v) => setLocationFilter(v === "any" ? "" : v)}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white [&>span]:text-white">
                        <SelectValue placeholder="Any location" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-white/20">
                        <SelectItem value="any" className="text-white/70 focus:bg-white/10 focus:text-white">Any location</SelectItem>
                        {availableLocations.map((loc) => (
                          <SelectItem key={loc} value={loc} className="text-white focus:bg-white/10 focus:text-white">
                            {loc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Industry */}
                  <div className="space-y-2">
                    <Label htmlFor="industry" className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#e65e6b]" />
                      Industry
                    </Label>
                    <Select value={industryFilter} onValueChange={setIndustryFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Any industry">Any industry</SelectItem>
                        {INDUSTRIES.map((ind) => (
                          <SelectItem key={ind} value={ind}>
                            {ind}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Search Button */}
                  <Button
                    onClick={handleSearch}
                    disabled={loading}
                    className="w-full bg-[#e65e6b] hover:opacity-90"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    {loading ? "Searching..." : "Search"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-3">
              {/* Sort & Filter Toggle */}
              <div className="bg-white/10 backdrop-blur rounded-2xl shadow-lg p-4 mb-6 border border-white/20">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={() => setShowFilters(true)} className="lg:hidden">
                      <SlidersHorizontal className="w-4 h-4 mr-2" />
                      Filters
                    </Button>
                    <span className="text-sm text-white/70">
                      {profiles.length} {profiles.length === 1 ? "result" : "results"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Label className="text-sm text-white/70">Sort by:</Label>
                    <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="age">Age</SelectItem>
                        <SelectItem value="location">Location</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    >
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Results Grid */}
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-white/20 text-center max-w-sm mx-auto">
                    <div className="relative mb-6">
                      <div className="w-16 h-16 border-4 border-white/20 rounded-full mx-auto mb-4"></div>
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-16 border-4 border-transparent border-t-[#e65e6b] rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Search className="w-6 h-6 text-[#e65e6b] animate-pulse" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Finding Matches</h3>
                    <p className="text-white/70 text-sm">Searching through our professional network...</p>
                    <div className="mt-4 flex justify-center space-x-1">
                      <div className="w-2 h-2 bg-[#e65e6b] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                      <div className="w-2 h-2 bg-[#e65e6b] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-[#e65e6b] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              ) : profiles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {profiles.map((profile) => (
                    <Link key={profile.id} href={`/profile/${profile.id}`}>
                      <div className="bg-white/10 backdrop-blur rounded-2xl shadow-lg overflow-hidden border border-white/20 hover:shadow-xl transition-shadow cursor-pointer">
                        <div className="relative h-48 sm:h-64">
                          <img
                            src={profile.profileImage || "/avatar.png"}
                            alt={profile.name}
                            className="w-full h-full object-cover"
                          />
                          {profile.verified && (
                            <div className="absolute top-3 left-3 bg-[#e65e6b] text-white px-2 py-1 rounded-full flex items-center gap-1">
                             
                              <span className="text-xs font-semibold">Verified</span>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="text-xl font-bold text-white mb-1">{profile.name}</h3>
                          <p className="text-sm text-white/70 mb-2">
                            {profile.age} • {profile.location}
                          </p>
                          <p className="text-sm font-medium text-white mb-3">
                            {profile.title} at {profile.company}
                          </p>
                          {profile.interests.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {profile.interests.slice(0, 3).map((interest) => (
                                <span
                                  key={interest}
                                  className="px-2 py-1 bg-white/10 text-white rounded-full text-xs font-medium"
                                >
                                  {interest}
                                </span>
                              ))}
                              {profile.interests.length > 3 && (
                                <span className="px-2 py-1 bg-white/20 text-white/70 rounded-full text-xs font-medium">
                                  +{profile.interests.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-10 h-10 text-[#e65e6b]" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">No results found</h3>
                  <p className="text-white/70 mb-6">Try adjusting your filters or search criteria</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
