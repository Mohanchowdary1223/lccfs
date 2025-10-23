"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog'
import { MoreHorizontal, Trash2, Eye, Slash, User as UserIcon } from 'lucide-react'

type UserItem = { _id: string; name?: string; email?: string; role?: string; chatCount?: number; fileCount?: number }

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  
  const router = useRouter()
  const [pendingDeactivate, setPendingDeactivate] = useState<UserItem | null>(null)

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
          alert('✅ User deactivated successfully! All user data including notifications have been permanently deleted.')
        } else if (action === 'block') {
          alert('✅ User blocked successfully!')
        } else if (action === 'unblock') {
          alert('✅ User unblocked successfully!')
        }
      } else {
        alert(`❌ Failed to ${action} user. Please try again.`)
      }
    } catch (error) {
      console.error('Action failed:', error)
      alert(`❌ Failed to ${action} user. Please check your connection and try again.`)
    }
    
    await fetchUsers()
  }

  return (
    <div className="p-6 pt-24">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <div className="flex items-center gap-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name" className="input" />
          <Button onClick={fetchUsers}>Refresh</Button>
        </div>
      </div>

      {loading ? <div>Loading...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(u => (
            <Card key={u._id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-sm text-muted-foreground">{u.email}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{u.chatCount ?? 0} chats</div>
                    <div className="text-xs text-muted-foreground">{u.fileCount ?? 0} uploads</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/users/${u._id}`)} className="flex items-center gap-2"><Eye className="h-4 w-4" />View full details</Button>
                  </div>
                  <div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {u.role !== 'blocked' ? (
                          <DropdownMenuItem onClick={() => doAction(u._id, 'block')}><Slash className="mr-2 h-4 w-4" />Block</DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => doAction(u._id, 'unblock')}><UserIcon className="mr-2 h-4 w-4" />Unblock</DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setPendingDeactivate(u)} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" />Deactivate (delete)</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details now open on dedicated page: /admin/users/[userId] */}

      {/* Deactivate confirmation dialog */}
      <AlertDialog open={!!pendingDeactivate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate user</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this user and all their data? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingDeactivate(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (pendingDeactivate) { await doAction(pendingDeactivate._id, 'deactivate'); setPendingDeactivate(null); } }} className="ml-2">Deactivate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

  