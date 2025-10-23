
import React from 'react'
import { ProtectedRoute } from '@/components/protected-route'
import { AdminNavbar } from '@/components/admin-navbar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminNavbar />
      <main>{children}</main>
    </ProtectedRoute>
  )
}
