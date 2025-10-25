"use client"
import React, { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog'
import { SuccessMessage, useSuccessMessage } from '@/components/ui/success-message'
import { UserIcon, Trash2, Shield, ShieldOff } from 'lucide-react'
import { UserCardSkeleton } from '@/components/ui/loading-skeletons'

type UserItem = { _id: string; name?: string; email?: string; role?: string; chatCount?: number; fileCount?: number }

const BlockedPage = () => {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingUnblock, setPendingUnblock] = useState<UserItem | null>(null)
  const [pendingDeactivate, setPendingDeactivate] = useState<UserItem | null>(null)
  const { show: showSuccessMessage, message: successMessage, type: messageType, showMessage, hideMessage } = useSuccessMessage()

  const fetchBlockedUsers = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    setLoading(true)
    try {
      const response = await fetch('/api/users?blocked=true', { headers: { Authorization: `Bearer ${token}` } })
      const data = await response.json()
      setUsers(data.users || [])
    } catch (e) { 
      console.error(e)
      showMessage('Failed to fetch blocked users', 'error')
    }
    setLoading(false)
  }

  useEffect(() => { fetchBlockedUsers() }, [])

  const doAction = async (userId: string, action: 'unblock' | 'deactivate') => {
    const token = localStorage.getItem('token')
    if (!token) return
    
    try {
      const response = await fetch(`/api/admin/user/${userId}`, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, 
        body: JSON.stringify({ action }) 
      })
      
      if (response.ok) {
        if (action === 'unblock') {
          showMessage('User unblocked successfully!', 'success')
        } else if (action === 'deactivate') {
          showMessage('User deactivated successfully! All user data has been permanently deleted.', 'success')
        }
        await fetchBlockedUsers()
      } else {
        showMessage(`Failed to ${action} user. Please try again.`, 'error')
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error)
      showMessage(`Failed to ${action} user. Please try again.`, 'error')
    }
  }

  return (
    <div className="p-6 pt-24">
      <SuccessMessage
        show={showSuccessMessage}
        message={successMessage}
        type={messageType}
        onClose={hideMessage}
      />
      
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Blocked Users</h1>
        <Button onClick={fetchBlockedUsers} variant="outline">
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <UserCardSkeleton key={i} />
          ))}
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Blocked Users</h3>
              <p className="text-muted-foreground mb-4">
                There are currently no blocked users in the system. All users have active access to the application.
              </p>
              <Button onClick={fetchBlockedUsers} variant="outline">
                Refresh List
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {users.map(u => (
            <Card key={u._id} className="border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-900/20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldOff className="h-5 w-5 text-orange-600" />
                    <div>
                      <div className="font-medium text-foreground">{u.name}</div>
                      <div className="text-sm text-muted-foreground">{u.email}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-orange-600">BLOCKED</div>
                    <div className="text-xs text-muted-foreground">
                      {u.chatCount || 0} chats • {u.fileCount || 0} files
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => setPendingUnblock(u)} 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2 border-green-200 text-green-700 hover:bg-green-50"
                  >
                    <UserIcon className="h-4 w-4" />
                    Unblock User
                  </Button>
                  <Button 
                    onClick={() => setPendingDeactivate(u)} 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2 border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Deactivate
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Unblock confirmation dialog */}
      <AlertDialog open={!!pendingUnblock} onOpenChange={() => setPendingUnblock(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unblock this user? They will regain full access to the application.
              {pendingUnblock && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-sm">
                  <strong>User:</strong> {pendingUnblock.name} ({pendingUnblock.email})
                  <div className="mt-1 text-xs text-muted-foreground">
                    User will be able to login and use all features again.
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingUnblock(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => { 
                if (pendingUnblock) { 
                  await doAction(pendingUnblock._id, 'unblock'); 
                  setPendingUnblock(null); 
                } 
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Unblock User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deactivate confirmation dialog */}
      <AlertDialog open={!!pendingDeactivate} onOpenChange={() => setPendingDeactivate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Blocked User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this blocked user and all their data? This action cannot be undone.
              {pendingDeactivate && (
                <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded text-sm">
                  <strong>User:</strong> {pendingDeactivate.name} ({pendingDeactivate.email})
                  <div className="mt-2 text-xs text-muted-foreground">
                    <strong>⚠️ This will permanently delete:</strong>
                    <ul className="mt-1 ml-4 list-disc">
                      <li>{pendingDeactivate.chatCount || 0} chat conversations</li>
                      <li>{pendingDeactivate.fileCount || 0} uploaded files</li>
                      <li>All user account data and settings</li>
                      <li>All notifications and activity history</li>
                    </ul>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingDeactivate(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => { 
                if (pendingDeactivate) { 
                  await doAction(pendingDeactivate._id, 'deactivate'); 
                  setPendingDeactivate(null); 
                } 
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Permanently Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default BlockedPage
