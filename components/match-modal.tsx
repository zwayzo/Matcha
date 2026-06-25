"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Heart, MessageCircle, X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

interface MatchModalProps {
  profile: {
    id: number
    name: string
    age: number
    title: string
    company: string
    location: string
    bio: string
    interests: string[]
    education: string
    image?: string
  }
  conversationId?: string
  onClose: () => void
}

export function MatchModal({ profile, conversationId, onClose }: MatchModalProps) {
  const router = useRouter()
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    // Delay content animation for dramatic effect
    const timer = setTimeout(() => setShowContent(true), 300)
    return () => clearTimeout(timer)
  }, [])

  const handleSendMessage = () => {
    // Use conversationId if available, otherwise fall back to profile.id
    const chatParam = conversationId ? `conversationId=${conversationId}` : `matchId=${profile.id}`
    router.push(`/chat?${chatParam}`)
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-md mx-4"
          initial={{ scale: 0.5, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 25,
            duration: 0.5 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gradient-to-br from-[#FF5A5F] via-pink-500 to-purple-600 rounded-3xl p-8 text-center relative overflow-hidden shadow-2xl">
            {/* Close Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </Button>
            </motion.div>

            {/* Enhanced Animated Hearts */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  initial={{ 
                    y: "120%", 
                    x: `${(Math.random() - 0.5) * 200}%`, 
                    opacity: 0,
                    rotate: Math.random() * 360
                  }}
                  animate={{
                    y: "-30%",
                    x: `${(Math.random() - 0.5) * 100}%`,
                    opacity: [0, 1, 0.8, 0],
                    rotate: [0, Math.random() * 180 - 90],
                  }}
                  transition={{
                    duration: 4,
                    delay: i * 0.2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeOut",
                  }}
                >
                  <Heart className="w-8 h-8 text-white fill-white drop-shadow-lg" />
                </motion.div>
              ))}
            </div>

            {/* Sparkle Effects */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                    rotate: 360,
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.3,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatDelay: 1,
                  }}
                >
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                </motion.div>
              ))}
            </div>

          {/* Content */}
          <AnimatePresence>
            {showContent && (
              <motion.div 
                className="relative z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                {/* Heart Icon with Pulse Animation */}
                <motion.div
                  className="mb-6"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                >
                  <motion.div
                    className="w-24 h-24 mx-auto bg-white rounded-full flex items-center justify-center shadow-2xl"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      boxShadow: [
                        "0 0 0 0 rgba(255, 90, 95, 0.7)",
                        "0 0 0 20px rgba(255, 90, 95, 0)",
                        "0 0 0 0 rgba(255, 90, 95, 0)"
                      ]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatDelay: 1
                    }}
                  >
                    <Heart className="w-12 h-12 text-pink-500 fill-pink-500" />
                  </motion.div>
                </motion.div>

                <motion.h2 
                  className="text-5xl font-bold text-white mb-3 drop-shadow-lg"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                >
                  It's a Match! 🎉
                </motion.h2>
                <motion.p 
                  className="text-white/95 mb-8 text-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  You and <span className="font-bold">{profile.name}</span> have liked each other
                </motion.p>

                {/* Enhanced Profile Preview */}
                <motion.div 
                  className="bg-white/25 backdrop-blur-md rounded-2xl p-5 mb-6 border border-white/30 shadow-xl"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.7, type: "spring" }}
                >
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className="relative w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-200 to-purple-200 ring-4 ring-white/50"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8, type: "spring" }}
                    >
                      <Image
                        src={profile.image || "/avatar.png"}
                        alt={profile.name}
                        fill
                        className="object-cover"
                      />
                    </motion.div>
                    <div className="text-left flex-1">
                      <h3 className="text-2xl font-bold text-white mb-1">
                        {profile.name}, {profile.age}
                      </h3>
                      <p className="text-white/90 text-sm mb-1">{profile.title}</p>
                      <p className="text-white/80 text-sm">{profile.company}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Enhanced Action Buttons */}
                <motion.div 
                  className="flex gap-3"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.9 }}
                >
                  <Button
                    variant="outline"
                    className="flex-1 bg-white/20 backdrop-blur-sm border-2 border-white text-white hover:bg-white/30 font-semibold h-12 transition-all"
                    onClick={onClose}
                  >
                    Keep Swiping
                  </Button>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1"
                  >
                    <Button 
                      className="w-full bg-white text-purple-600 hover:bg-gray-100 font-semibold h-12 shadow-lg transition-all" 
                      onClick={handleSendMessage}
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Send Message
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
    </AnimatePresence>
  )
}
