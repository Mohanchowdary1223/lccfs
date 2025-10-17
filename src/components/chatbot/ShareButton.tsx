"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Share2,
  Mail,
  Copy,
  Check,
  Instagram,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { FaWhatsapp } from 'react-icons/fa'
import { ChatSession } from "./types"

interface ShareButtonProps {
  currentChat: ChatSession | null
  onShareWhatsApp: () => void
  onShareEmail: () => void
  onShareInstagram: () => void
  onCopyLink: () => void
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  currentChat,
  onShareWhatsApp,
  onShareEmail,
  onShareInstagram,
  onCopyLink,
}) => {
  const [shareDropdownOpen, setShareDropdownOpen] = useState(false)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle')

  if (!currentChat) return null

  const handleCopyLink = () => {
    onCopyLink()
    setCopyStatus('copied')
    setTimeout(() => setCopyStatus('idle'), 2000)
    setShareDropdownOpen(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 }}
      className="fixed bottom-20 right-6 z-50"
    >
      <DropdownMenu open={shareDropdownOpen} onOpenChange={setShareDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold rounded-full h-10 w-10 cursor-pointer shadow-lg"
            >
              <Share2 className="w-8 h-8" />
            </Button>
          </motion.div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto p-2">
          <div className='flex flex-row gap-2'>
            <DropdownMenuItem 
              onClick={() => {
                onShareWhatsApp()
                setShareDropdownOpen(false)
              }} 
              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer flex items-center justify-center"
              aria-label="Share via WhatsApp"
            >
              <FaWhatsapp className="w-5 h-5 text-green-600" />
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={() => {
                onShareInstagram()
                setShareDropdownOpen(false)
              }} 
              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer flex items-center justify-center"
              aria-label="Share via Instagram"
            >
              <Instagram className="w-5 h-5 text-pink-600" />
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={() => {
                onShareEmail()
                setShareDropdownOpen(false)
              }} 
              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer flex items-center justify-center"
              aria-label="Share via Email"
            >
              <Mail className="w-5 h-5 text-blue-600" />
            </DropdownMenuItem>
          </div>
     
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onSelect={(e) => {
              e.preventDefault();
              handleCopyLink();
            }}
            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer flex items-center gap-2 justify-center"
          >
            {copyStatus === 'copied' ? (
              <Check className="w-5 h-5 text-green-600" /> 
            ) : (
              <Copy className="w-5 h-5" />
            )}
            <span>{copyStatus === 'copied' ? 'Copied!' : 'Copy Link'}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  )
}
