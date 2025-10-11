/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  MessageCircle, 
  Clock, 
  Scale, 
  Edit3, 
  Save, 
  X,
  Settings,
  Shield,
  Activity,
  BarChart3,
  FileText,
  Trash2,
  LogOut,
  Eye,
  EyeOff
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"


interface UserData {
  _id: string
  name: string
  email: string
  createdAt: Date
  lastLogin?: Date
  role: 'user' | 'admin'
  chatStats?: {
    totalChats: number
    totalMessages: number
    lastChatDate?: Date
    favoriteTopics?: string[]
  }
}

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date | string
}

interface ChatSession {
  _id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

function getUserIdFromLocalStorage(): string {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.id || user._id || `user_${Date.now()}`;
      } catch {
        const newUserId = `user_${Date.now()}`;
        localStorage.setItem('user', JSON.stringify({ id: newUserId, name: 'User' }));
        return newUserId;
      }
    } else {
      const newUserId = `user_${Date.now()}`;
      localStorage.setItem('user', JSON.stringify({ id: newUserId, name: 'User' }));
      return newUserId;
    }
  }
  return `user_${Date.now()}`;  
}


export default function UserProfilePage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [showPassword, setShowPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const router = useRouter()


  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true)
      try {
        const userStr = localStorage.getItem('user')
        let userId = ''
        if (userStr) {
          try {
            const userObj = JSON.parse(userStr)
            userId = userObj.id || userObj._id
          } catch {}
        }
        if (!userId) {
          setError('User not found')
          setLoading(false)
          return
        }

        const userRes = await fetch('/api/user/profile', {
          headers: { 'x-user-id': userId }
        })
        if (!userRes.ok) {
          setError('Failed to fetch user profile')
          setLoading(false)
          return
        }
        const userDataRes = await userRes.json()
        setUserData({
          _id: userDataRes._id,
          name: userDataRes.name,
          email: userDataRes.email,
          createdAt: new Date(userDataRes.createdAt),
          lastLogin: userDataRes.updatedAt ? new Date(userDataRes.updatedAt) : undefined,
          role: userDataRes.role,
        })
        setEditName(userDataRes.name)
        setEditEmail(userDataRes.email)

        const chatRes = await fetch('/api/legalbot', {
          headers: { 'x-user-id': userId }
        })
        const chatData = await chatRes.json()
        if (chatData.history) {
          setChatHistory(chatData.history)
        }
      } catch (error) {
        console.error('Failed to load user data:', error)
        setError('Failed to load profile data')
      } finally {
        setLoading(false)
      }
    }
    loadUserData()
  }, [])


  const calculateStats = () => {
    if (!chatHistory.length) return { totalChats: 0, totalMessages: 0, avgMessagesPerChat: 0 }
    
    const totalChats = chatHistory.length
    const totalMessages = chatHistory.reduce((total, chat) => total + (chat.messages?.length || 0), 0)
    const avgMessagesPerChat = Math.round(totalMessages / totalChats)
    
    return { totalChats, totalMessages, avgMessagesPerChat }
  }


  const stats = calculateStats()


  const handleUpdateProfile = async () => {
    setLoading(true)
    setError('')
    try {
      const payload: Record<string, string> = { name: editName, email: editEmail }
      if (newPassword) payload.password = newPassword
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userData?._id || ''
        },
        body: JSON.stringify(payload)
      })
      const data = await response.json()
      if (response.ok) {
        setUserData(prev => prev ? { ...prev, name: editName, email: editEmail } : null)
        setIsEditing(false)
        setNewPassword('')
        setConfirmPassword('')
        if (typeof window !== 'undefined') {
          const userStr = localStorage.getItem('user')
          if (userStr) {
            const user = JSON.parse(userStr)
            user.name = editName
            user.email = editEmail
            localStorage.setItem('user', JSON.stringify(user))
          }
        }
      } else {
        setError(data.error || data.message || 'Failed to update profile')
      }
    } catch (error) {
      setError('An error occurred while updating profile')
    } finally {
      setLoading(false)
    }
  }


  const handleDeleteAccount = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/user/profile', {
        method: 'DELETE',
        headers: { 'x-user-id': userData?._id || '' }
      })
      const data = await response.json()
      if (response.ok) {
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        router.push('/auth/register')
      } else {
        setError(data.error || data.message || 'Failed to delete account')
      }
    } catch (error) {
      setError('An error occurred while deleting account')
    } finally {
      setLoading(false)
    }
  }


  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/auth/login')
  }


  if (loading && !userData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="h-8 w-8 rounded-full border-2 border-muted border-t-primary"
        />
      </div>
    )
  }


  if (!userData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-20">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Failed to load profile data</p>
            <Button onClick={() => router.push('/user/chatbot')} className="mt-4">
              Go to Chatbot
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }


  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-background pt-20"
    >
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab Navigation */}
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Activity</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Security</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                      <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                        {userData.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-2xl">{userData.name}</CardTitle>
                      <CardDescription className="text-lg">{userData.email}</CardDescription>
                      <div className="flex items-center mt-2 space-x-4">
                        <Badge variant={userData.role === 'admin' ? 'default' : 'secondary'}>
                          {userData.role === 'admin' ? 'Admin' : 'User'}
                        </Badge>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-1" />
                          Joined {userData.createdAt.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalChats}</div>
                    <p className="text-xs text-muted-foreground">
                      Legal compliance conversations
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalMessages}</div>
                    <p className="text-xs text-muted-foreground">
                      Messages exchanged
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Messages</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.avgMessagesPerChat}</div>
                    <p className="text-xs text-muted-foreground">
                      Per conversation
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Recent Legal Chats
                  </CardTitle>
                  <CardDescription>Your latest legal compliance conversations</CardDescription>
                </CardHeader>
                <CardContent>
                  {chatHistory.slice(0, 5).map((chat, index) => (
                    <motion.div
                      key={chat._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-center justify-between py-3 border-b last:border-b-0"
                    >
                      <div className="flex items-center space-x-3">
                        <Scale className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-medium truncate max-w-md">{chat.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {chat.messages?.length || 0} messages • {new Date(chat.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/user/chatbot?continue=${chat._id}`)}
                      >
                        Continue
                      </Button>
                    </motion.div>
                  ))}
                  {chatHistory.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Scale className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No legal chats yet</p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => router.push('/user/chatbot')}
                      >
                        Start Your First Chat
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your personal information</CardDescription>
                  </div>
                  {!isEditing && (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      className="flex items-center space-x-2"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>Edit</span>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="editName">Full Name</Label>
                      <Input
                        id="editName"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editEmail">Email Address</Label>
                      <Input
                        id="editEmail"
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="Enter your email"
                      />
                    </div>
                    <div className="flex space-x-2 pt-4">
                      <Button
                        onClick={handleUpdateProfile}
                        disabled={loading || !editName.trim() || !editEmail.trim()}
                        className="flex items-center space-x-2"
                      >
                        <Save className="h-4 w-4" />
                        <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false)
                          setEditName(userData.name)
                          setEditEmail(userData.email)
                        }}
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Full Name</p>
                        <p className="text-sm text-muted-foreground">{userData.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Email Address</p>
                        <p className="text-sm text-muted-foreground">{userData.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Member Since</p>
                        <p className="text-sm text-muted-foreground">
                          {userData.createdAt.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Legal Chat History</CardTitle>
                <CardDescription>All your legal compliance conversations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {chatHistory.map((chat, index) => (
                    <motion.div
                      key={chat._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * index }}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <Scale className="h-5 w-5 text-primary flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{chat.title}</p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>{chat.messages?.length || 0} messages</span>
                            <span>Created {new Date(chat.createdAt).toLocaleDateString()}</span>
                            <span>Updated {new Date(chat.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/user/chatbot?continue=${chat._id}`)}
                        >
                          Continue
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                  {chatHistory.length === 0 && (
                    <div className="text-center py-12">
                      <Scale className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No Legal Chats Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start your first conversation with our legal compliance assistant
                      </p>
                      <Button onClick={() => router.push('/user/chatbot')}>
                        Start Legal Chat
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                  <Input
                    id="confirmNewPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
                <Button
                  onClick={handleUpdateProfile}
                  disabled={loading || !newPassword || newPassword !== confirmPassword}
                  className="w-full"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                <CardDescription>Irreversible account actions</CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account
                        and remove all your legal chat data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Yes, delete my account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  )
}
