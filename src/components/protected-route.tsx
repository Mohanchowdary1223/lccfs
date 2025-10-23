"use client"

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'user'
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let pollId: number | undefined

    const init = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      try {
        const payload = token.split('.')[1]
        const decoded = JSON.parse(atob(payload))

        // Local role checks
        if (requiredRole && decoded.role !== requiredRole) {
          if (decoded.role === 'admin') router.replace('/admin/dashboard')
          else if (decoded.role === 'user') router.replace('/user/chatbot')
          else router.replace('/')
          setIsAuthorized(false)
          return
        }

        // If local token indicates blocked, redirect immediately
        if (decoded.role === 'blocked') {
          try { localStorage.setItem('blockedUser', JSON.stringify(decoded)) } catch {}
          router.replace('/user/unblock')
          setIsAuthorized(false)
          return
        }

        // Locally authorized — render children
        setIsAuthorized(true)

        // Poll for server-side role changes only when not on the unblock page
        if (decoded.role !== 'admin' && !pathname?.startsWith('/user/unblock')) {
          pollId = window.setInterval(async () => {
            try {
              if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
              const userId = decoded.userId || decoded.user?.id || decoded.user?._id || (() => { try { const u = localStorage.getItem('user'); return u ? JSON.parse(u)._id || JSON.parse(u).id : '' } catch { return '' } })()
              if (!userId) return
              const r = await fetch('/api/user/profile', { headers: { 'x-user-id': userId } })
              if (!r.ok) return
              const p = await r.json()
              if (p.role && p.role !== decoded.role) {
                if (p.role === 'blocked') {
                  try { localStorage.setItem('blockedUser', JSON.stringify({ id: userId, ...p })) } catch {}
                  router.replace('/user/unblock')
                  setIsAuthorized(false)
                } else if (p.role === 'user') {
                  router.replace('/user/chatbot')
                  setIsAuthorized(true)
                } else if (p.role === 'admin') {
                  router.replace('/admin/dashboard')
                  setIsAuthorized(true)
                }
                if (pollId) { clearInterval(pollId); pollId = undefined }
              }
            } catch {
              // ignore poll errors
            }
          }, 5000)
        }
      } catch {
        localStorage.removeItem('token')
        router.push('/auth/login')
      }
    }

    init()

    return () => { if (pollId) clearInterval(pollId) }
  }, [router, requiredRole, pathname])

  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

