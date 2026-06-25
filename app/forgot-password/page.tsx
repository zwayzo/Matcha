"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Flame, Mail, Loader2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import Image from "next/image"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { requestPasswordReset } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const result = await requestPasswordReset(email)

    if (result.success) {
      setSuccess(true)
    } else {
      setError(result.error || "Failed to send reset email")
    }
    setLoading(false)
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

          <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-xl p-6 sm:p-8 border border-white/20 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Password Reset Requested</h1>
            <p className="text-white/70 mb-6">
              Check your email <strong className="text-white">{email}</strong> for the reset link.
            </p>
            <Button asChild className="w-full bg-[#e65e6b] hover:bg-[#e65e6b]/90 text-white">
              <Link href="/login">Back to Login</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center mb-4">
            <Image src="/linder-white.png" alt="Linder" width={120} height={40} />
          </Link>
          <p className="text-white/70">Where professionals connect.</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-xl p-6 sm:p-8 border border-white/20">
          <h1 className="text-2xl font-bold text-white mb-2">Forgot your password?</h1>
          <p className="text-white/70 mb-6">Enter your email and we'll send you a reset link</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 text-red-400 px-4 py-3 rounded-lg text-sm border border-red-500/20">{error}</div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#e65e6b] hover:bg-[#e65e6b]/90 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-white/70 mt-6">
            <Link href="/login" className="text-[#e65e6b] hover:text-[#e65e6b]/80 font-semibold">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
