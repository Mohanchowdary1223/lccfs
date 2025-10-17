"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Scale } from 'lucide-react'
import { TabsContent } from '@/components/ui/tabs'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FilesTab } from './FilesTab'
import { ChatSession, UploadedFile } from './types'
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
import { useState } from 'react'

interface ActivityTabProps {
  chatHistory: ChatSession[]
  uploadedFiles: UploadedFile[]
  onFilesReload?: () => Promise<void>
}

export const ActivityTab: React.FC<ActivityTabProps> = ({ chatHistory, uploadedFiles, onFilesReload }) => {
  const router = useRouter()
  const toast = useToast()
  // state placeholder removed

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
    navigator.clipboard.writeText(shareText).then(() => { alert('Content copied! You can now paste it on Instagram.') })
  }
  const handleCopyLink = (chat: ChatSession) => {
    const link = generateShareLink(chat)
    navigator.clipboard.writeText(link)
  toast.push('Link copied to clipboard', 'success', <CheckCircle className="w-5 h-5 text-white" />)
  }

  // Alert dialog state for scoped deletion
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmScope, setConfirmScope] = useState<'all' | 'chats' | 'files'>('all')

  const openConfirm = (scope: 'all' | 'chats' | 'files') => {
    setConfirmScope(scope)
    setConfirmOpen(true)
  }

  const performClear = async () => {
    setConfirmOpen(false)
    try {
      const userStr = localStorage.getItem('user')
      const userId = userStr ? JSON.parse(userStr).id || JSON.parse(userStr)._id : ''
      const res = await fetch(`/api/legalbot/clear?scope=${confirmScope}`, { method: 'POST', headers: { 'x-user-id': userId } })
      const data = await res.json()
        if (res.ok && data.success) {
          if (confirmScope === 'files') {
            // mark in localStorage so other pages/tabs that mount later can detect the bulk delete
            try { localStorage.setItem('files-cleared', JSON.stringify({ ts: Date.now() })) } catch {}
            window.dispatchEvent(new CustomEvent('files-cleared'))
            toast.push('All files deleted', 'success', <CheckCircle className="w-5 h-5 text-white" />)
            if (onFilesReload) await onFilesReload()
          } else {
            window.dispatchEvent(new CustomEvent('history-cleared'))
            toast.push('All chats deleted', 'success', <CheckCircle className="w-5 h-5 text-white" />)
            // refresh
            window.location.reload()
          }
      } else {
        throw new Error(data.error || 'Failed')
      }
    } catch (err) {
      console.error('Failed to clear', err)
      toast.push('Failed to delete items', 'error')
    }
  }

  return (
    <TabsContent value="activity" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Legal Chat History</CardTitle>
          <CardDescription>All your legal compliance conversations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4 space-x-2">
            {chatHistory.length > 0 && (
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => openConfirm('chats')}>Delete all chats</Button>
            )}
          </div>
          <div className="space-y-4">
            {chatHistory.map((chat, index) => (
              <motion.div
                key={chat._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors space-y-3 sm:space-y-0"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <Scale className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{chat.title}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-sm text-muted-foreground">
                      <span>{chat.messages?.length || 0} messages</span>
                      <span className="hidden sm:inline">Created {new Date(chat.createdAt).toLocaleDateString()}</span>
                      <span className="sm:hidden">Created: {new Date(chat.createdAt).toLocaleDateString()}</span>
                      <span className="hidden sm:inline">Updated {new Date(chat.updatedAt).toLocaleDateString()}</span>
                      <span className="sm:hidden">Updated: {new Date(chat.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-2 flex-shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => router.push(`/user/chatbot?continue=${chat._id}`)}>Continue</Button>

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

                  <Button variant="ghost" size="sm" className="text-destructive" onClick={async () => {
                    await fetch(`/api/legalbot?id=${chat._id}`, { method: 'DELETE', headers: { 'x-user-id': localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).id || JSON.parse(localStorage.getItem('user')!)._id : '' } })
                    window.dispatchEvent(new CustomEvent('chat-deleted'))
                    window.location.reload()
                  }}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
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
          </div>
        </CardContent>
      </Card>

      {/* Confirm dialog for clearing */}
      <AlertDialog open={confirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {confirmScope === 'chats' ? 'all chats' : confirmScope === 'files' ? 'all files' : 'all items'}</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={performClear} className="ml-2">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Files Section */}
  <FilesTab uploadedFiles={uploadedFiles} onFilesReload={onFilesReload} />
    </TabsContent>
  )
}