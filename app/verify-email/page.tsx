"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Flame, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import Image from "next/image"

function VerifyEmailContent() {
  const [verifying, setVerifying] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [hasAttempted, setHasAttempted] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { verifyEmail } = useAuth()

  useEffect(() => {
    // Prevent multiple verification attempts
    if (hasAttempted) return
    
    const token = searchParams.get("token")
    if (!token) {
      setError("No verification token provided")
      setVerifying(false)
      return
    }

    setHasAttempted(true)

    const verify = async () => {
      try {
        const result = await verifyEmail(token)
        if (result.success) {
          setSuccess(true)
        } else {
          setError(result.error || "Verification failed")
        }
      } catch (error) {
        setError("Network error occurred")
      } finally {
        setVerifying(false)
      }
    }

    verify()
  }, [searchParams, verifyEmail, hasAttempted])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center mb-4">
            <Image src="/linder-white.png" alt="Linder" width={120} height={40} />
          </Link>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-xl p-6 sm:p-8 border border-white/20 text-center">
          {verifying ? (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-[#e65e6b] mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Verifying your email...</h1>
              <p className="text-white/70">Please wait a moment</p>
            </>
          ) : success ? (
            <>
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Email verified!</h1>
              <p className="text-white/70 mb-6">Your account has been successfully verified. You can now log in.</p>
              <Button
                onClick={() => router.push("/login")}
                className="w-full bg-[#e65e6b] hover:bg-[#e65e6b]/90 text-white"
              >
                Go to Login
              </Button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Verification failed</h1>
              <p className="text-white/70 mb-6">{error}</p>
              <Button onClick={() => router.push("/register")} variant="outline" className="w-full">
                Back to Register
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  )
}
