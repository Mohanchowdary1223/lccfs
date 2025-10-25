"use client"
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { User, LogOut, ShieldUser, Scale, Menu, Bell, Users, UserX } from 'lucide-react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'

export function AdminNavbar() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null)
  const [notificationCount, setNotificationCount] = useState(0)

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
    const userStr = localStorage.getItem('admin') || localStorage.getItem('user')
    if (userStr) {
      try {
        setUser(JSON.parse(userStr))
      } catch {
        setUser({ name: undefined, email: localStorage.getItem('adminEmail') || undefined })
      }
    } else {
      setUser({ email: localStorage.getItem('adminEmail') || undefined })
    }
    const handleTokenChange = () => {
      const newToken = localStorage.getItem('token')
      setIsLoggedIn(!!newToken)
      if (!newToken) {
        setUser(null)
      } else {
        const userStr = localStorage.getItem('admin') || localStorage.getItem('user')
        if (userStr) {
          try { setUser(JSON.parse(userStr)) } catch { setUser(null) }
        }
      }
    }
    window.addEventListener('tokenChange', handleTokenChange)
    return () => window.removeEventListener('tokenChange', handleTokenChange)
  }, [])

  const fetchNotificationCount = useCallback(async () => {
    if (!isLoggedIn) return
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        const unreadCount = data.notifications?.filter((n: { read: boolean }) => !n.read)?.length || 0
        setNotificationCount(unreadCount)
      }
    } catch (error) {
      console.error('Failed to fetch admin notifications:', error)
    }
  }, [isLoggedIn])

  useEffect(() => {
    if (isLoggedIn) {
      fetchNotificationCount()
    }
  }, [isLoggedIn, fetchNotificationCount])

  useEffect(() => {
    if (isLoggedIn) {
      // Listen for notification events to update count in real-time
      const handleNotificationChange = () => {
        fetchNotificationCount()
      }

      window.addEventListener('notificationRead', handleNotificationChange)
      window.addEventListener('newNotification', handleNotificationChange)

      return () => {
        window.removeEventListener('notificationRead', handleNotificationChange)
        window.removeEventListener('newNotification', handleNotificationChange)
      }
    }
  }, [isLoggedIn, fetchNotificationCount])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('admin')
    localStorage.removeItem('adminEmail')
    setIsLoggedIn(false)
    setUser(null)
    window.dispatchEvent(new Event('tokenChange'))
    router.push('/')
  }
  const handleProfileClick = () => router.push('/admin/profile')
  const getInitials = (name?: string) => (
    name ? name.split(' ').map(n => n.charAt(0)).slice(0,2).join('').toUpperCase() : '?'
  )

  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="w-full flex h-16 items-center justify-between px-4 md:px-6">
        {/* LEFT: logo/branding (matches UserNavbar layout) */}
        <div className="flex flex-row items-center gap-3 min-w-0">
          <Scale className="h-7 w-7 text-primary flex-shrink-0" />
          <div className="relative group min-w-0">
            <Link href="/admin/dashboard" className="font-bold text-2xl tracking-tight text-primary select-none truncate block">
              LCCFS
            </Link>
            <span className="absolute left-0 top-full mt-2 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap text-xs font-light bg-background border px-3 py-1 rounded shadow-lg transition-opacity z-20">
              Legal Compliance Chatbot for Startups - Admin
            </span>
          </div>
        </div>
        {/* RIGHT: nav/user/profile controls (mirrors UserNavbar) */}
        <div className="flex flex-row items-center gap-2">
          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" onClick={() => router.push('/admin/dashboard')} className="cursor-pointer text-sm font-medium hover:text-primary">
              <ShieldUser className="mr-2 h-4 w-4 text-primary" />Dashboard
            </Button>
            <Button variant="ghost" onClick={() => router.push('/admin/users')} className="cursor-pointer text-sm font-medium hover:text-primary">
              <Users className="mr-2 h-4 w-4" />Users
            </Button>
            <Button variant="ghost" onClick={() => router.push('/admin/blocked')} className="cursor-pointer text-sm font-medium hover:text-primary">
              <UserX className="mr-2 h-4 w-4" />Blocked
            </Button>
            <Button variant="ghost" onClick={() => router.push('/admin/notifications')} className="cursor-pointer text-sm font-medium hover:text-primary relative">
              <Bell className="mr-2 h-4 w-4" />Notifications
              {notificationCount > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </Badge>
              )}
            </Button>
          </div>
          {/* Theme toggle always shown */}
          <ThemeToggle />
          {/* Mobile hamburger menu */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 w-10 p-0">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48" align="end">
                <DropdownMenuItem onClick={() => router.push('/admin/dashboard')}><ShieldUser className="mr-2 h-4 w-4" />Dashboard</DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/admin/users')}><Users className="mr-2 h-4 w-4" />Users</DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/admin/blocked')}><UserX className="mr-2 h-4 w-4" />Blocked</DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/admin/notifications')} className="relative">
                  <Bell className="mr-2 h-4 w-4" />Notifications
                  {notificationCount > 0 && (
                    <Badge variant="destructive" className="ml-auto h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </Badge>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {isLoggedIn && (
                  <>
                    <DropdownMenuItem onClick={handleProfileClick}><User className="mr-2 h-4 w-4" />Profile</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600"><LogOut className="mr-2 h-4 w-4" />Logout</DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {/* Desktop user profile dropdown */}
          {isLoggedIn && user && (
            <div className="hidden md:block ml-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full cursor-pointer">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" alt="Admin avatar" />
                      <AvatarFallback className="bg-primary text-primary-foreground">{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none">{user.name || (user.email || '').split('@')[0]}</p>
                    <p className="text-xs leading-none text-muted-foreground">Administrator</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleProfileClick}><User className="mr-2 h-4 w-4" />Profile</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600"><LogOut className="mr-2 h-4 w-4" />Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  )
}
