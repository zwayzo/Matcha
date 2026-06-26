"use client"

import { useState, useEffect } from "react"
import { motion, useMotionValue, useTransform, type PanInfo, AnimatePresence } from "framer-motion"
import { Briefcase, MapPin, GraduationCap, Sparkles, Heart, X } from "lucide-react"
import Image from "next/image"
import { UserImage } from "./user-image"
import { FameRating } from "./fame-rating"

interface Profile {
  id: number
  name: string
  age: number
  title: string
  company: string
  location: string
  bio: string
  interests: string[]
  education: string
  fameRating?: number
  image?: string
}

interface SwipeCardProps {
  profile: Profile
  onSwipe: (direction: "left" | "right") => void
}

export function SwipeCard({ profile, onSwipe }: SwipeCardProps) {
  const [exitX, setExitX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])
  
  // Enhanced swipe indicators with better opacity curves
  const passOpacity = useTransform(x, [-200, -50, 0], [1, 0.8, 0])
  const likeOpacity = useTransform(x, [0, 50, 200], [0, 0.8, 1])
  const scale = useTransform(x, [-200, 0, 200], [0.95, 1, 0.95])

  const handleDragStart = () => {
    setIsDragging(true)
  }

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false)
    const threshold = 100
    const velocity = Math.abs(info.velocity.x)
    
    if (Math.abs(info.offset.x) > threshold || velocity > 500) {
      setIsExiting(true)
      const direction = info.offset.x > 0 ? "right" : "left"
      setExitX(direction === "right" ? 1000 : -1000)
      
      // Call onSwipe after a short delay for smooth animation
      setTimeout(() => {
        onSwipe(direction)
      }, 100)
    } else {
      // Spring back to center
      x.set(0)
    }
  }

  // Reset on profile change
  useEffect(() => {
    setExitX(0)
    setIsExiting(false)
    x.set(0)
  }, [profile.id, x])

  return (
    <AnimatePresence mode="wait">
      {!isExiting && (
        <motion.div
          key={profile.id}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          style={{ x, rotate, opacity, scale }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ 
            x: exitX, 
            opacity: 0, 
            scale: 0.8,
            transition: { duration: 0.3, ease: "easeInOut" }
          }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            mass: 0.8
          }}
        >
      <motion.div 
        className="h-full bg-white rounded-3xl shadow-2xl overflow-hidden"
        animate={isDragging ? { scale: 0.98 } : { scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {/* Profile Image */}
        <div className="relative h-[65%] bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 overflow-hidden">
          <motion.div
            animate={isDragging ? { scale: 1.05 } : { scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <UserImage src={profile.image || "/avatar.png"} alt={profile.name} fill className="object-cover" />
          </motion.div>
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Quick Info Badge */}
          <motion.div 
            className="absolute top-4 right-4 px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-purple-200 shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-xs font-semibold text-gray-800">Verified</span>
            </div>
          </motion.div>

          {/* Name and Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
            <motion.h2 
              className="text-2xl sm:text-3xl font-bold mb-1 drop-shadow-lg"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {profile.name}, {profile.age}
            </motion.h2>
            <motion.div 
              className="flex items-center gap-2 text-sm opacity-90 mb-1"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 0.9 }}
              transition={{ delay: 0.15 }}
            >
              <Briefcase className="w-4 h-4" />
              <span>
                {profile.title} at {profile.company}
              </span>
            </motion.div>
            <motion.div 
              className="flex items-center gap-2 text-sm opacity-90"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 0.9 }}
              transition={{ delay: 0.2 }}
            >
              <MapPin className="w-4 h-4" />
              <span>{profile.location}</span>
            </motion.div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="h-[35%] p-3 sm:p-6 overflow-y-auto">
          <motion.div 
            className="space-y-3 sm:space-y-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            {/* Bio */}
            <div>
              <p className="text-gray-700 leading-relaxed text-sm">{profile.bio || "No bio available"}</p>
            </div>

            {/* Education & Fame Rating */}
            <div className="flex items-center justify-between">
              {profile.education && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                  <span>{profile.education}</span>
                </div>
              )}
              <FameRating rating={profile.fameRating} size="sm" showLabel={false} />
            </div>

            {/* Interests */}
            {profile.interests && profile.interests.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.interests.slice(0, 6).map((interest, idx) => (
                  <motion.span
                    key={interest}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 text-gray-700 rounded-full text-xs font-medium border border-purple-200"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 + idx * 0.05, type: "spring" }}
                  >
                    {interest}
                  </motion.span>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Enhanced Swipe Indicators */}
      <motion.div
        className="absolute top-16 sm:top-24 left-4 sm:left-8 z-50 pointer-events-none"
        style={{ opacity: passOpacity }}
      >
        <motion.div
          className="px-5 sm:px-8 py-3 sm:py-4 bg-red-500 text-white font-bold text-xl sm:text-2xl rounded-2xl border-4 border-white shadow-2xl rotate-[-20deg]"
          animate={isDragging && x.get() < -50 ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-2">
            <X className="w-6 h-6" />
            <span>PASS</span>
          </div>
        </motion.div>
      </motion.div>
      
      <motion.div
        className="absolute top-16 sm:top-24 right-4 sm:right-8 z-50 pointer-events-none"
        style={{ opacity: likeOpacity }}
      >
        <motion.div
          className="px-5 sm:px-8 py-3 sm:py-4 bg-green-500 text-white font-bold text-xl sm:text-2xl rounded-2xl border-4 border-white shadow-2xl rotate-[20deg]"
          animate={isDragging && x.get() > 50 ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 fill-white" />
            <span>LIKE</span>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  )
}
