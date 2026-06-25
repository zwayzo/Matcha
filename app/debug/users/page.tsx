"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

interface StoredUser {
  id: string
  username: string
  email: string
  firstName?: string
  lastName?: string
  name?: string
  age?: number
  gender?: string
  location?: string
  bio?: string
  interests?: string[]
  [key: string]: any
}

export default function DebugUsersPage() {
  const [users, setUsers] = useState<StoredUser[]>([])
  const [selectedUser, setSelectedUser] = useState<StoredUser | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = () => {
    const allKeys = Object.keys(localStorage)
    const userKeys = allKeys.filter((key) => key.startsWith("linder_user_") && !key.includes("@"))
    const loadedUsers: StoredUser[] = []

    userKeys.forEach((key) => {
      try {
        const userData = JSON.parse(localStorage.getItem(key) || "{}")
        if (userData.username) {
          loadedUsers.push(userData)
        }
      } catch (e) {
        console.error(`Error parsing user data for key ${key}:`, e)
      }
    })

    setUsers(loadedUsers)
  }

  const deleteUser = (username: string) => {
    if (confirm(`Are you sure you want to delete user "${username}"?`)) {
      localStorage.removeItem(`linder_user_${username}`)
      localStorage.removeItem("linder_user")
      loadUsers()
      setSelectedUser(null)
    }
  }

  const clearAllUsers = () => {
    if (confirm("Are you sure you want to delete ALL users? This cannot be undone.")) {
      const allKeys = Object.keys(localStorage)
      allKeys.forEach((key) => {
        if (key.startsWith("linder_user_")) {
          localStorage.removeItem(key)
        }
      })
      localStorage.removeItem("linder_user")
      loadUsers()
      setSelectedUser(null)
    }
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Stored Users Debug Page</h1>
          <div className="flex gap-2">
            <Button onClick={loadUsers} variant="outline" className="text-white">
              Refresh
            </Button>
            <Button onClick={clearAllUsers} variant="destructive">
              Clear All Users
            </Button>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 mb-4">
          <p className="text-white/70">
            Total users stored: <span className="font-bold text-white">{users.length}</span>
          </p>
          <p className="text-white/70 text-sm mt-2">
            Users are stored in localStorage with keys like: <code className="bg-black/30 px-2 py-1 rounded">linder_user_username</code>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* User List */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
            <h2 className="text-xl font-bold text-white mb-4">All Users</h2>
            {users.length === 0 ? (
              <p className="text-white/70">No users found in localStorage</p>
            ) : (
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id || user.username}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedUser?.username === user.username
                        ? "bg-[#e65e6b] text-white"
                        : "bg-white/5 hover:bg-white/10 text-white"
                    }`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{user.username}</p>
                        <p className="text-sm opacity-80">{user.email}</p>
                        {user.name && <p className="text-sm opacity-70">{user.name}</p>}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteUser(user.username)
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Details */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
            <h2 className="text-xl font-bold text-white mb-4">User Details</h2>
            {selectedUser ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Basic Info</h3>
                  <div className="bg-black/30 rounded p-3 space-y-1 text-sm">
                    <p><span className="text-white/70">ID:</span> <span className="text-white">{selectedUser.id}</span></p>
                    <p><span className="text-white/70">Username:</span> <span className="text-white">{selectedUser.username}</span></p>
                    <p><span className="text-white/70">Email:</span> <span className="text-white">{selectedUser.email}</span></p>
                    {selectedUser.name && (
                      <p><span className="text-white/70">Name:</span> <span className="text-white">{selectedUser.name}</span></p>
                    )}
                    {selectedUser.age && (
                      <p><span className="text-white/70">Age:</span> <span className="text-white">{selectedUser.age}</span></p>
                    )}
                    {selectedUser.gender && (
                      <p><span className="text-white/70">Gender:</span> <span className="text-white">{selectedUser.gender}</span></p>
                    )}
                    {selectedUser.location && (
                      <p><span className="text-white/70">Location:</span> <span className="text-white">{selectedUser.location}</span></p>
                    )}
                  </div>
                </div>

                {selectedUser.bio && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Bio</h3>
                    <div className="bg-black/30 rounded p-3 text-sm text-white">{selectedUser.bio}</div>
                  </div>
                )}

                {selectedUser.interests && selectedUser.interests.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Interests ({selectedUser.interests.length})</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.interests.map((interest, idx) => (
                        <span key={idx} className="bg-[#e65e6b] text-white px-2 py-1 rounded text-sm">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Raw Data</h3>
                  <pre className="bg-black/30 rounded p-3 text-xs text-white overflow-auto max-h-64">
                    {JSON.stringify(selectedUser, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <p className="text-white/70">Select a user to view details</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
