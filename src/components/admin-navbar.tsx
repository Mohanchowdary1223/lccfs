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
import { useEffect, useState } from 'react'
import { User, LogOut, ShieldUser, Settings } from 'lucide-react'
import { motion } from 'framer-motion'

export function AdminNavbar() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
    
    // Get admin email from localStorage
    const email = localStorage.getItem('adminEmail') || localStorage.getItem('userEmail') || 'admin@example.com'
    setUserEmail(email)
    
    const handleTokenChange = () => {
      const newToken = localStorage.getItem('token')
      setIsLoggedIn(!!newToken)
      if (!newToken) {
        setUserEmail('')
      } else {
        const email = localStorage.getItem('adminEmail') || localStorage.getItem('userEmail') || 'admin@example.com'
        setUserEmail(email)
      }
    }
    
    window.addEventListener('tokenChange', handleTokenChange)
    return () => window.removeEventListener('tokenChange', handleTokenChange)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('adminEmail')
    localStorage.removeItem('userEmail')
    setIsLoggedIn(false)
    setUserEmail('')
    window.dispatchEvent(new Event('tokenChange'))
    router.push('/')
  }

  const handleProfileClick = () => {
    router.push('/admin/profile')
  }

  const handleSettingsClick = () => {
    router.push('/admin/settings')
  }

  // Get initials from email for avatar fallback
  const getInitials = (email: string) => {
    return email.split('@')[0].substring(0, 2).toUpperCase()
  }

  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container flex h-16 items-center justify-between px-6">
        {/* Logo Section */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <ShieldUser className="h-7 w-7 text-primary" />
          <div className="relative group">
            <Link href="/admin/dashboard" className="font-bold text-2xl tracking-tight text-primary select-none">
              LCCFS
            </Link>
            <span className="absolute left-0 top-full mt-2 opacity-0 group-hover:opacity-100 
                pointer-events-none whitespace-nowrap text-xs font-light 
                bg-background border px-3 py-1 rounded shadow-lg transition-opacity z-20">
              Legal Compliance Chatbot for Startups - Admin
            </span>
          </div>
        </motion.div>

        {/* Right Side Navigation */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex items-center space-x-4"
        >
          <ThemeToggle />
          
          {isLoggedIn && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" alt="Admin avatar" />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(userEmail)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none">{userEmail.split('@')[0]}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userEmail}
                  </p>
                  <p className="text-xs leading-none text-orange-600 font-medium">
                    Administrator
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSettingsClick} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </motion.div>
      </div>
    </motion.nav>
  )
}
