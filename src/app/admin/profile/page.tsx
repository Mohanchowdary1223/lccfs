"use client"

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, Shield, Eye, EyeOff, Save, Edit, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { SuccessMessage } from "@/components/ui/success-message"
import { useSuccessMessage } from "@/components/ui/success-message"

interface AdminData {
  _id: string
  name: string
  email: string
  role: string
  createdAt: string
  lastLogin?: string
}

export default function AdminProfilePage() {
  const { showMessage, hideMessage, show, message, type } = useSuccessMessage()
  const [adminData, setAdminData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [passwordMode, setPasswordMode] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form states
  const [editForm, setEditForm] = useState({
    name: '',
    email: ''
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          console.error('No token found in localStorage')
          showMessage('Authentication required. Please login again.', 'error')
          return
        }

        console.log('Token found:', token.substring(0, 20) + '...')

        // Fetch admin profile
        const profileRes = await fetch('/api/admin/profile', {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        console.log('Profile API response status:', profileRes.status)
        
        if (profileRes.ok) {
          const profileData = await profileRes.json()
          console.log('Profile data received:', profileData)
          setAdminData(profileData.admin)
          setEditForm({
            name: profileData.admin.name,
            email: profileData.admin.email
          })
        } else {
          console.error('Profile API error:', profileRes.status)
          const errorData = await profileRes.json().catch(() => ({}))
          console.error('Profile error details:', errorData)
          
          // Check if it's an authentication issue
          if (profileRes.status === 401 || profileRes.status === 403) {
            showMessage('Authentication failed. Please login again.', 'error')
            // Redirect to login or clear invalid token
            localStorage.removeItem('token')
            window.location.href = '/auth/login'
            return
          }
          
          // For other errors, show a user-friendly message
          showMessage('Failed to load admin profile. Please try again.', 'error')
        }

      } catch (error) {
        console.error('Error fetching admin data:', error)
        showMessage('Failed to load admin data', 'error')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [showMessage])

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      // Fetch admin profile
      const profileRes = await fetch('/api/admin/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (profileRes.ok) {
        const profileData = await profileRes.json()
        setAdminData(profileData.admin)
        setEditForm({
          name: profileData.admin.name,
          email: profileData.admin.email
        })
      } else {
        console.error('Profile API error in fetchAdminData:', profileRes.status)
        const errorData = await profileRes.json().catch(() => ({}))
        console.error('Profile error details in fetchAdminData:', errorData)
        showMessage('Failed to reload admin profile', 'error')
      }

    } catch (error) {
      console.error('Error fetching admin data:', error)
      showMessage('Failed to load admin data', 'error')
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email
        })
      })

      if (response.ok) {
        await fetchAdminData()
        setEditMode(false)
        showMessage('Profile updated successfully!', 'success')
      } else {
        const data = await response.json()
        showMessage(data.message || 'Failed to update profile', 'error')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      showMessage('Failed to update profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage('New passwords do not match', 'error')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      showMessage('Password must be at least 6 characters long', 'error')
      return
    }

    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/admin/change-password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      })

      if (response.ok) {
        setPasswordMode(false)
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        showMessage('Password changed successfully!', 'success')
      } else {
        const data = await response.json()
        showMessage(data.message || 'Failed to change password', 'error')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      showMessage('Failed to change password', 'error')
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = () => {
    setEditMode(false)
    setEditForm({
      name: adminData?.name || '',
      email: adminData?.email || ''
    })
  }

  const cancelPasswordChange = () => {
    setPasswordMode(false)
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  }

  if (loading) {
    return (
      <div className="p-6 pt-24 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <SuccessMessage
        show={show}
        message={message}
        type={type}
        onClose={hideMessage}
      />
      
      <div className="p-6 pt-24 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <h1 className="text-3xl font-bold tracking-tight">Admin Profile</h1>
          <p className="text-muted-foreground">Manage your admin account and view platform statistics</p>
        </motion.div>



        {/* Main Profile Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="flex justify-center gap-2 w-full mx-auto">
              <TabsTrigger value="profile">Profile Details</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Profile Information</CardTitle>
                      <CardDescription>Manage your admin account details</CardDescription>
                    </div>
                    {!editMode && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditMode(true)}
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {adminData && (
                    <>
                      {/* Admin Badge */}
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="gap-1">
                          <Shield className="h-3 w-3" />
                          Administrator
                        </Badge>
                      </div>

                      <Separator />

                      {editMode ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="name">Full Name</Label>
                              <Input
                                id="name"
                                value={editForm.name}
                                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Enter your full name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="email">Email Address</Label>
                              <Input
                                id="email"
                                type="email"
                                value={editForm.email}
                                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="Enter your email"
                              />
                            </div>
                          </div>

                          <div className="flex gap-2 pt-4">
                            <Button
                              onClick={handleSaveProfile}
                              disabled={saving}
                              className="gap-2"
                            >
                              <Save className="h-4 w-4" />
                              {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={cancelEdit}
                              disabled={saving}
                              className="gap-2"
                            >
                              <X className="h-4 w-4" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm text-muted-foreground">Full Name</Label>
                              <p className="text-lg font-medium">{adminData.name}</p>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Email Address</Label>
                              <p className="text-lg font-medium">{adminData.email}</p>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm text-muted-foreground">Role</Label>
                              <p className="text-lg font-medium capitalize">{adminData.role}</p>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Account Created</Label>
                              <p className="text-lg font-medium">
                                {new Date(adminData.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                            {adminData.lastLogin && (
                              <div>
                                <Label className="text-sm text-muted-foreground">Last Login</Label>
                                <p className="text-lg font-medium">
                                  {new Date(adminData.lastLogin).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Security Settings</CardTitle>
                      <CardDescription>Manage your password and security preferences</CardDescription>
                    </div>
                    {!passwordMode && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPasswordMode(true)}
                        className="gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        Change Password
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {passwordMode ? (
                    <div className="space-y-4 max-w-md">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showPasswords.current ? "text" : "password"}
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                            placeholder="Enter current password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                          >
                            {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showPasswords.new ? "text" : "password"}
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                            placeholder="Enter new password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                          >
                            {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showPasswords.confirm ? "text" : "password"}
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            placeholder="Confirm new password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                          >
                            {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={handleChangePassword}
                          disabled={saving || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                          className="gap-2"
                        >
                          <Save className="h-4 w-4" />
                          {saving ? 'Changing...' : 'Change Password'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={cancelPasswordChange}
                          disabled={saving}
                          className="gap-2"
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg bg-muted/50">
                        <h3 className="font-medium mb-2">Password Security</h3>
                        <p className="text-sm text-muted-foreground">
                          Your password was last changed on {adminData?.createdAt ? new Date(adminData.createdAt).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                        <h3 className="font-medium mb-2 text-green-800 dark:text-green-200">Security Tips</h3>
                        <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                          <li>• Use a strong password with at least 8 characters</li>
                          <li>• Include uppercase, lowercase, numbers, and symbols</li>
                          <li>• Don&apos;t reuse passwords from other accounts</li>
                          <li>• Change your password regularly</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}