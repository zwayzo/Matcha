"use client"

import Link from "next/link"
import { Shield, Sparkles, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { AppHeader } from "@/components/app-header"

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push("/discover")
    }
  }, [loading, isAuthenticated, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#e65e6b] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Main Content */}
      <main className="flex-1">
        {/* Top Navigation */}
        <nav className="absolute top-0 left-0 right-0 z-50 bg-transparent px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Image src="/linder-white.png" alt="Linder" width={120} height={40} />
            </div>
            <Button className="bg-white text-black hover:bg-gray-100 px-6 py-2 rounded-full font-semibold shadow-lg" asChild>
              <Link href="/register">Connect</Link>
            </Button>
          </div>
        </nav>

        {/* Hero Section */}
        <section id="home" className="relative w-full h-screen overflow-hidden bg-[url('/bg1.png')] bg-cover bg-center">
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/70"></div>

          {/* Hero Content */}
          <div className="relative z-10 h-full flex items-center justify-center px-4">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black text-white mb-6 sm:mb-8 text-balance drop-shadow-2xl">
                Start Hiring Matches
              </h1>
              <Button
                size="lg"
                className="bg-[#e65e6b] hover:bg-[#e65e6b]/90 text-white text-base sm:text-xl px-8 sm:px-12 py-3 sm:py-4 shadow-2xl hover:shadow-[#e65e6b]/25 transition-all duration-300 transform hover:scale-105 rounded-full font-bold"
                asChild
              >
                <Link href="/register">Connect</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Ready to Find Your Perfect Match Section */}
        <section className="py-16 sm:py-24 lg:py-32 bg-black relative overflow-hidden">
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-white mb-6 sm:mb-8 text-balance drop-shadow-2xl">
                Ready to find your{" "}
                <span className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
                  perfect match
                </span>
                ?
              </h2>
              <p className="text-base sm:text-lg lg:text-2xl text-white/90 mb-8 sm:mb-12 max-w-3xl mx-auto text-pretty leading-relaxed drop-shadow-lg">
                Join thousands of verified professionals who have found meaningful connections. Your career ambitions and romantic dreams don't have to be separate.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
                <Button size="lg" className="bg-[#e65e6b] hover:bg-[#e65e6b]/90 text-white text-base sm:text-xl px-8 sm:px-12 py-3 sm:py-4 shadow-2xl hover:shadow-[#e65e6b]/25 transition-all duration-300 transform hover:scale-105 rounded-full font-bold w-full sm:w-auto" asChild>
                  <Link href="/register">Get Started Free</Link>
                </Button>
                <Button size="lg" variant="outline" className="border-2 border-white/30 text-black hover:bg-white/10 hover:text-white text-base sm:text-xl px-8 sm:px-12 py-3 sm:py-4 shadow-xl rounded-full font-semibold transition-all duration-300 w-full sm:w-auto" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>




        {/* Footer */}
        <footer className="bg-black text-white py-8 sm:py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8">
              <div>
                <div className="flex items-center mb-4">
                  <Image src="/linder-white.png" alt="Linder" width={120} height={40} />
                </div>
                <p className="text-white/70 text-sm">
                  Where professionals connect and find meaningful relationships.
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-4">Product</h4>
                <div className="space-y-2 text-sm">
                  <Link href="#features" className="block text-white/70 hover:text-white transition-colors">Features</Link>
                  <Link href="#how-it-works" className="block text-white/70 hover:text-white transition-colors">How It Works</Link>
                  <Link href="#testimonials" className="block text-white/70 hover:text-white transition-colors">Testimonials</Link>
                </div>
              </div>
              <div>
                <h4 className="font-bold mb-4">Company</h4>
                <div className="space-y-2 text-sm">
                  <Link href="/about" className="block text-white/70 hover:text-white transition-colors">About</Link>
                  <Link href="/privacy" className="block text-white/70 hover:text-white transition-colors">Privacy</Link>
                  <Link href="/terms" className="block text-white/70 hover:text-white transition-colors">Terms</Link>
                </div>
              </div>
              <div>
                <h4 className="font-bold mb-4">Support</h4>
                <div className="space-y-2 text-sm">
                  <Link href="/help" className="block text-white/70 hover:text-white transition-colors">Help Center</Link>
                  <Link href="/contact" className="block text-white/70 hover:text-white transition-colors">Contact Us</Link>
                  <Link href="/safety" className="block text-white/70 hover:text-white transition-colors">Safety</Link>
                </div>
              </div>
            </div>
            <div className="border-t border-white/20 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-white/70 text-sm">© 2026 Linder. All rights reserved.</p>
              <div className="flex items-center gap-4">
                <Link href="/privacy" className="text-white/70 hover:text-white text-sm transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="text-white/70 hover:text-white text-sm transition-colors">Terms of Service</Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
