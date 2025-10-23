"use client"
import React, { useEffect, useState } from 'react'

type UserItem = { _id: string; name?: string; email?: string; role?: string }

const BlockedPage = () => {
  const [users, setUsers] = useState<UserItem[]>([])
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    fetch('/api/users?blocked=true', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setUsers(d.users || []))
      .catch(e => console.error(e))
  }, [])

  const doAction = async (userId: string, action: 'unblock' | 'deactivate') => {
    const token = localStorage.getItem('token')
    if (!token) return
    await fetch(`/api/admin/user/${userId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ action }) })
    location.reload()
  }

  return (
    <div className="p-6 pt-24">
      <h1 className="text-2xl font-bold mb-4">Blocked Users</h1>
      <div className="space-y-2">
        {users.map(u => (
          <div key={u._id} className="p-3 border rounded flex items-center justify-between">
            <div>
              <div className="font-medium">{u.name} <span className="text-sm text-muted-foreground">({u.email})</span></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => doAction(u._id, 'unblock')} className="btn">Unblock</button>
              <button onClick={() => doAction(u._id, 'deactivate')} className="btn text-red-600">Deactivate</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BlockedPage
