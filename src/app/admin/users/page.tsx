"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog'
import { SuccessMessage, useSuccessMessage } from '@/components/ui/success-message'
import { MoreHorizontal, Trash2, Eye, Slash, User as UserIcon, Search } from 'lucide-react'
import { UserCardSkeleton } from '@/components/ui/loading-skeletons'


type UserItem = { _id: string; name?: string; email?: string; role?: string; chatCount?: number; fileCount?: number }


export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  
  const router = useRouter()
  const [pendingDeactivate, setPendingDeactivate] = useState<UserItem | null>(null)
  const [pendingBlock, setPendingBlock] = useState<UserItem | null>(null)
  const [pendingUnblock, setPendingUnblock] = useState<UserItem | null>(null)
  const { show: showSuccessMessage, message: successMessage, type: messageType, showMessage, hideMessage } = useSuccessMessage()


  const fetchUsers = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setUsers(data.users || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }


  useEffect(() => { fetchUsers() }, [])


  const filtered = users.filter(u => (u.name || '').toLowerCase().includes(query.toLowerCase()))


  const doAction = async (userId: string, action: 'block' | 'unblock' | 'deactivate') => {
    const token = localStorage.getItem('token')
    if (!token) return
    
    try {
      const response = await fetch(`/api/admin/user/${userId}`, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, 
        body: JSON.stringify({ action }) 
      })
      
      if (response.ok) {
        if (action === 'deactivate') {
          showMessage('User deactivated successfully! All user data including notifications have been permanently deleted.', 'success')
        } else if (action === 'block') {
          showMessage('User blocked successfully!', 'success')
        } else if (action === 'unblock') {
          showMessage('User unblocked successfully!', 'success')
        }
      } else {
        showMessage(`Failed to ${action} user. Please try again.`, 'error')
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error)
      showMessage(`Failed to ${action} user. Please try again.`, 'error')
    }
    
    await fetchUsers()
  }


  return (
    <div className="p-4 sm:p-6 pt-20 sm:pt-24">
      <SuccessMessage
        show={showSuccessMessage}
        message={successMessage}
        type={messageType}
        onClose={hideMessage}
      />
      <div className="mb-6">
        {/* Title and Refresh button row */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Users</h1>
          <Button onClick={fetchUsers} size="sm" className="sm:size-default">
            Refresh
          </Button>
        </div>
        
        {/* Search bar - full width on mobile, below title */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            placeholder="Search by name" 
            className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>
      </div>


      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <UserCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(u => (
            <Card key={u._id}>
              <CardHeader>
                <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{u.name}</div>
                    <div className="text-sm text-muted-foreground truncate">{u.email}</div>
                  </div>
                  <div className="text-left sm:text-right flex-shrink-0">
                    <div className="text-sm font-semibold">{u.chatCount ?? 0} chats</div>
                    <div className="text-xs text-muted-foreground">{u.fileCount ?? 0} uploads</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => router.push(`/admin/users/${u._id}`)} 
                    className="flex items-center gap-2 text-xs sm:text-sm"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View details</span>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {u.role !== 'blocked' ? (
                        <DropdownMenuItem onClick={() => setPendingBlock(u)}>
                          <Slash className="mr-2 h-4 w-4" />Block
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => setPendingUnblock(u)}>
                          <UserIcon className="mr-2 h-4 w-4" />Unblock
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setPendingDeactivate(u)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />Deactivate (delete)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}


      {/* Details now open on dedicated page: /admin/users/[userId] */}


      {/* Block confirmation dialog */}
      <AlertDialog open={!!pendingBlock} onOpenChange={() => setPendingBlock(null)}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Block User</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Are you sure you want to block this user? They will be unable to access the application until unblocked.
              {pendingBlock && (
                <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                  <strong>User:</strong> {pendingBlock.name} ({pendingBlock.email})
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => setPendingBlock(null)} className="w-full sm:w-auto">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => { 
                if (pendingBlock) { 
                  await doAction(pendingBlock._id, 'block'); 
                  setPendingBlock(null); 
                } 
              }}
              className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white"
            >
              Block User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      {/* Unblock confirmation dialog */}
      <AlertDialog open={!!pendingUnblock} onOpenChange={() => setPendingUnblock(null)}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Unblock User</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Are you sure you want to unblock this user? They will regain access to the application.
              {pendingUnblock && (
                <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                  <strong>User:</strong> {pendingUnblock.name} ({pendingUnblock.email})
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => setPendingUnblock(null)} className="w-full sm:w-auto">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => { 
                if (pendingUnblock) { 
                  await doAction(pendingUnblock._id, 'unblock'); 
                  setPendingUnblock(null); 
                } 
              }}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
            >
              Unblock User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      {/* Deactivate confirmation dialog */}
      <AlertDialog open={!!pendingDeactivate} onOpenChange={() => setPendingDeactivate(null)}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Deactivate User</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Are you sure you want to permanently delete this user and all their data? This action cannot be undone.
              {pendingDeactivate && (
                <div className="mt-2 p-2 bg-destructive/10 rounded text-sm border border-destructive/20">
                  <strong>User:</strong> {pendingDeactivate.name} ({pendingDeactivate.email})
                  <div className="mt-1 text-xs text-muted-foreground">
                    This will permanently delete {pendingDeactivate.chatCount || 0} chats and {pendingDeactivate.fileCount || 0} uploaded files.
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => setPendingDeactivate(null)} className="w-full sm:w-auto">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => { 
                if (pendingDeactivate) { 
                  await doAction(pendingDeactivate._id, 'deactivate'); 
                  setPendingDeactivate(null); 
                } 
              }}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
            >
              Deactivate User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
