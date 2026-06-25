import type { User } from "./auth-context"

export interface Match {
  id: string
  userId: string
  matchedUserId: string
  matchedAt: string
  user: User
  conversationId?: string
}

export interface Message {
  id: string
  matchId: string
  senderId: string
  receiverId: string
  content: string
  sentAt: string
  read: boolean
}

export interface SwipeAction {
  userId: string
  targetUserId: string
  action: "like" | "pass"
  timestamp: string
}

export interface ProfileView {
  id: string
  viewerId: string
  viewedUserId: string
  viewedAt: string
  viewer: User
}

export interface Notification {
  id: string
  userId: string
  type: "like" | "view" | "message" | "match" | "unlike"
  fromUserId: string
  fromUser?: User
  content: string
  read: boolean
  createdAt: string
}

class ApiService {
  private getStorageKey(userId: string, type: string) {
    return `linder_${userId}_${type}`
  }

  private getAllUsers(): User[] {
    const allKeys = Object.keys(localStorage)
    const users: User[] = []

    for (const key of allKeys) {
      if (key.startsWith("linder_user_") && !key.includes("@")) {
        const userData = JSON.parse(localStorage.getItem(key) || "{}")
        // Remove password from user object
        const { password, ...userWithoutPassword } = userData
        users.push(userWithoutPassword)
      }
    }

    return users
  }

  getUserById(userId: string): User | null {
    const users = this.getAllUsers()
    return users.find((u) => u.id === userId) || null
  }

  // Profile Discovery
  async getDiscoverProfiles(userId: string, filters?: any): Promise<User[]> {
    await new Promise((resolve) => setTimeout(resolve, 500))

    const currentUser = this.getUserById(userId)
    if (!currentUser) return []

    // Get all users
    let profiles = this.getAllUsers()

    // Filter out current user, blocked users, and users who blocked current user
    profiles = profiles.filter((p) => {
      if (p.id === userId) return false
      if (currentUser.blocked.includes(p.id)) return false
      if (p.blocked.includes(userId)) return false
      return true
    })

    // Get user's previous swipes
    const swipes = this.getUserSwipes(userId)
    const swipedIds = swipes.map((s) => s.targetUserId)

    // Filter out already swiped profiles
    profiles = profiles.filter((p) => !swipedIds.includes(p.id))

    if (currentUser.sexualPreference) {
      profiles = profiles.filter((p) => {
        if (currentUser.sexualPreference === "everyone") return true
        if (currentUser.sexualPreference === "men" && p.gender === "male") return true
        if (currentUser.sexualPreference === "women" && p.gender === "female") return true
        return false
      })

      // Also filter to show current user only to people who match their gender preference
      profiles = profiles.filter((p) => {
        if (!p.sexualPreference || p.sexualPreference === "everyone") return true
        if (p.sexualPreference === "men" && currentUser.gender === "male") return true
        if (p.sexualPreference === "women" && currentUser.gender === "female") return true
        return false
      })
    }

    // Apply additional filters
    if (filters) {
      if (filters.ageMin || filters.ageMax) {
        profiles = profiles.filter((p) => p.age >= (filters.ageMin || 0) && p.age <= (filters.ageMax || 100))
      }
      if (filters.location && filters.location !== "") {
        profiles = profiles.filter((p) => p.location.toLowerCase().includes(filters.location.toLowerCase()))
      }
      if (filters.industry && filters.industry !== "Any industry") {
        profiles = profiles.filter((p) => p.industry === filters.industry)
      }
      // Fame rating filter removed - property not in User interface
      // if (filters.fameMin !== undefined || filters.fameMax !== undefined) {
      //   profiles = profiles.filter(
      //     (p) => p.fameRating >= (filters.fameMin || 0) && p.fameRating <= (filters.fameMax || 100),
      //   )
      // }
      if (filters.interests && filters.interests.length > 0) {
        profiles = profiles.filter((p) => filters.interests.some((interest: string) => p.interests.includes(interest)))
      }
    }

    profiles.sort((a, b) => {
      // Calculate shared interests
      const sharedInterestsA = a.interests.filter((i) => currentUser.interests.includes(i)).length
      const sharedInterestsB = b.interests.filter((i) => currentUser.interests.includes(i)).length

      // Calculate location proximity (simple check if same city)
      const sameLocationA = a.location.split(",")[0] === currentUser.location.split(",")[0] ? 1 : 0
      const sameLocationB = b.location.split(",")[0] === currentUser.location.split(",")[0] ? 1 : 0

      // Weighted score: location (50%), shared interests (50%)
      // Fame rating removed - property not in User interface
      const scoreA = sameLocationA * 50 + sharedInterestsA * 50
      const scoreB = sameLocationB * 50 + sharedInterestsB * 50

      return scoreB - scoreA
    })

    return profiles
  }

  // Swipe Actions
  async swipeProfile(
    userId: string,
    targetUserId: string,
    action: "like" | "pass",
  ): Promise<{ match: boolean; matchData?: Match }> {
    await new Promise((resolve) => setTimeout(resolve, 300))

    const swipe: SwipeAction = {
      userId,
      targetUserId,
      action,
      timestamp: new Date().toISOString(),
    }

    // Store swipe
    const swipes = this.getUserSwipes(userId)
    swipes.push(swipe)
    localStorage.setItem(this.getStorageKey(userId, "swipes"), JSON.stringify(swipes))

    // Check for mutual match if action is "like"
    if (action === "like") {
      await this.createNotification(targetUserId, {
        type: "like",
        fromUserId: userId,
        content: "liked your profile",
      })

      const targetSwipes = this.getUserSwipes(targetUserId)
      const mutualLike = targetSwipes.find((s) => s.targetUserId === userId && s.action === "like")

      if (mutualLike) {
        // Create match
        const targetUser = this.getUserById(targetUserId)
        if (targetUser) {
          const match = this.createMatch(userId, targetUserId, targetUser)

          await this.createNotification(userId, {
            type: "match",
            fromUserId: targetUserId,
            content: "matched with you",
          })
          await this.createNotification(targetUserId, {
            type: "match",
            fromUserId: userId,
            content: "matched with you",
          })

          return { match: true, matchData: match }
        }
      }
    }

    return { match: false }
  }

  private getUserSwipes(userId: string): SwipeAction[] {
    const stored = localStorage.getItem(this.getStorageKey(userId, "swipes"))
    return stored ? JSON.parse(stored) : []
  }

  private createMatch(userId: string, matchedUserId: string, matchedUser: User): Match {
    const match: Match = {
      id: `match_${Date.now()}`,
      userId,
      matchedUserId,
      matchedAt: new Date().toISOString(),
      user: matchedUser,
    }

    // Store for both users
    const userMatches = this.getUserMatches(userId)
    userMatches.push(match)
    localStorage.setItem(this.getStorageKey(userId, "matches"), JSON.stringify(userMatches))

    const currentUser = this.getUserById(userId)
    if (currentUser) {
      const reciprocalMatch: Match = {
        ...match,
        userId: matchedUserId,
        matchedUserId: userId,
        user: currentUser,
      }
      const matchedUserMatches = this.getUserMatches(matchedUserId)
      matchedUserMatches.push(reciprocalMatch)
      localStorage.setItem(this.getStorageKey(matchedUserId, "matches"), JSON.stringify(matchedUserMatches))
    }

    return match
  }

  // Matches
  async getMatches(userId: string): Promise<Match[]> {
    await new Promise((resolve) => setTimeout(resolve, 400))
    return this.getUserMatches(userId)
  }

  private getUserMatches(userId: string): Match[] {
    const stored = localStorage.getItem(this.getStorageKey(userId, "matches"))
    return stored ? JSON.parse(stored) : []
  }

  async unlikeUser(userId: string, targetUserId: string): Promise<{ success: boolean }> {
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Remove the swipe
    const swipes = this.getUserSwipes(userId)
    const updatedSwipes = swipes.filter((s) => s.targetUserId !== targetUserId)
    localStorage.setItem(this.getStorageKey(userId, "swipes"), JSON.stringify(updatedSwipes))

    // Remove match if exists
    const matches = this.getUserMatches(userId)
    const updatedMatches = matches.filter((m) => m.matchedUserId !== targetUserId)
    localStorage.setItem(this.getStorageKey(userId, "matches"), JSON.stringify(updatedMatches))

    // Also remove from target user
    const targetMatches = this.getUserMatches(targetUserId)
    const updatedTargetMatches = targetMatches.filter((m) => m.matchedUserId !== userId)
    localStorage.setItem(this.getStorageKey(targetUserId, "matches"), JSON.stringify(updatedTargetMatches))

    // Create unlike notification
    await this.createNotification(targetUserId, {
      type: "unlike",
      fromUserId: userId,
      content: "unmatched with you",
    })

    return { success: true }
  }

  async recordProfileView(viewerId: string, viewedUserId: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 200))

    const viewer = this.getUserById(viewerId)
    if (!viewer) return

    const view: ProfileView = {
      id: `view_${Date.now()}`,
      viewerId,
      viewedUserId,
      viewedAt: new Date().toISOString(),
      viewer,
    }

    // Store for the viewed user
    const views = await this.getProfileViews(viewedUserId)
    // Don't duplicate views from same user within 1 hour
    const recentView = views.find(
      (v) => v.viewerId === viewerId && Date.now() - new Date(v.viewedAt).getTime() < 3600000,
    )

    if (!recentView) {
      views.push(view)
      localStorage.setItem(this.getStorageKey(viewedUserId, "views"), JSON.stringify(views))

      // Create notification
      await this.createNotification(viewedUserId, {
        type: "view",
        fromUserId: viewerId,
        content: "viewed your profile",
      })
    }
  }

  async getProfileViews(userId: string): Promise<ProfileView[]> {
    const stored = localStorage.getItem(this.getStorageKey(userId, "views"))
    return stored ? JSON.parse(stored) : []
  }

  async getWhoLikedMe(userId: string): Promise<User[]> {
    await new Promise((resolve) => setTimeout(resolve, 400))

    const allUsers = this.getAllUsers()
    const likedBy: User[] = []

    for (const user of allUsers) {
      if (user.id === userId) continue
      const swipes = this.getUserSwipes(user.id)
      const liked = swipes.find((s) => s.targetUserId === userId && s.action === "like")
      if (liked) {
        likedBy.push(user)
      }
    }

    return likedBy
  }

  async blockUser(userId: string, targetUserId: string): Promise<{ success: boolean }> {
    const user = this.getUserById(userId)
    if (!user) return { success: false }

    // Add to blocked list
    if (!user.blocked.includes(targetUserId)) {
      user.blocked.push(targetUserId)
      const userKey = `linder_user_${user.username}`
      const storedData = localStorage.getItem(userKey)
      if (storedData) {
        const userData = JSON.parse(storedData)
        userData.blocked = user.blocked
        localStorage.setItem(userKey, JSON.stringify(userData))
      }
    }

    // Remove any existing match
    await this.unlikeUser(userId, targetUserId)

    return { success: true }
  }

  async reportUser(userId: string, targetUserId: string): Promise<{ success: boolean }> {
    const user = this.getUserById(userId)
    if (!user) return { success: false }

    // Add to reported list
    if (!user.reported.includes(targetUserId)) {
      user.reported.push(targetUserId)
      const userKey = `linder_user_${user.username}`
      const storedData = localStorage.getItem(userKey)
      if (storedData) {
        const userData = JSON.parse(storedData)
        userData.reported = user.reported
        localStorage.setItem(userKey, JSON.stringify(userData))
      }
    }

    return { success: true }
  }

  // Messages
  async getConversations(userId: string): Promise<{ match: Match; lastMessage?: Message; unreadCount: number }[]> {
    await new Promise((resolve) => setTimeout(resolve, 400))

    const matches = this.getUserMatches(userId)
    const conversations = matches.map((match) => {
      const messages = this.getMatchMessages(match.id)
      const lastMessage = messages[messages.length - 1]
      const unreadCount = messages.filter((m) => m.receiverId === userId && !m.read).length

      return { match, lastMessage, unreadCount }
    })

    return conversations.sort((a, b) => {
      const aTime = a.lastMessage?.sentAt || a.match.matchedAt
      const bTime = b.lastMessage?.sentAt || b.match.matchedAt
      return new Date(bTime).getTime() - new Date(aTime).getTime()
    })
  }

  async getMessages(matchId: string, userId: string): Promise<Message[]> {
    await new Promise((resolve) => setTimeout(resolve, 300))

    const messages = this.getMatchMessages(matchId)

    // Mark as read
    messages.forEach((msg) => {
      if (msg.receiverId === userId) {
        msg.read = true
      }
    })
    localStorage.setItem(`linder_match_${matchId}_messages`, JSON.stringify(messages))

    return messages
  }

  async sendMessage(matchId: string, senderId: string, receiverId: string, content: string): Promise<Message> {
    await new Promise((resolve) => setTimeout(resolve, 300))

    const message: Message = {
      id: `msg_${Date.now()}`,
      matchId,
      senderId,
      receiverId,
      content,
      sentAt: new Date().toISOString(),
      read: false,
    }

    const messages = this.getMatchMessages(matchId)
    messages.push(message)
    localStorage.setItem(`linder_match_${matchId}_messages`, JSON.stringify(messages))

    await this.createNotification(receiverId, {
      type: "message",
      fromUserId: senderId,
      content: content.substring(0, 50),
    })

    return message
  }

  private getMatchMessages(matchId: string): Message[] {
    const stored = localStorage.getItem(`linder_match_${matchId}_messages`)
    return stored ? JSON.parse(stored) : []
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    const stored = localStorage.getItem(this.getStorageKey(userId, "notifications"))
    const notifications: Notification[] = stored ? JSON.parse(stored) : []

    // Attach user data to each notification
    return notifications.map((notif) => {
      const fromUser = this.getUserById(notif.fromUserId)
      return { ...notif, fromUser: fromUser || undefined }
    })
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const notifications = await this.getNotifications(userId)
    return notifications.filter((n) => !n.read).length
  }

  async markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    const notifications = await this.getNotifications(userId)
    const updated = notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    localStorage.setItem(this.getStorageKey(userId, "notifications"), JSON.stringify(updated))
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const notifications = await this.getNotifications(userId)
    const updated = notifications.map((n) => ({ ...n, read: true }))
    localStorage.setItem(this.getStorageKey(userId, "notifications"), JSON.stringify(updated))
  }

  private async createNotification(
    userId: string,
    data: { type: Notification["type"]; fromUserId: string; content: string },
  ): Promise<void> {
    const notifications = await this.getNotifications(userId)

    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId,
      type: data.type,
      fromUserId: data.fromUserId,
      content: data.content,
      read: false,
      createdAt: new Date().toISOString(),
    }

    notifications.unshift(notification)
    // Keep only last 100 notifications
    const trimmed = notifications.slice(0, 100)
    localStorage.setItem(this.getStorageKey(userId, "notifications"), JSON.stringify(trimmed))
  }
}

export const apiService = new ApiService()
