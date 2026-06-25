
// hadi hia data model
interface User {
  // Authentication
  id: string
  email: string
  username: string
  password: string // hashed
  emailVerified: boolean
  verificationToken?: string

  // Personal Info
  firstName: string
  lastName: string
  name: string // computed: firstName + lastName
  age: number
  gender: "male" | "female" | "non-binary" | "other" | ""
  sexualPreference: "men" | "women" | "everyone" | ""

  // Professional Info
  title: string
  company: string
  industry: string
  experienceLevel: string
  education: string

  // Profile Content
  bio: string
  interests: string[]
  profileImage: string
  photos: string[]

  // Location
  location: string

  // Status
  verified: boolean
  onlineStatus: "online" | "offline"
  lastSeen: string

  // Social
  blocked: string[]
  reported: string[]
}


// API LI KHAS 
* Authentication
POST /api/auth/register - User registration
POST /api/auth/login - User login
POST /api/auth/logout - User logout
GET /api/auth/me - Get current user
POST /api/auth/verify-email - Email verification
POST /api/auth/forgot-password - Password reset request
POST /api/auth/reset-password - Password reset

* User Management
GET /api/users/:id - Get user profile
PUT /api/users/profile - Update user profile
POST /api/users/:id/block - Block user
POST /api/users/:id/report - Report user

* Matching & Discovery
GET /api/discover - Get potential matches (with filters)
POST /api/swipe - Record swipe action
GET /api/matches - Get user matches
GET /api/search - Advanced search

* Messaging
GET /api/conversations - Get user conversations
POST /api/messages - Send message
GET /api/messages/:conversationId - Get messages

// REGISTRATION DATA STRUCT 

interface RegisterData {
  email: string
  username: string
  firstName: string
  lastName: string
  password: string
  age: number
  gender: "male" | "female" | "non-binary" | "other" | ""
  sexualPreference: "men" | "women" | "everyone" | ""
  bio: string
  interests: string[]
  education: string
  industry: string
  experienceLevel: string
  photos: string[]
}

