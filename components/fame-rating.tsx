"use client"

import { Sparkles } from "lucide-react"

interface FameRatingProps {
  rating: number
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
}

export function FameRating({ rating, size = "md", showLabel = true }: FameRatingProps) {
  // Calculate fame level based on rating (0-100)
  const getFameLevel = (rating: number) => {
    if (rating >= 90) return { level: "Celebrity", color: "text-purple-400", bgColor: "bg-purple-500/20" }
    if (rating >= 75) return { level: "Famous", color: "text-yellow-400", bgColor: "bg-yellow-500/20" }
    if (rating >= 50) return { level: "Popular", color: "text-blue-400", bgColor: "bg-blue-500/20" }
    if (rating >= 25) return { level: "Known", color: "text-green-400", bgColor: "bg-green-500/20" }
    return { level: "New", color: "text-gray-400", bgColor: "bg-gray-500/20" }
  }

  const fame = getFameLevel(rating)
  
  // Size classes
  const sizeClasses = {
    sm: {
      container: "text-xs",
      icon: "w-3 h-3",
      badge: "px-1.5 py-0.5 text-xs"
    },
    md: {
      container: "text-sm",
      icon: "w-4 h-4",
      badge: "px-2 py-1 text-sm"
    },
    lg: {
      container: "text-base",
      icon: "w-5 h-5",
      badge: "px-3 py-1.5 text-base"
    }
  }

  const classes = sizeClasses[size]

  return (
    <div className={`flex items-center gap-1.5 ${classes.container}`}>
      {/* Fame Stars */}
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => {
          const starValue = (i + 1) * 20
          return (
            <Sparkles
              key={i}
              className={`${classes.icon} ${
                rating >= starValue ? fame.color : "text-white/20"
              }`}
              fill={rating >= starValue ? "currentColor" : "none"}
            />
          )
        })}
      </div>
      
      {/* Fame Score */}
      <span className={`font-medium ${fame.color}`}>
        {rating}
      </span>
      
      {/* Fame Level Badge */}
      {showLabel && (
        <span className={`${classes.badge} ${fame.bgColor} ${fame.color} rounded-full font-medium border border-white/10`}>
          {fame.level}
        </span>
      )}
    </div>
  )
}

// Helper function to calculate fame rating based on user activity
export function calculateFameRating(user: {
  profileViews?: number
  likes?: number
  matches?: number
  profileComplete?: boolean
  verified?: boolean
  photos?: string[]
  bio?: string
  interests?: string[]
}): number {
  let score = 0
  
  // Base score for having a complete profile
  if (user.profileComplete) score += 20
  
  // Profile completeness bonuses
  if (user.photos && user.photos.length >= 3) score += 10
  if (user.bio && user.bio.length > 50) score += 5
  if (user.interests && user.interests.length >= 3) score += 5
  if (user.verified) score += 10
  
  // Activity bonuses
  const views = user.profileViews || 0
  const likes = user.likes || 0
  const matches = user.matches || 0
  
  // View score (max 20 points)
  score += Math.min(views * 0.2, 20)
  
  // Like score (max 25 points)
  score += Math.min(likes * 0.5, 25)
  
  // Match score (max 30 points)
  score += Math.min(matches * 2, 30)
  
  // Cap at 100
  return Math.min(Math.round(score), 100)
}