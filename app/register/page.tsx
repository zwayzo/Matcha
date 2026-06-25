"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Flame, Mail, Lock, User, Loader2, Upload, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"
import { AppHeader } from "@/components/app-header"
import { useAuth } from "@/lib/auth-context"
import { CountryCitySelector } from "@/components/country-city-selector"

const INTERESTS = [
  "Traveling",
  "Hiking / Nature",
  "Camping",
  "Photography",
  "Reading / Books",
  "Writing / Journaling",
  "Cooking / Baking",
  "Gardening",
  "Painting / Drawing",
  "DIY / Crafts",
  "Dancing",
  "Singing / Music",
  "Playing instruments",
  "Gaming (Video / Board)",
  "Yoga / Meditation",
  "Fitness / Gym",
  "Sports",
  "Biking / Cycling",
  "Running / Marathon",
  "Swimming",
  "Adventure sports",
  "Night owl",
  "Early bird",
  "Introvert",
  "Extrovert",
  "Ambitious",
  "Funny / Humor",
  "Romantic",
  "Geek / Nerd",
  "Creative",
  "Intellectual / Curious",
  "Fashion / Style",
  "Vegan / Vegetarian",
  "Foodie",
  "Traveler",
  "Movies",
  "TV Series / Netflix",
  "Anime / Manga",
  "Comics / Graphic Novels",
  "Music",
  "Podcasts",
  "Gaming (PC, Console, Mobile)",
  "Theater / Performing Arts",
  "Volunteering",
  "Charity work",
  "Environmental activism",
  "Social justice / Causes",
  "Tech / Startups",
  "Entrepreneurship",
  "Networking",
  "Politics / Debates",
  "Casual dating",
  "Serious relationship",
  "Open-minded",
  "Polyamory",
  "LGBTQ+ friendly",
  "Kisses & cuddles",
  "Intellectual connection",
  "Adventure partner",
  "Memes / Internet culture",
  "Astrology / Zodiac",
  "Coffee / Tea lover",
  "Cats / Dogs / Pets",
  "Board games / Puzzles",
  "Cars / Motorcycles",
  "Travel photography",
  "Festivals / Concerts",
  "Wine / Beer tasting"
]

const CATEGORIES = {
  "Hobbies & Activities": [
    "Traveling",
    "Hiking / Nature",
    "Camping",
    "Photography",
    "Reading / Books",
    "Writing / Journaling",
    "Cooking / Baking",
    "Gardening",
    "Painting / Drawing",
    "DIY / Crafts",
    "Dancing",
    "Singing / Music",
    "Playing instruments",
    "Gaming (Video / Board)",
    "Yoga / Meditation",
    "Fitness / Gym",
    "Sports",
    "Biking / Cycling",
    "Running / Marathon",
    "Swimming",
    "Adventure sports"
  ],
  "Lifestyle & Personality": [
    "Night owl",
    "Early bird",
    "Introvert",
    "Extrovert",
    "Ambitious",
    "Funny / Humor",
    "Romantic",
    "Geek / Nerd",
    "Creative",
    "Intellectual / Curious",
    "Fashion / Style",
    "Vegan / Vegetarian",
    "Foodie",
    "Traveler"
  ],
  "Entertainment & Media": [
    "Movies",
    "TV Series / Netflix",
    "Anime / Manga",
    "Comics / Graphic Novels",
    "Music  Hip-Hop, EDM)",
    "Podcasts",
    "Gaming (PC, Console, Mobile)",
    "Theater / Performing Arts"
  ],
  "Social & Community Interests": [
    "Volunteering",
    "Charity work",
    "Environmental activism",
    "Social justice / Causes",
    "Tech / Startups",
    "Entrepreneurship",
    "Networking",
    "Politics / Debates"
  ],
  "Romantic / Dating Preferences": [
    "Casual dating",
    "Serious relationship",
    "Open-minded",
    "Polyamory",
    "LGBTQ+ friendly",
    "Kisses & cuddles",
    "Intellectual connection",
    "Adventure partner"
  ],
  "Random / Fun Interests": [
    "Memes / Internet culture",
    "Astrology / Zodiac",
    "Coffee / Tea lover",
    "Cats / Dogs / Pets",
    "Board games / Puzzles",
    "Cars / Motorcycles",
    "Travel photography",
    "Festivals / Concerts",
    "Wine / Beer tasting"
  ]
}

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [age, setAge] = useState("")
  const [gender, setGender] = useState("")
  const [sexualPreference, setSexualPreference] = useState("")
  const [bio, setBio] = useState("")
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState("All")
  const [searchTerm, setSearchTerm] = useState("")
  const [education, setEducation] = useState("")
  const [industry, setIndustry] = useState("")
  const [experienceLevel, setExperienceLevel] = useState("")
  const [selectedCountry, setSelectedCountry] = useState("")
  const [selectedCity, setSelectedCity] = useState("")
  const [gettingLocation, setGettingLocation] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const { register } = useAuth()

  // Password strength calculation
  const calculatePasswordStrength = (password: string): { score: number; feedback: string; color: string } => {
    let score = 0
    let feedback = ""
    
    if (password.length === 0) {
      return { score: 0, feedback: "", color: "bg-gray-300" }
    }
    
    if (password.length >= 8) score += 1
    if (password.length >= 12) score += 1
    if (/[a-z]/.test(password)) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1
    
    // Check for common words
    const commonWords = ["password", "admin", "welcome", "hello", "goodbye", "please", "thanks", "love", "hate"]
    const hasCommonWord = commonWords.some(word => password.toLowerCase().includes(word))
    if (hasCommonWord) score = Math.max(0, score - 2)
    
    if (score <= 2) {
      feedback = "Weak"
      return { score, feedback, color: "bg-red-500" }
    } else if (score <= 4) {
      feedback = "Medium"
      return { score, feedback, color: "bg-yellow-500" }
    } else {
      feedback = "Strong"
      return { score, feedback, color: "bg-green-500" }
    }
  }

  const passwordStrength = calculatePasswordStrength(password)

  // Password matching validation
  const passwordsMatch = confirmPassword === "" ? null : password === confirmPassword
  const showPasswordMismatch = confirmPassword && !passwordsMatch

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
          // Reverse geocode using OpenStreetMap Nominatim
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=en`,
            { headers: { 'User-Agent': 'Linder-App/1.0' } }
          )
          if (response.ok) {
            const data = await response.json()
            const address = data.address || {}
            const country = address.country || ''
            const city = address.city || address.town || address.village || address.municipality || address.state || ''
            
            if (country) setSelectedCountry(country)
            if (city) setSelectedCity(city)
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error)
          // Fallback: try IP-based geolocation
          try {
            const ipResponse = await fetch('https://ipapi.co/json/')
            if (ipResponse.ok) {
              const ipData = await ipResponse.json()
              if (ipData.country_name) setSelectedCountry(ipData.country_name)
              if (ipData.city) setSelectedCity(ipData.city)
            }
          } catch {
            alert("Unable to detect location. Please select manually.")
          }
        }
        
        setGettingLocation(false)
      },
      async (error) => {
        console.error('Geolocation error:', error)
        // Fallback: try IP-based geolocation
        try {
          const ipResponse = await fetch('https://ipapi.co/json/')
          if (ipResponse.ok) {
            const ipData = await ipResponse.json()
            if (ipData.country_name) setSelectedCountry(ipData.country_name)
            if (ipData.city) setSelectedCity(ipData.city)
          } else {
            alert("Unable to get location. Please select manually.")
          }
        } catch {
          alert("Unable to get location. Please select manually.")
        }
        setGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }

  const handleNext = () => {
    setError("") // Clear any existing errors
    
    // Special validation for step 1 (password requirements)
    if (step === 1) {
      if (!email || !username || !firstName || !lastName || !password || !confirmPassword) {
        setError("Please fill in all required fields")
        return
      }
      
      // Password must match
      if (password !== confirmPassword) {
        setError("Passwords don't match")
        return
      }
      
      // Password must be at least 8 characters
      if (password.length < 8) {
        setError("Password must be at least 8 characters long")
        return
      }
    }
    
    // Validate current step before proceeding
    if (!validateStep(step)) {
      setError("Please complete all required fields")
      return
    }
    
    if (step < 4) setStep(step + 1)
  }

  const handlePrevious = () => {
    setError("") // Clear errors when going back
    if (step > 1) setStep(step - 1)
  }

  const validateStep = (currentStep: number) => {
    switch (currentStep) {
      case 1:
        // For step 1, also check that passwords match
        return email && username && firstName && lastName && password && confirmPassword && password === confirmPassword
      case 2:
        return age && gender && sexualPreference && bio && selectedCountry && selectedCity
      case 3:
        return education && industry && experienceLevel && selectedInterests.length > 0
      case 4:
        return photos.length >= 4
      default:
        return false
    }
  }

  const categoryKeys = ["All", ...Object.keys(CATEGORIES)]
  const currentInterests = activeCategory === "All" ? INTERESTS : CATEGORIES[activeCategory as keyof typeof CATEGORIES]
  const filteredInterests = currentInterests.filter((i: string) => i.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords don't match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters and cannot contain common English words")
      return
    }

    if (photos.length < 4) {
      setError("Please upload at least 4 photos")
      return
    }

    setLoading(true)

    // Convert photos to data URLs
    const photoUrls: string[] = []
    for (let i = 0; i < photos.length; i++) {
      const file = photos[i]
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          resolve(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      })
      photoUrls.push(dataUrl)
    }

    try {
      // Call the register function from auth context
      const result = await register({
        email,
        username,
        firstName,
        lastName,
        password,
        age: parseInt(age),
        gender: gender as "male" | "female" | "non-binary" | "other" | "",
        sexualPreference: sexualPreference as "men" | "women" | "everyone" | "",
        title: "", // Not collected in form, but required by interface
        company: "", // Not collected in form, but required by interface
        location: `${selectedCity}, ${selectedCountry}`,
        bio,
        interests: selectedInterests,
        education,
        industry,
        experienceLevel,
        photos: photoUrls,
      })

      if (result.success) {
        if (result.needsVerification) {
          // Show email verification message instead of logging in
          setSuccess(true)
          setError("") // Clear any errors
        } else {
          setError("Registration completed but verification status unclear")
        }
      } else {
        setError(result.error || "Registration failed")
        setLoading(false)
      }
    } catch (err) {
      console.error("Registration error:", err)
      setError("An error occurred during registration. Please try again.")
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center mb-4">
              <Image src="/linder-white.png" alt="Linder" width={120} height={40} />
            </Link>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-white/20 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26c.3.16.67.16.97 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Check Your Email!</h1>
            <p className="text-white/70 mb-6">
              We've sent a verification link to your email address. Please click the link to activate your account before logging in.
            </p>
            <Button
              onClick={() => router.push("/login")}
              className="w-full bg-[#e65e6b] hover:bg-[#e65e6b]/90 text-white mb-4"
            >
              Go to Login
            </Button>
            <p className="text-xs text-white/50">
              Didn't receive the email? Check your spam folder or contact support.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center mb-4">
            <Image src="/linder-white.png" alt="Linder" width={120} height={40} />
          </Link>
          <p className="text-white/70">Where professionals connect.</p>
        </div>

        {/* Register Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-xl p-6 md:p-8 border border-white/20 max-h-[90vh] overflow-y-auto custom-scrollbar">
          <h1 className="text-2xl font-bold text-white mb-2">Create your account</h1>
          <p className="text-white/70 mb-6">Start your professional dating journey</p>

          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <div
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      s <= step ? "bg-gradient-to-r from-[#0B66C3] to-[#FF5A5F] text-white" : "bg-white/20 text-white/70"
                    }`}
                  >
                    {s}
                  </div>
                  {s < 4 && (
                    <div
                      className={`flex-1 h-1 mx-1 md:mx-2 ${s < step ? "bg-gradient-to-r from-[#0B66C3] to-[#FF5A5F]" : "bg-white/20"}`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center text-xs md:text-sm text-white/70">
              {step === 1 && "Basic Information"}
              {step === 2 && "Personal Details"}
              {step === 3 && "Professional Info"}
              {step === 4 && "Upload Photos"}
            </div>
          </div>

          <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="space-y-3 md:space-y-4">
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <div className="grid md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="johndoe"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-9 md:pl-10 h-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-10"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 md:pl-10 h-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 md:pl-10 h-10"
                      required
                    />
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/60">Password strength:</span>
                        <span className={`font-medium ${
                          passwordStrength.feedback === 'Weak' ? 'text-red-400' :
                          passwordStrength.feedback === 'Medium' ? 'text-yellow-400' :
                          'text-green-400'
                        }`}>
                          {passwordStrength.feedback}
                        </span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                        />
                      </div>
                      <div className="text-xs text-white/50">
                        Requirements: 8+ characters, uppercase, lowercase, number, special character
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-white/60">8+ characters, no common words</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`pl-9 md:pl-10 h-10 ${
                        showPasswordMismatch ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                      required
                    />
                  </div>
                  
                  {/* Password Match Indicator */}
                  {confirmPassword && (
                    <div className="flex items-center text-xs">
                      {passwordsMatch ? (
                        <span className="text-green-400 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Passwords match
                        </span>
                      ) : (
                        <span className="text-red-400 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Passwords don't match
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Personal Details */}
            {step === 2 && (
              <div className="grid md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Your age"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    min="18"
                    max="100"
                    className="h-10"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="non-binary">Non-binary</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="sexualPreference">I'm interested in</Label>
                  <Select value={sexualPreference} onValueChange={setSexualPreference}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="men">Men</SelectItem>
                      <SelectItem value="women">Women</SelectItem>
                      <SelectItem value="everyone">Everyone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="resize-none"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#e65e6b]" />
                    Location
                  </Label>
                  <CountryCitySelector
                    selectedCountry={selectedCountry}
                    selectedCity={selectedCity}
                    onCountryChange={setSelectedCountry}
                    onCityChange={setSelectedCity}
                    onLocationDetect={getCurrentLocation}
                    isDetectingLocation={gettingLocation}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Professional Info */}
            {step === 3 && (
              <div className="space-y-3 md:space-y-4">
                <div className="grid md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="education">Education</Label>
                    <Input
                      id="education"
                      placeholder="e.g. Bachelor's in CS"
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                      className="h-10"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select value={industry} onValueChange={setIndustry}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Healthcare">Healthcare</SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Consulting">Consulting</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="experienceLevel">Experience Level</Label>
                    <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Entry-level">Entry-level</SelectItem>
                        <SelectItem value="Mid-level">Mid-level</SelectItem>
                        <SelectItem value="Senior">Senior</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                        <SelectItem value="Director">Director</SelectItem>
                        <SelectItem value="Executive">Executive</SelectItem>
                        <SelectItem value="Founder">Founder</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Interests (select up to 6)</Label>
                    <span className="text-xs text-white/70">{selectedInterests.length}/6 selected</span>
                  </div>
                  
                  {/* Search and Category Filter */}
                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="Search interests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-9"
                    />
                    <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-2" style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
                    }}>
                      {categoryKeys.map((cat) => (
                        <Button
                          key={cat}
                          type="button"
                          variant={activeCategory === cat ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setActiveCategory(cat)
                            setSearchTerm("")
                          }}
                          className="text-xs h-7 px-2 whitespace-nowrap"
                        >
                          {cat}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Selected Interests Display */}
                  {selectedInterests.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-2 bg-white/5 rounded-lg border border-white/10">
                      {selectedInterests.map((interest) => (
                        <span
                          key={interest}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-[#0B66C3] to-[#FF5A5F] text-white rounded-full text-xs font-medium"
                        >
                          {interest}
                          <button
                            type="button"
                            onClick={() => setSelectedInterests(selectedInterests.filter(i => i !== interest))}
                            className="hover:text-red-200 ml-1"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Interests Grid - Scrollable */}
                  <div className="border border-white/20 rounded-lg p-3 bg-white/5">
                    <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
                        {filteredInterests.map((interest) => {
                          const isSelected = selectedInterests.includes(interest)
                          return (
                            <button
                              key={interest}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedInterests(selectedInterests.filter(i => i !== interest))
                                } else if (selectedInterests.length < 6) {
                                  setSelectedInterests([...selectedInterests, interest])
                                }
                              }}
                              disabled={!isSelected && selectedInterests.length >= 6}
                              className={`text-xs px-2 py-1.5 rounded-md transition-all text-left ${
                                isSelected
                                  ? "bg-gradient-to-r from-[#0B66C3] to-[#FF5A5F] text-white font-medium"
                                  : "bg-white/10 text-white/80 hover:bg-white/20 border border-white/10"
                              } ${
                                !isSelected && selectedInterests.length >= 6
                                  ? "opacity-50 cursor-not-allowed"
                                  : "cursor-pointer"
                              }`}
                            >
                              {interest}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Photos */}
            {step === 4 && (
              <div className="space-y-4">
                <Label>Upload Photos (4 required - first will be your profile picture)</Label>
                
                {/* Photo Upload Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {[0, 1, 2, 3].map((index) => (
                    <div key={index} className="relative">
                      <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-[#0B66C3] transition-colors">
                        {photos[index] ? (
                          <div className="relative w-full h-full">
                            <img
                              src={URL.createObjectURL(photos[index])}
                              alt={`Photo ${index + 1}`}
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newPhotos = [...photos]
                                newPhotos.splice(index, 1)
                                setPhotos(newPhotos)
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                            {index === 0 && (
                              <div className="absolute top-2 left-2 bg-[#0B66C3] text-white text-xs px-2 py-1 rounded">
                                Profile
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center">
                            <Upload className="w-8 h-8 text-white/50 mx-auto mb-2" />
                            <p className="text-sm text-white/70">Click to upload</p>
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const newPhotos = [...photos]
                            newPhotos[index] = file
                            setPhotos(newPhotos)
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
                
                <p className="text-sm text-white/70 text-center">
                  {photos.length}/4 photos uploaded
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm border border-red-200">{error}</div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  className="flex-1"
                >
                  Previous
                </Button>
              )}
              {step < 4 ? (
                <Button
                  type="submit"
                  disabled={!validateStep(step)}
                  className="flex-1 bg-[#e65e6b] hover:bg-[#e65e6b]/90 text-white"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading || !validateStep(step)}
                  className="flex-1 bg-[#e65e6b] hover:bg-[#e65e6b]/90 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create account"
                  )}
                </Button>
              )}
            </div>
          </form>

          {/* Login Link */}
          <p className="text-center text-sm text-white/70 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-purple-600 hover:text-purple-700 font-semibold">
              Sign in
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <p className="text-center text-sm text-white/50 mt-6">
          <Link href="/" className="hover:text-white/70">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}
