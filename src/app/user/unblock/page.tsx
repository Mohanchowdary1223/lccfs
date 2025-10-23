"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import BlockedRequestForm from '@/components/blocked-request-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function UnblockPage() {
  const router = useRouter()
  const [blockedUser, setBlockedUser] = useState<unknown>(null)
  

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const b = localStorage.getItem('blockedUser')
      if (b) setBlockedUser(JSON.parse(b))
    } catch {}
    // Polling: check every 5s and only while the page/tab is visible
    let interval: number | undefined
    try {
      interval = window.setInterval(async () => {
        try {
          if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
          const b = localStorage.getItem('blockedUser')
          if (!b) return
          const parsed = JSON.parse(b)
          const userId = parsed?.id || parsed?._id || ''
          if (!userId) return
          const res = await fetch('/api/user/profile', { headers: { 'x-user-id': userId } })
          if (res.ok) {
            const data = await res.json()
            if (data.role && data.role !== 'blocked') {
              try { localStorage.removeItem('blockedUser') } catch {}
              router.replace('/user/chatbot')
            }
          }
        } catch {
          // ignore poll errors
        }
      }, 5000)
    } catch {}
    return () => { if (interval) clearInterval(interval) }
    }, [router])

  

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-24">
      <div className="max-w-xl w-full bg-card p-6 rounded">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">You have been blocked</h2>
          <Button variant="ghost" size="icon" onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); localStorage.removeItem('blockedUser'); router.replace('/') }} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Your account has been blocked by an administrator. If you believe this is a mistake, you may submit an unblock request below.</p>
        <BlockedRequestForm user={blockedUser} />
        <div className="mt-4 flex gap-2">
          <button className="btn" onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); localStorage.removeItem('blockedUser'); router.replace('/') }}>Back to home</button>
        </div>
      </div>
    </div>
  )
}
