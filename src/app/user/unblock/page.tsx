'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function UnblockPage() {
  const router = useRouter()
  const [blockedUser, setBlockedUser] = useState<unknown>(null)
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    try {
      const b = localStorage.getItem('blockedUser')
      if (b) setBlockedUser(JSON.parse(b))
    } catch {}

    const checkUserStatus = async () => {
      try {
        const b = localStorage.getItem('blockedUser')
        if (!b) return false
        const parsed = JSON.parse(b)
        const userId = parsed?.id || parsed?._id || ''
        if (!userId) return false
        
        const res = await fetch('/api/user/profile', { headers: { 'x-user-id': userId } })
        if (res.ok) {
          const data = await res.json()
          if (data.role && data.role !== 'blocked') {
            try { localStorage.removeItem('blockedUser') } catch {}
            router.replace('/user/chatbot')
            return true
          }
        }
        return false
      } catch {
        return false
      }
    }
    
    // Check immediately on mount
    checkUserStatus()
    
    let interval: number | undefined
    try {
      // Check every 2 seconds instead of 5 for more responsive experience
      interval = window.setInterval(async () => {
        try {
          if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
          await checkUserStatus()
        } catch {}
      }, 2000)
    } catch {}

    // Also check when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkUserStatus()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => { 
      if (interval) clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [router])

  const handleCheckStatus = async () => {
    setChecking(true)
    try {
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
    } catch {}
    setChecking(false)
  }

  const handleReturnHome = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('blockedUser')
    router.replace('/')
  }

  const submitUnblockRequest = async () => {
    let userId = ''
    try {
      const u = blockedUser as Record<string, unknown>
      userId = (u.id as string) || (u._id as string) || ''
    } catch {}
    if (!userId) {
      try {
        const u = localStorage.getItem('user')
        if (u) userId = JSON.parse(u)._id || JSON.parse(u).id || ''
      } catch {}
    }
    if (!userId) return
    await fetch('/api/unblock-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, message }),
    })
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-6">
      <Card className="max-w-lg w-full shadow-md border border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-2xl font-semibold tracking-tight">Access Restricted</CardTitle>
            <CardDescription>Your account is currently blocked</CardDescription>
          </div>
          <Button
            variant="default"
            size="icon"
            onClick={handleReturnHome}
            aria-label="Back to home"
            className="bg-primary text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert>
            <AlertTitle>Blocked Account</AlertTitle>
            <AlertDescription>
              Your account has been blocked by an administrator. If you believe this was a mistake,
              please submit an unblock request using the form below.
            </AlertDescription>
          </Alert>
          
          {/* Status Check Button for all users */}
          <div className="flex flex-col items-center space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              Think your account may have been unblocked? Check your current status:
            </p>
            <Button
              onClick={handleCheckStatus}
              disabled={checking}
              variant="outline"
              className="w-full"
            >
              {checking ? 'Checking...' : 'Check Account Status'}
            </Button>
          </div>
          
          <Separator className="my-4" />

          {sent ? (
            <div className="space-y-4">
              <Alert className="bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700">
                <AlertDescription className="text-green-700 dark:text-green-300 font-medium">
                  ✅ Unblock request submitted successfully! Admin will review your request and reply via notifications.
                </AlertDescription>
              </Alert>
              
              {/* Check Status Button */}
              <div className="flex flex-col items-center space-y-2">
                <p className="text-sm text-muted-foreground text-center">
                  If an admin has unblocked your account, click below to check your status:
                </p>
                <Button
                  onClick={handleCheckStatus}
                  disabled={checking}
                  variant="outline"
                  className="w-full"
                >
                  {checking ? 'Checking...' : 'Check Account Status'}
                </Button>
              </div>
            </div>
          ) : (
            <form
              className="space-y-2"
              onSubmit={e => {
                e.preventDefault()
                submitUnblockRequest()
              }}
            >
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 min-h-[48px] rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                rows={3}
                placeholder="Explain why you should be unblocked"
              />
              <div className="flex gap-2 justify-end mt-2">
                <Button
                  type="submit"
                  variant="default"
                  className="bg-primary text-primary-foreground"
                >
                  Send request
                </Button>
                <Button
                  variant="default"
                  onClick={handleReturnHome}
                  className="bg-primary text-primary-foreground"
                  type="button"
                >
                  Back to Home
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
