'use client'

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
import { Scale, Info, MessageCircle, Menu } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export function Navbar() {
  const router = useRouter()

  const handleAboutClick = (e: React.MouseEvent) => {
    e.preventDefault()
  }

  const handleChatAssistantClick = (e: React.MouseEvent) => {
    e.preventDefault()
    router.push('/auth/login')
  }

  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="w-full flex h-16 items-center justify-between px-4 md:px-6">
        {/* LEFT: branding/logo */}
        <div className="flex items-center gap-3 min-w-0">
          <Scale className="h-7 w-7 text-primary flex-shrink-0" />
          <div className="relative group min-w-0">
            <Link href="/" className="font-bold text-2xl tracking-tight text-primary select-none truncate block">
              LCCFS
            </Link>
            <span className="absolute left-0 top-full mt-2 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap text-xs font-light bg-background border px-3 py-1 rounded shadow-lg transition-opacity z-20">
              Legal Compliance Chatbot for Startups
            </span>
          </div>
        </div>

        {/* RIGHT: navigation actions */}
        <div className="flex items-center gap-2">
          {/* Desktop nav buttons */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={handleAboutClick}
              className="cursor-pointer text-sm font-medium hover:text-primary"
            >
              <Info className="mr-2 h-4 w-4" />
              About
            </Button>
            <Button
              variant="ghost"
              onClick={handleChatAssistantClick}
              className="cursor-pointer text-sm font-medium hover:text-primary"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Chat Assistant
            </Button>
          </div>
          <ThemeToggle />
          {/* Mobile dropdown menu */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 w-10 p-0">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48" align="end">
                <DropdownMenuItem onClick={handleAboutClick} className="cursor-pointer">
                  <Info className="mr-2 h-4 w-4" />About
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleChatAssistantClick} className="cursor-pointer">
                  <MessageCircle className="mr-2 h-4 w-4" />Chat Assistant
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/auth/login" className="cursor-pointer">
                    Login
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {/* Desktop login button */}
          <div className="hidden md:block">
            <Link href="/auth/login">
              <Button className='cursor-pointer bg-primary/80 hover:bg-primary dark:text-white'>
                Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </motion.nav>
  )
}
