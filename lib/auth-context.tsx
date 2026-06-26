"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001'

export interface User {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  name: string // Full name for display
  age: number
  gender: "male" | "female" | "non-binary" | "other" | ""
  sexualPreference: "men" | "women" | "everyone" | ""
  title: string
  company: string
  location: string
  bio: string
  interests: string[]
  education: string
  industry: string
  experienceLevel: string
  profileImage: string
  photos: string[] // Up to 5 photos
  verified: boolean
  onlineStatus: "online" | "offline"
  lastSeen: string
  fameRating? : number // 0-100 fame score
  blocked: string[] // Array of blocked user IDs
  reported: string[] // Array of reported user IDs
  emailVerified: boolean
  verificationToken?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isProfileComplete: boolean
  token: string | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string; needsVerification?: boolean; message?: string; email?: string }>
  logout: () => void
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean }>
  verifyEmail: (token: string) => Promise<{ success: boolean; error?: string }>
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
  retryAuth: () => Promise<void>
  loading: boolean
}

interface RegisterData {
  email: string
  username: string
  firstName: string
  lastName: string
  password: string
  age: number
  gender: "male" | "female" | "non-binary" | "other" | ""
  sexualPreference: "men" | "women" | "everyone" | ""
  title: string
  company: string
  location: string
  bio: string
  interests: string[]
  education: string
  industry: string
  experienceLevel: string
  photos: string[] // Array of data URLs for 4 photos
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const COMMON_PASSWORDS = [
  "password",
  "admin",
  "welcome",
  "hello",
  "goodbye",
  "please",
  "thanks",
  "love",
  "hate",
  "happy",
  "sad",
  "good",
  "bad",
  "yes",
  "no",
  "maybe",
  "always",
  "never",
  "something",
  "nothing",
  "everything",
]

// Helper function to create a lightweight user object without large base64 images
function createLightweightUser(user: User): User {
  return {
    ...user,
    photos: user.photos.map(photo => 
      photo && photo.startsWith('data:') ? '/avatar.png' : photo
    ).filter(Boolean),
    profileImage: user.profileImage && user.profileImage.startsWith('data:') ? '/avatar.png' : user.profileImage
  }
}

// Helper function to safely store user in localStorage
function safeStoreUser(user: User) {
  try {
    const lightweightUser = createLightweightUser(user)
    localStorage.setItem("linder_user", JSON.stringify(lightweightUser))
  } catch (storageError: any) {
    // If still too large, store only essential data
    if (storageError.name === 'QuotaExceededError') {
      console.warn("User data too large for localStorage, storing minimal data only")
      const minimalUser: Partial<User> = {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        age: user.age,
        gender: user.gender,
        sexualPreference: user.sexualPreference,
        location: user.location,
        bio: user.bio,
        interests: user.interests,
        emailVerified: user.emailVerified,
        fameRating: user.fameRating || 50,
        photos: ['/avatar.png'],
        profileImage: '/avatar.png',
        verified: user.verified,
        onlineStatus: user.onlineStatus,
        lastSeen: user.lastSeen,
        blocked: user.blocked || [],
        reported: user.reported || [],
        title: user.title || '',
        company: user.company || '',
        education: user.education || '',
        industry: user.industry || '',
        experienceLevel: user.experienceLevel || ''
      }
      try {
        localStorage.setItem("linder_user", JSON.stringify(minimalUser))
      } catch (finalError) {
        console.error("Failed to store even minimal user data:", finalError)
        // Clear old data and try once more
        localStorage.removeItem("linder_user")
        try {
          localStorage.setItem("linder_user", JSON.stringify({
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name
          }))
        } catch (e) {
          console.error("Final attempt to store user failed:", e)
        }
      }
    } else {
      throw storageError
    }
  }
}

// Helper function to transform backend user data to frontend User format
function transformBackendUser(userData: any): User {
  return {
    id: userData.user.id.toString(),
    email: userData.user.email,
    username: userData.user.username,
    firstName: userData.user.first_name,
    lastName: userData.user.last_name,
    name: `${userData.user.first_name} ${userData.user.last_name}`,
    age: userData.user.age,
    gender: userData.user.sex || "",
    sexualPreference: userData.user.sexualPreference || "",
    title: userData.profile.title || "",
    company: userData.profile.company || "",
    location: userData.profile.location || "",
    bio: userData.profile.bio || "",
    interests: userData.profile.interests || [],
    education: userData.profile.education || "",
    industry: userData.profile.industry || "",
    experienceLevel: userData.profile.experienceLevel || "",
    profileImage: userData.profile.image1 || "/avatar.png",
    photos: [
      userData.profile.image1,
      userData.profile.image2,
      userData.profile.image3,
      userData.profile.image4
    ].filter(Boolean),
    verified: userData.profile.verified || false,
    fameRating: userData.profile.fame_rating || 0,
    onlineStatus: userData.profile.online ? "online" : "offline" as const,
    lastSeen: new Date().toISOString(),
    blocked: [],
    reported: [],
    emailVerified: userData.user.emailVerified || false,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const retryAuth = async () => {
    console.log('🔄 Retrying authentication...')
    setLoading(true)
    setTimeout(() => {
      validateAuth()
    }, 1000) // Wait 1 second before retrying
  }

  // Check if user is logged in and validate token
  const validateAuth = async () => {
    try {
      const storedUser = localStorage.getItem("linder_user")
      const storedToken = localStorage.getItem("auth_token")

      if (!storedToken) {
        setUser(null)
        return
      }

      // If we have stored user data, restore immediately so the UI isn't blocked
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          userData.onlineStatus = "online"
          userData.lastSeen = new Date().toISOString()
          setUser(userData)
          if (userData.id) localStorage.setItem("user_id", String(userData.id))
        } catch {
          // Corrupted stored user - will re-fetch below
        }
      }

      // Validate token with backend (silently — never crash the app)
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${storedToken}` },
          signal: controller.signal,
        })
        clearTimeout(timeoutId)

        if (response.ok) {
          const userData = await response.json()
          const transformedUser = transformBackendUser(userData)
          transformedUser.onlineStatus = "online"
          transformedUser.lastSeen = new Date().toISOString()
          setUser(transformedUser)
          safeStoreUser(transformedUser)
          localStorage.setItem('user_id', transformedUser.id)
        } else if (response.status === 401) {
          // Token actually invalid — log out
          localStorage.removeItem("linder_user")
          localStorage.removeItem("auth_token")
          localStorage.removeItem("user_id")
          localStorage.removeItem("user_profile")
          setUser(null)
        }
        // Any other status (5xx, etc.) — keep current user state
      } catch {
        // Network error or timeout — backend is down or unreachable.
        // Keep user logged in with stored data; don't crash.
        console.warn('Backend unreachable during auth check — using cached session')
      }
    } catch (error) {
      console.error('Unexpected error in validateAuth:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('🔍 Starting auth validation useEffect...')
    
    // Ensure we're on the client side
    if (typeof window === 'undefined') {
      console.log('⚠️  Not on client side, skipping auth validation')
      setLoading(false)
      return
    }
    
    // validateAuth never throws — errors are handled internally
    validateAuth()
  }, [])

  const logout = () => {
    // Update user status to offline before logout
    if (user) {
      const offlineUser = { ...user, onlineStatus: "offline" as const, lastSeen: new Date().toISOString() }
      const userKey = `linder_user_${user.username}`
      const storedData = localStorage.getItem(userKey)
      if (storedData) {
        const userData = JSON.parse(storedData)
        localStorage.setItem(userKey, JSON.stringify({ ...userData, ...offlineUser }))
      }
    }
    
    // Clear all auth data
    localStorage.removeItem("linder_user")
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_id")
    localStorage.removeItem("user_profile")
    setUser(null)
    router.push("/login")
  }

  useEffect(() => {
    return () => {
      if (user) {
        try {
          const updatedUser = { ...user, onlineStatus: "offline" as const, lastSeen: new Date().toISOString() }
          localStorage.setItem("linder_user", JSON.stringify(updatedUser))
          const userKey = `linder_user_${user.username}`
          const storedData = localStorage.getItem(userKey)
          if (storedData) {
            const userData = JSON.parse(storedData)
            localStorage.setItem(userKey, JSON.stringify({ ...userData, ...updatedUser }))
          }
        } catch {
          // localStorage may be full or cleared during logout — safe to ignore
        }
      }
    }
  }, [user])

  const isValidPassword = (password: string): boolean => {
    if (password.length < 8) return false
    const lowerPassword = password.toLowerCase()
    return !COMMON_PASSWORDS.some((word) => lowerPassword.includes(word))
  }

  const checkProfileComplete = (user: User | null): boolean => {
    if (!user) return false
    
    // Check required fields for a complete profile
    const requiredFields = [
      user.age > 0,
      user.gender,
      user.sexualPreference,
      user.bio && user.bio.trim().length > 0,
      user.location && user.location.trim().length > 0,
      user.interests && user.interests.length > 0,
      user.photos && user.photos.length >= 1
    ]
    
    return requiredFields.every(field => field)
  }

  const isProfileComplete = checkProfileComplete(user)

  const login = async (email: string, password: string) => {
    try {
      const url = `${API_BASE_URL}/api/auth/login`
      console.log('Login URL:', url)
      console.log('API_BASE_URL:', API_BASE_URL)
      console.log('Attempting login for:', email)
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      console.log('Login response status:', response.status)
      console.log('Login response ok:', response.ok)

      const result = await response.json();
      console.log('Login response data:', result)

      if (response.ok) {
        // Store token and user_id
        localStorage.setItem('auth_token', result.token);
        if (result.user_id) {
          localStorage.setItem('user_id', String(result.user_id));
        }
        // Fetch full user data
        try {
          const userResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${result.token}`,
            },
          });
          if (userResponse.ok) {
            const userData = await userResponse.json();
            const transformedUser = transformBackendUser(userData);
            setUser(transformedUser);
            safeStoreUser(transformedUser);
            localStorage.setItem('user_id', transformedUser.id);
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
        }
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login fetch error:', error);
      console.error('Error details:', error.message || error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  const register = async (data: RegisterData) => {
    try {
      const url = `${API_BASE_URL}/api/auth/sign-up`
      console.log('Registering user at:', url)
      console.log('API_BASE_URL:', API_BASE_URL)
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          username: data.username,
          password: data.password,
          first_name: data.firstName,
          last_name: data.lastName,
          age: data.age,
          sex: data.gender,
          sexualPreference: data.sexualPreference,
          title: data.title,
          company: data.company,
          location: data.location,
          bio: data.bio,
          interests: data.interests,
          education: data.education,
          experienceLevel: data.experienceLevel,
          industry: data.industry,
          image1: data.photos[0],
          image2: data.photos[1],
          image3: data.photos[2],
          image4: data.photos[3],
        }),
      });

      if (!response.ok) {
        const errorResult = await response.json();
        console.error('Registration error details:', errorResult);
        return { success: false, error: errorResult.error || 'Registration failed' };

      }

       const result = await response.json();

      if (response.ok) {
        // Registration successful, but user needs to verify email
        // DO NOT store token or log user in yet
        return { 
          success: true, 
          needsVerification: true, 
          message: result.message,
          email: result.email 
        };
      } else {
        return { success: false, error: result.error || 'Registration failed' };
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      console.error('Error details:', {
        message: error?.message,
        name: error?.name,
        stack: error?.stack
      });
      
      // Check if it's a network error
      if (error?.message?.includes('Failed to fetch') || error?.name === 'TypeError') {
        return { 
          success: false, 
          error: `Cannot connect to backend server at ${API_BASE_URL}. Make sure the backend is running on port 5001.` 
        };
      }
      // Fallback: Store user in localStorage when backend is unavailable
      try {
        const userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`
        const userData = {
          id: userId,
          email: data.email,
          username: data.username,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          name: `${data.firstName} ${data.lastName}`,
          age: data.age,
          gender: data.gender,
          sexualPreference: data.sexualPreference,
          title: data.title || "",
          company: data.company || "",
          location: data.location || "",
          bio: data.bio,
          interests: data.interests,
          education: data.education,
          industry: data.industry,
          experienceLevel: data.experienceLevel,
          profileImage: data.photos[0] || "/avatar.png",
          photos: data.photos,
          verified: false,
          onlineStatus: "online" as const,
          lastSeen: new Date().toISOString(),
          blocked: [],
          reported: [],
          emailVerified: false,
          verificationToken: `verify_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        }

        // Store in the format expected by api-service: linder_user_${username}
        localStorage.setItem(`linder_user_${data.username}`, JSON.stringify(userData))
        
        // Also store in the format expected by auth context (without password)
        const { password: _, ...userWithoutPassword } = userData
        localStorage.setItem("linder_user", JSON.stringify(userWithoutPassword))

        return { success: true, needsVerification: true };
      } catch (storageError) {
        console.error('LocalStorage error:', storageError);
        return { success: false, error: 'Failed to store user data. Please try again.' };
      }
    }
  }

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/confirm-email?token=${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return { success: true };
      } else {
        let errorMessage = "Email verification failed"
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch (parseError) {
          // If JSON parsing fails, try to get text
          try {
            const errorText = await response.text()
            errorMessage = errorText || errorMessage
          } catch (textError) {
            // Keep default error message
          }
        }
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('Email verification error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  const requestPasswordReset = async (username: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to send reset email' }
      }

      return { success: true }
    } catch (error) {
      console.error('Password reset request error:', error)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to reset password' }
      }

      return { success: true }
    } catch (error) {
      console.error('Password reset error:', error)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return { success: false }

    await new Promise((resolve) => setTimeout(resolve, 500))

    const updatedUser = { ...user, ...data }
    setUser(updatedUser)
    localStorage.setItem("linder_user", JSON.stringify(updatedUser))

    // Also update in the user-specific storage
    const storedUserWithPassword = localStorage.getItem(`linder_user_${user.username}`)
    if (storedUserWithPassword) {
      const userData = JSON.parse(storedUserWithPassword)
      localStorage.setItem(`linder_user_${user.username}`, JSON.stringify({ ...userData, ...data }))
    }

    return { success: true }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user, // Just check if user exists, token was already validated
        isProfileComplete,
        token: typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null,
        login,
        register,
        logout,
        updateProfile,
        verifyEmail,
        requestPasswordReset,
        resetPassword,
        retryAuth,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
