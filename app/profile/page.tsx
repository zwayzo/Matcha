"use client"

import { useEffect, useState } from "react"
import { Pencil, Briefcase, MapPin, GraduationCap, Sparkles, X, Upload, Loader2, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AppHeader } from "@/components/app-header"
const INDUSTRIES = ["Technology", "Finance", "Healthcare", "Education", "Marketing", "Consulting", "Other"]
const EXPERIENCE_LEVELS = ["Entry-level", "Mid-level", "Senior", "Manager", "Director", "Executive", "Founder"]
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001"

// Reverse geocode coordinates to a readable location
async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
      { headers: { 'User-Agent': 'Linder-App' } }
    )
    if (res.ok) {
      const data = await res.json()
      const addr = data.address
      const parts = [
        addr.neighbourhood || addr.suburb || addr.quarter || '',
        addr.city || addr.town || addr.village || addr.municipality || '',
        addr.country || ''
      ].filter(Boolean)
      return parts.join(', ') || data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`
    }
  } catch (e) {
    console.error('Reverse geocoding failed:', e)
  }
  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
}

// Get location from IP address as fallback
async function getLocationFromIP(): Promise<string> {
  try {
    const res = await fetch('https://ipapi.co/json/')
    if (res.ok) {
      const data = await res.json()
      const parts = [data.city, data.region, data.country_name].filter(Boolean)
      return parts.join(', ')
    }
  } catch (e) {
    console.error('IP geolocation failed:', e)
  }
  return ''
}

export default function ProfilePage() {
  return <ProfileContent />
}

function ProfileContent() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)

  // Fetch user and profile from backend
  useEffect(() => {
    const loadProfile = async () => {
      const user_id = localStorage.getItem("user_id")
      const token = localStorage.getItem("auth_token")
      
      if (!user_id) {
        console.error("No user_id found in localStorage")
        return
      }
      
      if (!token) {
        console.error("No auth token found in localStorage")
        return
      }
      
      try {
        console.log(`🔍 Fetching profile for user ${user_id}...`)
        const res = await fetch(`${API_BASE_URL}/api/users/${user_id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!res.ok) {
          console.error("Failed to fetch profile:", res.status, res.statusText)
          
          if (res.status === 401) {
            console.error("Authentication failed - token might be invalid")
          }
          
          // Try to get from stored profile as fallback
          const storedProfile = localStorage.getItem("user_profile")
          if (storedProfile) {
            try {
              const data = JSON.parse(storedProfile)
              setUser(data.user)
              setProfile(data.profile)
              console.log("✅ Loaded profile from localStorage fallback")
            } catch (e) {
              console.error("Error parsing stored profile:", e)
            }
          }
          return
        }
        
        const data = await res.json()
        console.log("Profile data loaded:", data)
        setUser(data.user)
        setProfile(data.profile)
      } catch (error) {
        console.error("Error loading profile:", error)
        // Try to get from stored profile as fallback
        const storedProfile = localStorage.getItem("user_profile")
        if (storedProfile) {
          try {
            const data = JSON.parse(storedProfile)
            setUser(data.user)
            setProfile(data.profile)
          } catch (e) {
            console.error("Error parsing stored profile:", e)
          }
        }
      }
    }
    
    loadProfile()
  }, [])

  // Auto-detect location on page load if no location is set
  useEffect(() => {
    if (profile && !profile.location) {
      detectAndUpdateLocation()
    }
  }, [profile])

  const detectAndUpdateLocation = async () => {
    setGeoLoading(true)
    let detectedLocation = ''

    // Try GPS first
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
          })
        })
        detectedLocation = await reverseGeocode(position.coords.latitude, position.coords.longitude)
      } catch {
        // GPS denied or failed — fallback to IP
        detectedLocation = await getLocationFromIP()
      }
    } else {
      // No geolocation API — fallback to IP
      detectedLocation = await getLocationFromIP()
    }

    if (detectedLocation) {
      setLocation(detectedLocation)
      // Save to backend
      const token = localStorage.getItem('auth_token')
      if (token) {
        try {
          await fetch(`${API_BASE_URL}/api/users/update-location`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ location: detectedLocation })
          })
          if (profile) {
            setProfile({ ...profile, location: detectedLocation })
          }
        } catch (e) {
          console.error('Failed to update location on backend:', e)
        }
      }
    }
    setGeoLoading(false)
  }

  const handleUseCurrentLocation = async () => {
    setGeoLoading(true)
    let detectedLocation = ''

    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          })
        })
        detectedLocation = await reverseGeocode(position.coords.latitude, position.coords.longitude)
      } catch {
        detectedLocation = await getLocationFromIP()
      }
    } else {
      detectedLocation = await getLocationFromIP()
    }

    if (detectedLocation) {
      setLocation(detectedLocation)
    }
    setGeoLoading(false)
  }

  // Form state
  const [age, setAge] = useState("")
  const [title, setTitle] = useState("")
  const [company, setCompany] = useState("")
  const [location, setLocation] = useState("")
  const [industry, setIndustry] = useState("")
  const [experienceLevel, setExperienceLevel] = useState("")
  const [education, setEducation] = useState("")
  const [bio, setBio] = useState("")
  const [interests, setInterests] = useState<string[]>([])
  const [currentInterest, setCurrentInterest] = useState("")

  useEffect(() => {
    if (profile) {
      setAge(profile.age || "")
      setTitle(profile.title || "")
      setCompany(profile.company || "")
      setLocation(profile.location || "")
      setIndustry(profile.industry || "")
      setExperienceLevel(profile.experienceLevel || "")
      setEducation(profile.education || "")
      setBio(profile.bio || "")
      setInterests(profile.interests || [])
    }
  }, [profile])

  const handleAddInterest = () => {
    if (currentInterest.trim() && interests.length < 6) {
      setInterests([...interests, currentInterest.trim()])
      setCurrentInterest("")
    }
  }

  const handleRemoveInterest = (index: number) => {
    setInterests(interests.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    setLoading(true)
    
    try {
      const userId = localStorage.getItem("user_id")
      if (!userId) {
        console.error("No user ID found")
        setLoading(false)
        return
      }

      const updateData = {
        age: parseInt(age) || 0,
        title,
        company,
        location,
        industry,
        experienceLevel,
        education,
        bio,
        interests
      }

      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        // Update local state
        if (profile) {
          const updatedProfile = { ...profile, ...updateData }
          setProfile(updatedProfile)
          
          // Update stored profile
          const storedProfile = localStorage.getItem("user_profile")
          if (storedProfile) {
            const data = JSON.parse(storedProfile)
            data.profile = { ...data.profile, ...updateData }
            localStorage.setItem("user_profile", JSON.stringify(data))
          }
        }
        setIsEditing(false)
      } else {
        console.error("Failed to update profile:", response.status, response.statusText)
      }
    } catch (error) {
      console.error("Error updating profile:", error)
    }
    
    setLoading(false)
  }

  const handleCancel = () => {
    if (profile) {
      setAge(profile.age || "")
      setTitle(profile.title || "")
      setCompany(profile.company || "")
      setLocation(profile.location || "")
      setIndustry(profile.industry || "")
      setExperienceLevel(profile.experienceLevel || "")
      setEducation(profile.education || "")
      setBio(profile.bio || "")
      setInterests(profile.interests || [])
    }
    setIsEditing(false)
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-black">
        <AppHeader />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-[#e65e6b] mx-auto mb-4" />
            <p className="text-white/70">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-0">
      <AppHeader />
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-12 max-w-4xl">
        <div className="bg-white/10 backdrop-blur rounded-3xl shadow-xl overflow-hidden border border-white/20">
          {/* Profile Header */}
          <div className="relative h-32 sm:h-48 bg-black">
            <div className="absolute -bottom-12 sm:-bottom-16 left-4 sm:left-8">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white bg-gradient-to-br from-blue-200 to-purple-200 overflow-hidden">
                <img
                  src={profile.image1 || "/avatar.png"}
                  alt={user.first_name || user.username}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
          {/* Profile Content */}
          <div className="pt-16 sm:pt-20 px-4 sm:px-8 pb-6 sm:pb-8">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">{user.first_name} {user.last_name}</h1>
                  {/* Add verified badge if needed */}
                </div>
                <p className="text-white/70">{profile.age ? profile.age + " years old" : null}</p>
              </div>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
            {!isEditing ? (
              // View Mode
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-white mb-4">
                    <Briefcase className="w-5 h-5 text-[#e65e6b]" />
                    <span className="font-semibold">
                      {profile.title} at {profile.company}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70 mb-2">
                    <MapPin className="w-5 h-5 text-[#e65e6b]" />
                    <span>{profile.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70">
                    <GraduationCap className="w-5 h-5 text-[#e65e6b]" />
                    <span>{profile.education}</span>
                  </div>
                </div>
                <div className="pt-6 border-t border-white/20">
                  <h3 className="font-semibold text-white mb-2">About</h3>
                  <p className="text-white/70 leading-relaxed">{profile.bio || "No bio yet"}</p>
                </div>
                <div className="pt-6 border-t border-white/20">
                  <h3 className="font-semibold text-white mb-3">Professional Details</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-white/50">Industry</p>
                      <p className="font-medium text-white">{profile.industry || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-white/50">Experience Level</p>
                      <p className="font-medium text-white">{profile.experienceLevel || "Not specified"}</p>
                    </div>
                  </div>
                </div>
                <div className="pt-6 border-t border-white/20">
                  <h3 className="font-semibold text-white mb-3">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests?.length > 0 ? (
                      profile.interests.map((interest: string) => (
                        <span
                          key={interest}
                          className="px-3 py-1.5 bg-white/10 text-white rounded-full text-sm font-medium border border-white/20"
                        >
                          {interest}
                        </span>
                      ))
                    ) : (
                      <p className="text-white/50">No interests added yet</p>
                    )}
                  </div>
                </div>
                <div className="pt-6 border-t border-white/20">
                  <h3 className="font-semibold text-white mb-3">Photos</h3>
                  {/* Only show image1-4 from backend */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1,2,3,4].map((i) => {
                      const img = profile[`image${i}`]
                      return img ? (
                        <div key={i} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden border-2 border-white/20">
                            <img
                              src={img}
                              alt={`Photo ${i}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {i === 1 && (
                            <div className="absolute top-2 left-2 bg-[#e65e6b] text-white text-xs px-2 py-1 rounded">
                              Profile
                            </div>
                          )}
                        </div>
                      ) : null
                    })}
                  </div>
                </div>
              </div>
            ) : (
              // Edit Mode
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Edit Profile</h2>
                  <div className="flex gap-2">
                    <Button onClick={handleCancel} variant="outline" size="sm">
                      Cancel
                    </Button>
                    <Button onClick={handleSave} size="sm" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-age">Age</Label>
                      <Input
                        id="edit-age"
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="bg-white/10 border-white/20"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-title">Job Title</Label>
                      <Input
                        id="edit-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="bg-white/10 border-white/20"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-company">Company</Label>
                      <Input
                        id="edit-company"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="bg-white/10 border-white/20"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-location">Location</Label>
                      <div className="flex gap-2">
                        <Input
                          id="edit-location"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="bg-white/10 border-white/20 flex-1"
                          placeholder="City, Country"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleUseCurrentLocation}
                          disabled={geoLoading}
                          className="bg-[#e65e6b] hover:bg-[#d54556] whitespace-nowrap"
                        >
                          {geoLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Navigation className="w-4 h-4 mr-1" />
                              GPS
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-education">Education</Label>
                      <Input
                        id="edit-education"
                        value={education}
                        onChange={(e) => setEducation(e.target.value)}
                        className="bg-white/10 border-white/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-industry">Industry</Label>
                      <Select value={industry} onValueChange={setIndustry}>
                        <SelectTrigger className="bg-white/10 border-white/20">
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDUSTRIES.map((ind) => (
                            <SelectItem key={ind} value={ind}>
                              {ind}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-experience">Experience Level</Label>
                      <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                        <SelectTrigger className="bg-white/10 border-white/20">
                          <SelectValue placeholder="Select experience level" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPERIENCE_LEVELS.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-bio">Bio</Label>
                      <Textarea
                        id="edit-bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="bg-white/10 border-white/20 min-h-[100px]"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Interests</Label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {interests.map((interest, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-white/10 text-white rounded-full text-sm font-medium border border-white/20 flex items-center gap-2"
                        >
                          {interest}
                          <X
                            className="w-3 h-3 cursor-pointer hover:text-red-400"
                            onClick={() => handleRemoveInterest(index)}
                          />
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={currentInterest}
                        onChange={(e) => setCurrentInterest(e.target.value)}
                        placeholder="Add an interest..."
                        className="bg-white/10 border-white/20"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddInterest()
                          }
                        }}
                      />
                      <Button onClick={handleAddInterest} size="sm" disabled={!currentInterest.trim() || interests.length >= 6}>
                        Add
                      </Button>
                    </div>
                    {interests.length >= 6 && (
                      <p className="text-xs text-yellow-400 mt-1">Maximum 6 interests allowed</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
