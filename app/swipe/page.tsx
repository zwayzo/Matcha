"use client"

import { useState } from "react"
import Link from "next/link"
import { Flame, X, Heart, Info, ArrowLeft, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SwipeCard } from "@/components/swipe-card"
import { MatchModal } from "@/components/match-modal"
import Image from "next/image"
import { AppHeader } from "@/components/app-header"
// Mock profile data
const profiles = [
  {
    id: 1,
    name: "Sarah Chen",
    age: 28,
    title: "Product Manager",
    company: "Google",
    location: "San Francisco, CA",
    bio: "Building products that millions love. Passionate about AI, sustainability, and finding the best coffee spots.",
    interests: ["AI/ML", "Hiking", "Coffee", "Travel"],
    education: "Stanford MBA",
  },
  {
    id: 2,
    name: "Marcus Johnson",
    age: 32,
    title: "Senior Software Engineer",
    company: "Meta",
    location: "New York, NY",
    bio: "Full-stack developer by day, jazz pianist by night. Always up for trying new restaurants and exploring the city.",
    interests: ["Music", "Food", "Tech", "Basketball"],
    education: "MIT Computer Science",
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    age: 30,
    title: "Investment Banker",
    company: "Goldman Sachs",
    location: "New York, NY",
    bio: "Finance professional with a love for adventure. Weekends are for skiing, scuba diving, or planning my next trip.",
    interests: ["Travel", "Skiing", "Wine", "Finance"],
    education: "Wharton Business School",
  },
  {
    id: 4,
    name: "David Kim",
    age: 29,
    title: "Data Scientist",
    company: "Amazon",
    location: "Seattle, WA",
    bio: "Turning data into insights. Love board games, cooking experiments, and long discussions about everything.",
    interests: ["Data", "Cooking", "Board Games", "Philosophy"],
    education: "UC Berkeley PhD",
  },
  {
    id: 5,
    name: "Jessica Taylor",
    age: 27,
    title: "UX Designer",
    company: "Apple",
    location: "San Francisco, CA",
    bio: "Designing delightful experiences. Also into yoga, photography, and finding the best matcha in the city.",
    interests: ["Design", "Yoga", "Photography", "Wellness"],
    education: "RISD Design",
  },
]

export default function SwipePage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showMatch, setShowMatch] = useState(false)
  const [matchedProfile, setMatchedProfile] = useState<(typeof profiles)[0] | null>(null)

  const currentProfile = profiles[currentIndex]

  const handleSwipe = (direction: "left" | "right") => {
    if (direction === "right" && currentProfile) {
      // Simulate match (50% chance for demo)
      if (Math.random() > 0.5) {
        setMatchedProfile(currentProfile)
        setShowMatch(true)
      }
    }

    // Move to next profile after a short delay
    setTimeout(() => {
      if (currentIndex < profiles.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        setCurrentIndex(0) // Loop back to start for demo
      }
    }, 300)
  }

  const handlePass = () => handleSwipe("left")
  const handleLike = () => handleSwipe("right")

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-0">
      {/* Header */}
      <header className="border-b border-white/20 bg-black/80 backdrop-blur-lg sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="w-10" />
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-md">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
           
            <span className="text-sm font-medium text-white">
              {profiles.length - currentIndex} profiles remaining
            </span>
          </div>
        </div>

        {/* Card Stack */}
        <div className="relative h-[calc(100vh-320px)] sm:h-[500px] md:h-[600px] mb-6 sm:mb-8">
          {currentProfile && <SwipeCard profile={currentProfile} onSwipe={handleSwipe} />}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4 sm:gap-6">
          <Button
            size="lg"
            variant="outline"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-red-300 hover:bg-red-50 hover:border-red-400 transition-all bg-transparent"
            onClick={handlePass}
          >
            <X className="w-7 h-7 sm:w-8 sm:h-8 text-red-500" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-400 transition-all bg-transparent"
          >
            <Info className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
          </Button>
          <Button
            size="lg"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#FF5A5F] to-pink-600 hover:opacity-90 transition-all shadow-lg"
            onClick={handleLike}
          >
            <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-white fill-white" />
          </Button>
        </div>

        {/* Demo Notice */}
        <p className="text-center text-sm text-white/50 mt-8">
          This is a demo with sample profiles. Swipe right for a chance to see a match!
        </p>
      </div>

      {/* Match Modal */}
      {showMatch && matchedProfile && <MatchModal profile={matchedProfile} onClose={() => setShowMatch(false)} />}
    </div>
  )
}
