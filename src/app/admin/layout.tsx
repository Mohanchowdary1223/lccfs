
import React from 'react'
import { ProtectedRoute } from '@/components/protected-route'
import { AdminNavbar } from '@/components/admin-navbar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminNavbar />
      <div className="min-h-screen bg-background">
        <div className="flex">
          <aside className="w-64 bg-card border-r min-h-screen p-4">
            <nav className="space-y-2">
              <a href="/admin/dashboard" className="block px-4 py-2 rounded hover:bg-accent">
                Dashboard
              </a>
              <a href="/admin/users" className="block px-4 py-2 rounded hover:bg-accent">
                Users
              </a>
            </nav>
          </aside>
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
