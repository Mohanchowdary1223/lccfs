
import React from 'react'
import { ProtectedRoute } from '@/components/protected-route'
import { UserNavbar } from '@/components/user-navbar'

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="user">
      <UserNavbar />
      {children}
    </ProtectedRoute>
  )
}
