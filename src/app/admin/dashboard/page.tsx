"use client"
import React, { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { StatsSkeleton, TableSkeleton } from '@/components/ui/loading-skeletons'

const DashboardPage = () => {
  const [stats, setStats] = useState<Record<string, number> | null>(null)
  const [recent, setRecent] = useState<Array<{ _id: string; name?: string; email?: string; createdAt?: string | number }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    setLoading(true)
    Promise.all([
      fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    ]).then(([s, u]) => {
      setStats(s)
      setRecent((u.users || []).slice(0, 5))
    }).catch(e => console.error(e)).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6 pt-24">
        <div className="h-8 w-48 bg-accent animate-pulse rounded-md mb-6" />
        <StatsSkeleton />
        <div className="mt-6 space-y-4">
          <div className="h-6 w-32 bg-accent animate-pulse rounded-md" />
          <TableSkeleton rows={5} />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 pt-24">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats?.totalUsers ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Blocked Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats?.blockedCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Logins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats?.todayLogins ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Chats Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats?.chatsToday ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Chats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl">{stats?.totalChats ?? 'N/A'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Uploads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl">{stats?.totalUploads ?? 'N/A'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Monthly Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl">{stats?.monthlyActive ?? 'N/A'}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Recent Signups</h2>
        <div className="space-y-2">
          {recent.map(u => (
            <div key={u._id} className="p-3 border rounded flex items-center justify-between">
              <div>
                <div className="font-medium">{u.name}</div>
                <div className="text-sm text-muted-foreground">{u.email}</div>
              </div>
              <div className="text-sm text-muted-foreground">{u.createdAt ? `${new Date(u.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}, ${new Date(u.createdAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })}` : ''}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DashboardPage