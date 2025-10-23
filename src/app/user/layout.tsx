
"use client"

import React from 'react'
import { usePathname } from 'next/navigation'
import { ProtectedRoute } from '@/components/protected-route'
import { UserNavbar } from '@/components/user-navbar'

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // If we're on the unblock page, don't wrap with ProtectedRoute or show navbar.
  if (pathname?.startsWith('/user/unblock')) {
    return <>{children}</>
  }

  return (
    <ProtectedRoute requiredRole="user">
      <UserNavbar />
      {children}
    </ProtectedRoute>
  )
}
