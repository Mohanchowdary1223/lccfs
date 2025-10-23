"use client"

import React, { useEffect, useState, useRef, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from "framer-motion"
import { ChatMessage } from '@/components/chatbot/ChatMessage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare, 
  ArrowRight, 
  Share2,
  Eye,
  LogIn
} from 'lucide-react'
import { ChatSession, Message } from '@/components/chatbot/types'
import { getUserIdFromLocalStorage } from '@/components/chatbot/utils'

type SharedChatPageProps = {
  params: Promise<{ chatId: string }>
}

const SharedChatPage: React.FC<SharedChatPageProps> = ({ params }) => {
  const router = useRouter()
  const { chatId } = use(params)
  const [sharedChat, setSharedChat] = useState<ChatSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [copying, setCopying] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasProcessedContinue = useRef(false)

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [sharedChat?.messages])

  const handleContinueChat = useCallback(async () => {
    if (!isLoggedIn) {
      // Redirect to login with return URL
      const returnUrl = `/shared-chat/${chatId}?continue=true`
      router.push(`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`)
      return
    }

    if (!userId || !sharedChat) return

    setCopying(true)
    try {
      const response = await fetch('/api/legalbot/copy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ chatId })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to copy chat')
      }

      if (data.chat) {
        // Redirect to user's chatbot with the copied chat
        router.push(`/user/chatbot?continue=${data.chat._id}`)
      }
    } catch (err) {
      console.error('Error copying chat:', err)
      alert('Failed to copy chat. Please try again.')
    } finally {
      setCopying(false)
    }
  }, [isLoggedIn, router, chatId, userId, sharedChat])

  useEffect(() => {
    const id = getUserIdFromLocalStorage()
    setUserId(id)
    setIsLoggedIn(!!id)
    
    // Fetch shared chat data
    const fetchSharedChat = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/legalbot?id=${chatId}&shared=1`)
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch shared chat')
        }
        
        if (data.chat) {
          setSharedChat(data.chat)
          
          // Check if user just logged in and wants to continue the chat
          if (typeof window !== 'undefined' && id && !hasProcessedContinue.current) {
            const urlParams = new URLSearchParams(window.location.search)
            const shouldContinue = urlParams.get('continue') === 'true'
            
            if (shouldContinue) {
              hasProcessedContinue.current = true
              // Remove the continue parameter from URL to prevent re-triggering
              const newUrl = window.location.pathname
              window.history.replaceState({}, '', newUrl)
              
              // Auto-continue the chat after login
              setTimeout(async () => {
                setCopying(true)
                try {
                  const response = await fetch('/api/legalbot/copy', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'x-user-id': id,
                    },
                    body: JSON.stringify({ chatId })
                  })

                  const copyData = await response.json()
                  
                  if (!response.ok) {
                    throw new Error(copyData.error || 'Failed to copy chat')
                  }

                  if (copyData.chat) {
                    // Redirect to user's chatbot with the copied chat
                    router.push(`/user/chatbot?continue=${copyData.chat._id}`)
                  }
                } catch (err) {
                  console.error('Error copying chat:', err)
                  alert('Failed to copy chat. Please try again.')
                } finally {
                  setCopying(false)
                }
              }, 1000) // Slightly longer delay for smooth transition
            }
          }
        } else {
          setError('Chat not found or not shared')
        }
      } catch (err) {
        console.error('Error fetching shared chat:', err)
        setError('Failed to load shared chat')
      } finally {
        setLoading(false)
      }
    }

    if (chatId) {
      fetchSharedChat()
    }
  }, [chatId, router])

  // Separate effect to handle auto-continue after login
  useEffect(() => {
    if (typeof window !== 'undefined' && sharedChat && userId) {
      const urlParams = new URLSearchParams(window.location.search)
      const shouldContinue = urlParams.get('continue') === 'true'
      
      if (shouldContinue) {
        // Remove the continue parameter from URL to prevent re-triggering
        const newUrl = window.location.pathname
        window.history.replaceState({}, '', newUrl)
        
        // Auto-continue the chat
        setTimeout(() => {
          handleContinueChat()
        }, 500)
      }
    }
  }, [sharedChat, userId, handleContinueChat])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading shared chat...</p>
        </div>
      </div>
    )
  }

  if (error || !sharedChat) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Chat Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              {error || 'This shared chat is no longer available or the link is invalid.'}
            </p>
            <Button onClick={() => router.push('/')} className="w-full">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col">
      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Share2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">{sharedChat?.title || 'Shared Legal Chat'}</h1>
                <p className="text-sm text-muted-foreground">
                  {sharedChat?.messages?.length || 0} messages • View only
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                Read Only
              </Badge>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Chat Content */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-background to-muted/20 px-4 py-6">
          <div className="container mx-auto max-w-4xl">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              {sharedChat?.messages?.map((message: Message, index: number) => (
                <div key={message.id || index}>
                  <ChatMessage
                    message={message}
                    index={index}
                    typingMessageId={null}
                    onTypingComplete={() => {}}
                    readOnly={true}
                  />
                </div>
              ))}
              <div ref={messagesEndRef} />
            </motion.div>
          </div>
        </div>

        {/* Continue Chat Button - Fixed at bottom */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-6"
        >
          <div className="container mx-auto max-w-4xl">
            <div className="flex flex-col items-center space-y-4">
              {!isLoggedIn && (
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Want to continue this conversation?
                  </p>
                  <p className="text-xs text-muted-foreground max-w-md">
                    Login to your account to copy this chat and continue the conversation with your own messages.
                  </p>
                </div>
              )}
              
              <Button
                onClick={handleContinueChat}
                disabled={copying}
                size="lg"
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-medium px-8 py-3 text-base"
              >
                {!isLoggedIn ? (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Login to Continue Chat
                  </>
                ) : copying ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Copying Chat...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-5 h-5 mr-2" />
                    Continue Chat
                  </>
                )}
              </Button>

              {!isLoggedIn && (
                <p className="text-xs text-center text-muted-foreground">
                  Don&apos;t have an account?{' '}
                  <button 
                    onClick={() => router.push('/auth/register')}
                    className="text-primary hover:underline"
                  >
                    Sign up for free
                  </button>
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default SharedChatPage