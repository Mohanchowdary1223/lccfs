'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs } from '@/components/ui/tabs'
import { SuccessMessage, useSuccessMessage } from '@/components/ui/success-message'
import { 
  UserData, 
  ChatSession,
  UploadedFile,
  OverviewTab,
  ProfileEditTab,
  ActivityTab,
  SecurityTab,
  ProfileTabs,
  updateLocalStorageUser,
  clearUserData
} from '@/components/profile'

export default function UserProfilePage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [showPassword, setShowPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const router = useRouter()
  const { show: showSuccessMessage, message: successMessage, type: messageType, showMessage, hideMessage } = useSuccessMessage()

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

        // Fetch uploaded files (we'll create this endpoint or use existing)
        const fetchFiles = async () => {
          try {
            const filesRes = await fetch('/api/legalbot/files', {
              headers: { 'x-user-id': userId }
            })
            if (filesRes.ok) {
              const filesData = await filesRes.json()
              if (filesData.files) {
                setUploadedFiles(filesData.files)
              }
            }
          } catch (error) {
            console.error('Failed to load uploaded files:', error)
            // Continue without files - not critical error
          }
        }
        await fetchFiles()
      } catch (error) {
        console.error('Failed to load user data:', error)
        setError('Failed to load profile data')
      } finally {
        setLoading(false)
      }
    }
    loadUserData()
    const onChatDeleted = () => {
      // re-fetch chats
      ;(async () => {
        try {
          const userStr = localStorage.getItem('user')
          const userId = userStr ? JSON.parse(userStr).id || JSON.parse(userStr)._id : ''
          const chatRes = await fetch('/api/legalbot', { headers: { 'x-user-id': userId } })
          const chatData = await chatRes.json()
          if (chatData.history) setChatHistory(chatData.history)
        } catch {}
      })()
    }
    const onHistoryCleared = () => { setChatHistory([]); setUploadedFiles([]) }
    const onFilesCleared = () => { reloadFiles() }
    window.addEventListener('chat-deleted', onChatDeleted)
    window.addEventListener('history-cleared', onHistoryCleared)
    window.addEventListener('files-cleared', onFilesCleared)
    return () => {
      window.removeEventListener('chat-deleted', onChatDeleted)
      window.removeEventListener('history-cleared', onHistoryCleared)
      window.removeEventListener('files-cleared', onFilesCleared)
    }
  }, [])

  const reloadFiles = async () => {
    try {
      const userStr = localStorage.getItem('user')
      const userId = userStr ? JSON.parse(userStr).id || JSON.parse(userStr)._id : ''
      const filesRes = await fetch('/api/legalbot/files', { headers: { 'x-user-id': userId } })
      if (filesRes.ok) {
        const filesData = await filesRes.json()
        if (filesData.files) setUploadedFiles(filesData.files)
      }
    } catch (err) {
      console.error('Failed to reload files', err)
    }
  }

  const handleUpdateProfile = async () => {
    setLoading(true)
    setError('')
    try {
      if (newPassword) {
        // Handle password change using the change-password API
        if (!currentPassword) {
          setError('Current password is required to change password')
          showMessage('Current password is required to change password', 'error')
          setLoading(false)
          return
        }

        if (newPassword !== confirmPassword) {
          setError('New passwords do not match')
          showMessage('New passwords do not match', 'error')
          setLoading(false)
          return
        }

        const token = localStorage.getItem('token')
        if (!token) {
          setError('Authentication required')
          showMessage('Authentication required', 'error')
          setLoading(false)
          return
        }

        const response = await fetch('/api/user/change-password', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            currentPassword,
            newPassword
          })
        })

        const data = await response.json()
        if (response.ok) {
          setCurrentPassword('')
          setNewPassword('')
          setConfirmPassword('')
          showMessage('Password changed successfully!', 'success')
        } else {
          setError(data.message || 'Failed to change password')
          showMessage(data.message || 'Failed to change password', 'error')
        }
      } else {
        // Handle profile update (name and email only)
        const payload: Record<string, string> = { name: editName, email: editEmail }
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
          updateLocalStorageUser(editName, editEmail)
          showMessage('Profile updated successfully!', 'success')
        } else {
          setError(data.error || data.message || 'Failed to update profile')
          showMessage('Failed to update profile', 'error')
        }
      }
    } catch {
      setError('An error occurred while updating profile')
      showMessage('An error occurred while updating profile', 'error')
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
        showMessage('Account deleted successfully', 'success')
        setTimeout(() => {
          clearUserData()
          router.push('/auth/register')
        }, 1500)
      } else {
        setError(data.error || data.message || 'Failed to delete account')
        showMessage('Failed to delete account', 'error')
      }
    } catch {
      setError('An error occurred while deleting account')
      showMessage('An error occurred while deleting account', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEditToggle = () => {
    setIsEditing(!isEditing)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditName(userData?.name || '')
    setEditEmail(userData?.email || '')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
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
      <SuccessMessage
        show={showSuccessMessage}
        message={successMessage}
        type={messageType}
        onClose={hideMessage}
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 max-w-4xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
          
          <OverviewTab userData={userData} chatHistory={chatHistory} uploadedFiles={uploadedFiles} onFilesReload={reloadFiles} />
          
          <ProfileEditTab
            userData={userData}
            isEditing={isEditing}
            editName={editName}
            editEmail={editEmail}
            newPassword={newPassword}
            confirmPassword={confirmPassword}
            loading={loading}
            error={error}
            showPassword={showPassword}
            onEditToggle={handleEditToggle}
            onNameChange={setEditName}
            onEmailChange={setEditEmail}
            onPasswordChange={setNewPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onPasswordToggle={() => setShowPassword(!showPassword)}
            onUpdateProfile={handleUpdateProfile}
            onCancelEdit={handleCancelEdit}
          />
          
          <ActivityTab chatHistory={chatHistory} uploadedFiles={uploadedFiles} onFilesReload={reloadFiles} />
          
          <SecurityTab
            loading={loading}
            currentPassword={currentPassword}
            newPassword={newPassword}
            confirmPassword={confirmPassword}
            showPassword={showPassword}
            showCurrentPassword={showCurrentPassword}
            onCurrentPasswordChange={setCurrentPassword}
            onPasswordChange={setNewPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onPasswordToggle={() => setShowPassword(!showPassword)}
            onCurrentPasswordToggle={() => setShowCurrentPassword(!showCurrentPassword)}
            onUpdateProfile={handleUpdateProfile}
            onDeleteAccount={handleDeleteAccount}
          />
        </Tabs>
      </div>
    </motion.div>
  )
}
