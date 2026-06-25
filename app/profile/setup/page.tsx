"use client"

import React, { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Flame, ArrowRight, ArrowLeft, Loader2, X, Upload, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import Image from "next/image"
import { AppHeader } from "@/components/app-header"
const INDUSTRIES = ["Technology", "Finance", "Healthcare", "Education", "Marketing", "Consulting", "Other"]
const EXPERIENCE_LEVELS = ["Entry-level", "Mid-level", "Senior", "Manager", "Director", "Executive", "Founder"]

export default function ProfileSetupPage() {
  return <ProfileSetupContent />
}

function ProfileSetupContent() {
  // Authentication removed - use mock user data
  // const { user, updateProfile } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Mock user data
  const mockUser = {
    age: 29,
    gender: "non-binary" as const,
    sexualPreference: "everyone" as const,
    title: "Software Developer",
    company: "Tech Solutions",
    location: "San Francisco, CA",
    industry: "Technology",
    experienceLevel: "Mid Level",
    education: "BS Computer Science",
    bio: "Passionate developer",
    interests: ["Technology", "Hiking"],
    photos: ["/avatar.png"]
  }

  // Form state
  const [age, setAge] = useState(mockUser.age)
  const [gender, setGender] = useState<"male" | "female" | "non-binary" | "other" | "">(mockUser.gender)
  const [sexualPreference, setSexualPreference] = useState<"men" | "women" | "everyone" | "">(mockUser.sexualPreference)
  const [title, setTitle] = useState(mockUser.title)
  const [company, setCompany] = useState(mockUser.company)
  const [location, setLocation] = useState(mockUser.location)
  const [industry, setIndustry] = useState(mockUser.industry || "")
  const [experienceLevel, setExperienceLevel] = useState(mockUser.experienceLevel || "")
  const [education, setEducation] = useState(mockUser.education || "")
  const [bio, setBio] = useState(mockUser.bio || "")
  const [interests, setInterests] = useState<string[]>(mockUser.interests || [])
  const [currentInterest, setCurrentInterest] = useState("")
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([])
  const [gettingLocation, setGettingLocation] = useState(false)

  // Geolocation functionality
  const getCurrentLocation = async () => {
    setGettingLocation(true)
    
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.")
      setGettingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        try {
          // Simple fallback to coordinates (you can add a geocoding service here)
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
        } catch (error) {
          console.error('Geolocation error:', error)
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
        }
        
        setGettingLocation(false)
      },
      (error) => {
        console.error('Geolocation error:', error)
        let errorMessage = "Unable to get location."
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enter manually."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location unavailable. Please enter manually."
            break
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please enter manually."
            break
        }
        
        alert(errorMessage)
        setGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // 1 minute
      }
    )
  }

  const handleAddInterest = () => {
    if (currentInterest.trim() && interests.length < 6) {
      setInterests([...interests, currentInterest.trim()])
      setCurrentInterest("")
    }
  }

  const handleRemoveInterest = (index: number) => {
    setInterests(interests.filter((_, i) => i !== index))
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (photos.length >= 5) {
      alert("Maximum 5 photos allowed")
      return
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert("Please select an image file")
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB")
      return
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file)
    
    setPhotos([...photos, file])
    setPhotoPreviewUrls([...photoPreviewUrls, previewUrl])
    
    // Reset input
    event.target.value = ''
  }

  const handleRemovePhoto = (index: number) => {
    // Revoke the preview URL to avoid memory leaks
    URL.revokeObjectURL(photoPreviewUrls[index])
    
    setPhotos(photos.filter((_, i) => i !== index))
    setPhotoPreviewUrls(photoPreviewUrls.filter((_, i) => i !== index))
  }

  // Clean up preview URLs on unmount
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleAddPhoto = () => {
    fileInputRef.current?.click()
  }

  const handleNext = () => {
    if (step < 4) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleComplete = async () => {
    setLoading(true)

    // Authentication removed - simulate profile completion
    setTimeout(() => {
      setLoading(false)
      router.push("/discover")
    }, 1000)
  }

  const canProceed = () => {
    if (step === 1) {
      return age > 17 && gender && sexualPreference
    }
    if (step === 2) {
      return title && company && location
    }
    if (step === 3) {
      return industry && experienceLevel && education
    }
    return bio && interests.length > 0 && photos.length >= 1
  }

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-0">
      {/* Header */}
      <header className="border-b border-white/20 bg-black/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-center">
          <div className="flex items-center">
            <Image src="/linder-white.png" alt="Linder" width={48} height={48} />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-12 max-w-2xl">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    s <= step ? "bg-[#e65e6b] text-white" : "bg-white/20 text-white/50"
                  }`}
                >
                  {s}
                </div>
                {s < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${s < step ? "bg-[#e65e6b]" : "bg-white/20"}`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 text-sm text-white/70 text-center">
            <span>Personal</span>
            <span>Career</span>
            <span>Background</span>
            <span>Profile</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white/10 backdrop-blur rounded-3xl shadow-xl p-5 sm:p-8 border border-white/20">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Personal Information</h2>
                <p className="text-white/70">Tell us about yourself</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    min="18"
                    max="100"
                    value={age || ""}
                    onChange={(e) => setAge(Number.parseInt(e.target.value))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Gender</Label>
                  <RadioGroup value={gender} onValueChange={(value) => setGender(value as typeof gender)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male" className="font-normal cursor-pointer">
                        Male
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female" className="font-normal cursor-pointer">
                        Female
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="non-binary" id="non-binary" />
                      <Label htmlFor="non-binary" className="font-normal cursor-pointer">
                        Non-binary
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="other" />
                      <Label htmlFor="other" className="font-normal cursor-pointer">
                        Other
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>Interested in</Label>
                  <RadioGroup value={sexualPreference} onValueChange={(value) => setSexualPreference(value as typeof sexualPreference)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="men" id="men" />
                      <Label htmlFor="men" className="font-normal cursor-pointer">
                        Men
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="women" id="women" />
                      <Label htmlFor="women" className="font-normal cursor-pointer">
                        Women
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="everyone" id="everyone" />
                      <Label htmlFor="everyone" className="font-normal cursor-pointer">
                        Everyone
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Your Career</h2>
                <p className="text-white/70">Tell us about your professional life</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="Product Manager"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    type="text"
                    placeholder="Google"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="flex gap-2">
                    <Input
                      id="location"
                      type="text"
                      placeholder="San Francisco, CA"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={gettingLocation}
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0"
                    >
                      {gettingLocation ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Getting...
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4 mr-2" />
                          GPS
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-white/60">Click GPS to use your current location</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Professional Background */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Professional Background</h2>
                <p className="text-white/70">Help others understand your career</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your industry" />
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
                  <Label htmlFor="experienceLevel">Experience Level</Label>
                  <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your level" />
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
                  <Label htmlFor="education">Education</Label>
                  <Input
                    id="education"
                    type="text"
                    placeholder="Stanford MBA, MIT Computer Science"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Complete Your Profile</h2>
                <p className="text-white/70">Make your profile stand out</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Share a bit about yourself, what you're passionate about, and what you're looking for..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    required
                  />
                  <p className="text-xs text-white/50">{bio.length}/500 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interests">Interests (up to 6 tags)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="interests"
                      type="text"
                      placeholder="e.g., #vegan, #geek, #travel"
                      value={currentInterest}
                      onChange={(e) => setCurrentInterest(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddInterest()
                        }
                      }}
                      disabled={interests.length >= 6}
                    />
                    <Button type="button" onClick={handleAddInterest} disabled={interests.length >= 6}>
                      Add
                    </Button>
                  </div>
                  {interests.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {interests.map((interest, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 text-white rounded-full text-sm font-medium border border-white/20"
                        >
                          {interest}
                          <button
                            type="button"
                            onClick={() => handleRemoveInterest(index)}
                            className="hover:text-red-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Photos (up to 5, profile picture first)</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {photoPreviewUrls.map((previewUrl, index) => (
                      <div
                        key={index}
                        className="relative aspect-square rounded-lg overflow-hidden border-2 border-white/20"
                      >
                        <img
                          src={previewUrl || "/avatar.png"}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {index === 0 && (
                          <div className="absolute top-2 left-2 bg-[#e65e6b] text-white text-xs px-2 py-1 rounded">
                            Profile
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {photos.length < 5 && (
                      <button
                        type="button"
                        onClick={handleAddPhoto}
                        className="aspect-square rounded-lg border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-2 hover:border-[#e65e6b] hover:bg-[#e65e6b]/10"
                      >
                        <Upload className="w-6 h-6 text-white/50" />
                        <span className="text-xs text-white/50">Add Photo</span>
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-white/50">
                    At least 1 photo required. First photo will be your profile picture. Max 5MB per image.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-white/20">
            {step > 1 ? (
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-[#e65e6b] hover:opacity-90"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={!canProceed() || loading}
                className="bg-[#e65e6b] hover:opacity-90"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Completing...
                  </>
                ) : (
                  "Complete Profile"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
