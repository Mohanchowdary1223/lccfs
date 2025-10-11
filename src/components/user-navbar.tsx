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
import { User, LogOut, Scale, MessageCircle, Info, Menu } from 'lucide-react'
import { motion } from 'framer-motion'

export function UserNavbar() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        setUser(JSON.parse(userStr))
      } catch {
        setUser(null)
      }
    } else {
      setUser(null)
    }
    const handleTokenChange = () => {
      const newToken = localStorage.getItem('token')
      setIsLoggedIn(!!newToken)
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          setUser(JSON.parse(userStr))
        } catch {
          setUser(null)
        }
      } else {
        setUser(null)
      }
    }
    window.addEventListener('tokenChange', handleTokenChange)
    return () => window.removeEventListener('tokenChange', handleTokenChange)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setIsLoggedIn(false)
    setUser(null)
    window.dispatchEvent(new Event('tokenChange'))
    router.push('/')
  }
  const handleProfileClick = () => router.push('/user/profile')
  const handleChatAssistantClick = () => router.push('/user/chatbot')
  const handleAboutClick = () => router.push('/user/about')
  const getInitial = (name: string) => (
    name && name.length > 0 ? name.charAt(0).toUpperCase() : '?'
  )

  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="w-full flex h-16 items-center justify-between px-4 md:px-6">
        {/* LEFT: logo/branding (flex-1 for max width split) */}
        <div className="flex flex-row items-center gap-3 min-w-0">
          <Scale className="h-7 w-7 text-primary flex-shrink-0" />
          <div className="relative group min-w-0">
            <Link href="/user/chatbot" className="font-bold text-2xl tracking-tight text-primary select-none truncate block">
              LCCFS
            </Link>
            <span className="absolute left-0 top-full mt-2 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap text-xs font-light bg-background border px-3 py-1 rounded shadow-lg transition-opacity z-20">
              Legal Compliance Chatbot for Startups
            </span>
          </div>
        </div>
        {/* RIGHT: all nav/user/profile controls */}
        <div className="flex flex-row items-center gap-2">
          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" onClick={handleAboutClick} className="cursor-pointer text-sm font-medium hover:text-primary">
              <Info className="mr-2 h-4 w-4" />About
            </Button>
            <Button variant="ghost" onClick={handleChatAssistantClick} className="cursor-pointer text-sm font-medium hover:text-primary">
              <MessageCircle className="mr-2 h-4 w-4" />Chat Assistant
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
                <DropdownMenuItem onClick={handleAboutClick}><Info className="mr-2 h-4 w-4" />About</DropdownMenuItem>
                <DropdownMenuItem onClick={handleChatAssistantClick}><MessageCircle className="mr-2 h-4 w-4" />Chat Assistant</DropdownMenuItem>
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
                      <AvatarImage src="" alt="User avatar" />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitial(user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
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
