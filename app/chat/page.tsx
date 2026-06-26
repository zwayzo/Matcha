"use client"

import type React from "react"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Send, Loader2, ArrowLeft, Sparkles, Heart, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiService, type Match, type Message } from "@/lib/api-service"
import { AppHeader } from "@/components/app-header"
import { UserImage } from "@/components/user-image"
import Link from "next/link"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function ChatPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ChatContent />
    </Suspense>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-black">
      <AppHeader />
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#e65e6b] mx-auto mb-4" />
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    </div>
  )
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001"

function ChatContent() {
  // Authentication removed
  // const { user } = useAuth()
  const searchParams = useSearchParams()
  const matchIdFromUrl = searchParams?.get("matchId")
  const conversationIdFromUrl = searchParams?.get("conversationId")

  const [conversations, setConversations] = useState<{ match: Match; lastMessage?: Message; unreadCount: number }[]>([])
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showBlockDialog, setShowBlockDialog] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    // Auto-select match if provided in URL (either matchId or conversationId)
    if ((matchIdFromUrl || conversationIdFromUrl) && conversations.length > 0) {
      const match = conversations.find((c) => 
        c.match.id === matchIdFromUrl || 
        c.match.id === conversationIdFromUrl ||
        c.match.conversationId === conversationIdFromUrl
      )
      if (match) {
        handleSelectMatch(match.match)
      }
    }
  }, [matchIdFromUrl, conversationIdFromUrl, conversations])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const loadConversations = async () => {
    setLoading(true)
    try {
      const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null
      if (!userId) {
        setConversations([])
        setLoading(false)
        return
      }
      // Fetch matches from backend - each match now includes conversation_id
      const res = await fetch(`${API_BASE_URL}/api/matches?user_id=${userId}`)
      if (!res.ok) {
        console.error("Failed to fetch matches:", res.status, res.statusText)
        setConversations([])
        setLoading(false)
        return
      }
      const data = await res.json()
      console.log("📥 Matches data received:", data)
      // Map backend matches to conversation format with conversation_id
      const conversations = (data.matches || []).map((user: any) => ({
        match: {
          id: user.conversation_id?.toString() || user.id?.toString() || '',
          userId: userId,
          matchedUserId: user.id?.toString() || '',
          matchedAt: user.profile?.matchedAt || '',
          user: {
            id: user.id?.toString() || '',
            email: user.email || '',
            username: user.username || '',
            firstName: user.first_name || '',
            lastName: user.last_name || '',
            name: user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username || '',
            age: user.age || 0,
            gender: user.sex || '',
            sexualPreference: user.sexualPreference || '',
            title: user.profile?.title || '',
            company: user.profile?.company || '',
            location: user.profile?.location || '',
            bio: user.profile?.bio || '',
            interests: user.profile?.interests || [],
            education: user.profile?.education || '',
            industry: user.profile?.industry || '',
            experienceLevel: user.profile?.experienceLevel || '',
            profileImage: user.profile?.image1 || '/avatar.png',
            photos: [user.profile?.image1, user.profile?.image2, user.profile?.image3, user.profile?.image4].filter(Boolean) || ['/avatar.png'],
            verified: user.profile?.verified || false,
            onlineStatus: 'online',
            lastSeen: new Date().toISOString(),
            blocked: [],
            reported: [],
            emailVerified: user.email_verified || false
          },
          conversationId: user.conversation_id?.toString()
        },
        lastMessage: undefined,
        unreadCount: 0
      }))
      console.log("✅ Loaded conversations:", conversations.length)
      setConversations(conversations)
    } catch (e) {
      console.error("❌ Error loading conversations:", e)
      setConversations([])
    }
    setLoading(false)
  }

  const handleSelectMatch = async (match: Match) => {
    setSelectedMatch(match)
    // Load real messages from backend
    try {
      if (!match.conversationId) {
        console.error("No conversation ID for match:", match.id)
        setMessages([])
        return
      }
      const res = await fetch(`${API_BASE_URL}/api/messages/${match.conversationId}/`)
      if (!res.ok) {
        console.error("Failed to fetch messages:", res.status, res.statusText)
        setMessages([])
        return
      }
      const data = await res.json()
      const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null
      const messages: Message[] = (data || []).map((m: any) => ({
        id: m.id.toString(),
        matchId: match.id,
        senderId: m.sender_id.toString(),
        receiverId: m.receiver_id.toString(),
        content: m.content,
        sentAt: m.timestamp,
        read: true
      }))
      setMessages(messages)
    } catch (e) {
      setMessages([])
    }
    setConversations((prev) => prev.map((c) => (c.match.id === match.id ? { ...c, unreadCount: 0 } : c)))
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedMatch || sending) return

    setSending(true)
    const messageContent = newMessage.trim()
    setNewMessage("")

    try {
      const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null
      if (!selectedMatch.conversationId) {
        console.error("Cannot send message: no conversation ID")
        setSending(false)
        return
      }
      const res = await fetch(`${API_BASE_URL}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: selectedMatch.conversationId,
          sender_id: userId,
          receiver_id: selectedMatch.matchedUserId,
          content: messageContent
        })
      })
      if (!res.ok) {
        setSending(false)
        return
      }
      // Reload messages after sending
      await handleSelectMatch(selectedMatch)
    } catch (e) {
      setSending(false)
    }
    setSending(false)
  }

  const handleBlock = async () => {
    const user_id = localStorage.getItem("user_id")
    if (!user_id || !selectedMatch) return
    
    try {
      await apiService.blockUser(user_id, selectedMatch.matchedUserId)
      
      // Remove from conversations list
      setConversations(prev => prev.filter(conv => conv.match.id !== selectedMatch.id))
      setSelectedMatch(null)
      setShowBlockDialog(false)
    } catch (error) {
      console.error("Error blocking user:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <AppHeader />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-[#e65e6b] mx-auto mb-4" />
            <p className="text-white/70">Loading conversations...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-0">
      <AppHeader />

      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 max-w-7xl h-[calc(100vh-140px)] md:h-[calc(100vh-88px)]">
        <div className="bg-white/10 backdrop-blur rounded-3xl shadow-xl overflow-hidden border border-white/20 h-full flex">
          {/* Conversations List */}
          <div
            className={`${selectedMatch ? "hidden md:flex" : "flex"} w-full md:w-80 lg:w-96 border-r border-white/20 flex-col`}
          >
            <div className="p-4 sm:p-6 border-b border-white/20">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Messages</h2>
              <p className="text-sm text-white/70 mt-1">{conversations.length} conversations</p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-[#e65e6b]" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">No conversations yet</h3>
                  <p className="text-white/70 text-sm mb-4">Start matching to begin chatting</p>
                  <Button asChild size="sm" className="bg-[#e65e6b] hover:opacity-90">
                    <Link href="/discover">Start Swiping</Link>
                  </Button>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <button
                    key={conversation.match.id}
                    onClick={() => handleSelectMatch(conversation.match)}
                    className={`w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-colors border-b border-white/20 ${
                      selectedMatch?.id === conversation.match.id ? "bg-[#e65e6b]/10" : ""
                    }`}
                  >
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-black">
                        <UserImage
                          src={conversation.match.user.profileImage || "/avatar.png"}
                          alt={conversation.match.user.name}
                          width={56}
                          height={56}
                          className="object-cover"
                        />
                      </div>
                      {conversation.match.user.verified && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#e65e6b] rounded-full flex items-center justify-center border-2 border-white">
                          
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-white">{conversation.match.user.name}</h3>
                        {conversation.lastMessage && (
                          <span className="text-xs text-white/50">
                            {new Date(conversation.lastMessage.sentAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-white/70 truncate">
                          {conversation.lastMessage?.content || "Say hi to your new match!"}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="ml-2 px-2 py-0.5 bg-[#e65e6b] text-white text-xs rounded-full">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className={`${selectedMatch ? "flex" : "hidden md:flex"} flex-1 flex-col`}>
            {selectedMatch ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-white/20 flex items-center gap-4">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedMatch(null)}>
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-black">
                    <UserImage
                      src={selectedMatch.user.profileImage || "/avatar.png"}
                      alt={selectedMatch.user.name}
                      width={48}
                      height={48}
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      {selectedMatch.user.name}
                      {selectedMatch.user.verified && <Sparkles className="w-4 h-4 text-[#e65e6b]" />}
                    </h3>
                    <p className="text-sm text-white/70">{selectedMatch.user.title}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="text-blue-500 hover:bg-blue-500/10"
                    >
                      <Link href={`/profile/${selectedMatch.matchedUserId}`}>
                        View Profile
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:bg-red-500/10"
                      onClick={() => setShowBlockDialog(true)}
                    >
                      <Shield className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Heart className="w-10 h-10 text-[#e65e6b]" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">It's a Match!</h3>
                      <p className="text-white/70 mb-4">Start the conversation with {selectedMatch.user.name}</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null
                      const isOwn = message.senderId === userId
                      return (
                        <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                              isOwn
                                ? "bg-[#e65e6b] text-white"
                                : "bg-white/10 text-white"
                            }`}
                          >
                            <p className="text-sm leading-relaxed">{message.content}</p>
                            <p className={`text-xs mt-1 ${isOwn ? "text-white/70" : "text-white/50"}`}>
                              {new Date(message.sentAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-white/20">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={`Message ${selectedMatch.user.name}...`}
                      className="flex-1"
                      disabled={sending}
                    />
                    <Button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="bg-[#e65e6b] hover:opacity-90"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              // Empty State
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                  <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Heart className="w-12 h-12 text-[#e65e6b]" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Select a conversation</h3>
                  <p className="text-white/70">Choose a match from the left to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Block Dialog */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent className="bg-gray-900 border border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Block User?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              This will block {selectedMatch?.user.name} and remove them from your conversations. They won't be able to message you anymore. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-gray-800">
              Cancel
            </AlertDialogCancel>
            {/* <AlertDialogAction
              onClick={handleBlock}
              className="bg-red-600 hover:bg-red-700"
            >
              Block User
            </AlertDialogAction> */}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
