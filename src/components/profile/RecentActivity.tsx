"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Scale, Clock } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChatSession } from './types'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { FaWhatsapp } from 'react-icons/fa'
import { Mail, Copy, Instagram, Trash2, Share2, CheckCircle } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'

interface RecentActivityProps {
  chatHistory: ChatSession[]
  limit?: number
  showHeader?: boolean
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ 
  chatHistory, 
  limit = 5,
  showHeader = true 
}) => {
  const router = useRouter()
  const displayChats = chatHistory.slice(0, limit)
  const toast = useToast()

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const openDeleteConfirm = (id: string) => setPendingDeleteId(id)
  const closeDeleteConfirm = () => setPendingDeleteId(null)
  const performDelete = async () => {
    if (!pendingDeleteId) return
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      const userId = userStr ? JSON.parse(userStr).id || JSON.parse(userStr)._id : ''
      const res = await fetch(`/api/legalbot?id=${pendingDeleteId}`, { method: 'DELETE', headers: { 'x-user-id': userId } })
      const data = await res.json()
      if (res.ok && data.success) {
        try { window.dispatchEvent(new CustomEvent('chat-deleted', { detail: { id: pendingDeleteId } })) } catch {}
        toast.push('Chat deleted', 'success', <CheckCircle className="w-5 h-5 text-white" />)
      } else {
        throw new Error(data.error || 'Failed')
      }
    } catch (err) {
      console.error('Failed to delete chat', err)
      toast.push('Failed to delete chat', 'error')
    } finally {
      closeDeleteConfirm()
    }
  }

  const generateShareLink = (chat: ChatSession) => {
    if (!chat._id) return window.location.origin
    return `${window.location.origin}/shared-chat/${chat._id}`
  }
  const generateShareContent = (chat: ChatSession) => {
    const title = chat.title; const messageCount = chat.messages?.length || 0; const link = generateShareLink(chat)
    return `Check out this legal compliance conversation: "${title}" - ${messageCount} messages.\n\nView the chat: ${link}`
  }
  const handleWhatsAppShare = (chat: ChatSession) => {
    const shareText = generateShareContent(chat)
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
    window.open(whatsappUrl, '_blank')
  }
  const handleEmailShare = (chat: ChatSession) => {
    const shareText = generateShareContent(chat)
    const subject = `Legal Compliance Chat: ${chat.title}`
    const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shareText)}`
    window.location.href = emailUrl
  }
  const handleInstagramShare = (chat: ChatSession) => {
    const shareText = generateShareContent(chat)
    navigator.clipboard.writeText(shareText).then(() => { alert('📋 Content copied to clipboard! You can now paste it on Instagram or anywhere else.') })
  }
  const handleCopyLink = (chat: ChatSession) => {
    const link = generateShareLink(chat)
    navigator.clipboard.writeText(link)
  toast.push('Link copied to clipboard', 'success', <CheckCircle className="w-5 h-5 text-white" />)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Recent Legal Chats
            </CardTitle>
            <CardDescription>Your latest 5 legal compliance conversations</CardDescription>
          </CardHeader>
        )}
        <CardContent>
          {displayChats.map((chat, index) => (
            <motion.div
              key={chat._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b last:border-b-0"
            >
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <Scale className="h-4 w-4 text-primary flex-shrink-0" />
                <div className="min-w-0 w-32 sm:w-auto">
                  <p className="font-medium truncate max-w-md">{chat.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {chat.messages?.length || 0} messages • {new Date(chat.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex flex-row gap-2 mt-3 sm:mt-0 w-full sm:w-auto justify-end">
                <Button variant="ghost" size="sm" onClick={() => router.push(`/user/chatbot?continue=${chat._id}`)}>Continue</Button>

                {/* Share button: opens a small popup with the same share options as the chatbot's circular share */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-1 px-2 py-1">
                      <Share2 className="h-4 w-4" />
                      <span>Share</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-auto p-2">
                    <div className='flex flex-row gap-2'>
                      <DropdownMenuItem 
                        onClick={() => { handleWhatsAppShare(chat) }} 
                        className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer flex items-center justify-center"
                        aria-label="Share via WhatsApp"
                      >
                        <FaWhatsapp className="w-5 h-5 text-green-600" />
                      </DropdownMenuItem>

                      <DropdownMenuItem 
                        onClick={() => { handleInstagramShare(chat) }} 
                        className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer flex items-center justify-center"
                        aria-label="Share via Instagram"
                      >
                        <Instagram className="w-5 h-5 text-pink-600" />
                      </DropdownMenuItem>

                      <DropdownMenuItem 
                        onClick={() => { handleEmailShare(chat) }} 
                        className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer flex items-center justify-center"
                        aria-label="Share via Email"
                      >
                        <Mail className="w-5 h-5 text-blue-600" />
                      </DropdownMenuItem>
                    </div>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={() => { handleCopyLink(chat) }} className="p-2 flex items-center gap-2 justify-center cursor-pointer">
                      <Copy className="w-4 h-4" />
                      <span>Copy Link</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => openDeleteConfirm(chat._id!)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </motion.div>
          ))}
          {chatHistory.length === 0 && (
            <div className="text-center py-12">
                            <Scale className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <h3 className="text-lg font-medium mb-2">No Legal Chats Yet</h3>
                            <p className="text-muted-foreground mb-4">
                              Start your first conversation with our legal compliance assistant
                            </p>
                            <Button onClick={() => router.push('/user/chatbot')}>
                              Start Legal Chat
                            </Button>
                          </div>
          )}
        </CardContent>
        {/* Delete confirmation dialog */}
        <AlertDialog open={!!pendingDeleteId}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete chat</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete this chat? This action will also remove any files associated with it. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPendingDeleteId(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={performDelete} className="ml-2">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </motion.div>
  )
}