/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'


interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'user'
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const [isAuthorized, setIsAuthorized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }

    try {
      // Decode JWT payload (client-side, no verify)
      const payload = token.split('.')[1]
      const decoded = JSON.parse(atob(payload))

      if (requiredRole && decoded.role !== requiredRole) {
        // Redirect to correct dashboard if role mismatch
        if (decoded.role === 'admin') {
          router.replace('/admin/dashboard')
        } else if (decoded.role === 'user') {
          router.replace('/user/chatbot')
        } else {
          router.replace('/')
        }
        return
      }
      setIsAuthorized(true)
    } catch (error) {
      localStorage.removeItem('token')
      router.push('/auth/login')
    }
  }, [router, requiredRole])

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
