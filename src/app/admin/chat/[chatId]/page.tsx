"use client"
import React, { useEffect, useState, useRef } from 'react'
import { useSearchParams, useParams, useRouter } from 'next/navigation'
import { SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"


import { ChatMessage } from '@/components/chatbot/ChatMessage'

import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { SuccessMessage } from "@/components/ui/success-message";
import { useSuccessMessage } from "@/components/ui/success-message";
import { ChatSession, Message } from '@/components/chatbot/types'

type FetchedChat = { _id: string; title?: string; messages?: Message[]; createdAt?: string; updatedAt?: string }

const AdminChatViewContent: React.FC = () => {
  const { showMessage, hideMessage, show, message, type } = useSuccessMessage();
  const search = useSearchParams()
  const params = useParams() as { chatId?: string }
  const router = useRouter()
  const chatId = params.chatId
  const userId = search?.get('userId')

  const [chatHistory, setChatHistory] = useState<ChatSession[]>([])
  const [currentChat, setCurrentChat] = useState<ChatSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [reporting, setReporting] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => { 
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth" }) 
  }
  
  useEffect(() => { scrollToBottom() }, [currentChat?.messages])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token || !chatId || !userId) return
    
    setLoading(true)
    fetch(`/api/admin/user/${userId}/chats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        const chats: FetchedChat[] = d.chats || []
        const mappedChats = chats.map(chat => ({
          _id: chat._id,
          title: chat.title || 'Chat',
          messages: chat.messages || [],
          createdAt: new Date(chat.createdAt || Date.now()),
          updatedAt: new Date(chat.updatedAt || Date.now())
        } as ChatSession))
        
        setChatHistory(mappedChats)
        
        const found = mappedChats.find(c => c._id === chatId)
        if (found) {
          setCurrentChat(found)
        }
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false))
  }, [chatId, userId])

  const handleContinueChat = (chat: ChatSession) => {
    router.push(`/admin/chat/${chat._id}?userId=${userId}`)
  }

  const handleReport = () => {
    setShowReportDialog(true)
  }

  const confirmReport = async () => {
    if (!userId || !currentChat) return
    setReporting(true)
    setShowReportDialog(false)
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/user/report', { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }, 
        body: JSON.stringify({ 
          userId, 
          chatId: currentChat._id,
          chatTitle: currentChat.title || 'Untitled Chat',
          reason: 'Inappropriate chat content reported by admin'
        }) 
      })
      
      if (response.ok) {
        showMessage('✅ Report submitted successfully! User has been notified and will receive appropriate guidance.', 'success')
      } else {
        showMessage('❌ Failed to submit report. Please try again or contact technical support.', 'error')
      }
    } catch (e) { 
      console.error(e)
      showMessage('❌ Failed to submit report. Please check your connection and try again.', 'error')
    } finally { 
      setReporting(false) 
    }
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <SuccessMessage
        show={show}
        message={message}
        type={type}
        onClose={hideMessage}
      />
      {/* Admin Sidebar - Simplified */}
      <div className="w-[280px] border-r pt-20 bg-background flex flex-col h-full flex-shrink-0">
        <div className="border-b bg-muted/20 p-4 flex-shrink-0">
          <h3 className="font-semibold text-sm text-foreground">User Chat History</h3>
          <p className="text-xs text-muted-foreground mt-1">Read-only admin view</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {chatHistory.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No chat history</div>
          ) : (
            chatHistory.map((chat) => (
              <div
                key={chat._id}
                className={`group flex items-center p-3 rounded-lg hover:bg-muted/60 transition cursor-pointer border mb-2 ${
                  currentChat?._id === chat._id ? 'bg-primary/10 border-primary/20' : 'bg-card border-border'
                }`}
                onClick={() => handleContinueChat(chat)}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary mr-3">
                  <span className="text-sm font-bold text-primary-foreground">
                    {chat.title?.[0]?.toUpperCase() || "#"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground truncate">{chat.title}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {chat.messages?.length || 0} messages • {new Date(chat.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        {/* Chat Messages - Chatbot Style */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-background to-muted/20 w-full" ref={scrollContainerRef}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading chat...</p>
              </div>
            </div>
          ) : !currentChat ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-muted-foreground">Select a chat from the sidebar to view</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full px-2 sm:px-4">
              <div className="w-full max-w-2xl pb-5 pt-20">
                {currentChat.messages.map((message: Message, index: number) => (
                  <div key={message.id || index} className="mb-6">
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
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 shadow-sm w-full">
          <div className="w-full mx-auto">
            <div className="flex items-center justify-between gap-4 mb-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/admin/users/' + userId)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to User Details
              </Button>
              {currentChat && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReport}
                  disabled={reporting}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <AlertCircle className="h-4 w-4" />
                  {reporting ? 'Reporting...' : 'Report Chat'}
                </Button>
              )}
            </div>
            <div className="text-center text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
              👁️ <strong>Admin View</strong> - Read Only • Cannot send messages or modify chat
              {currentChat && (
                <div className="mt-1 text-xs">
                  {currentChat.title} • {currentChat.messages?.length || 0} messages
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Report Confirmation Dialog */}
      <AlertDialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Report Inappropriate Activity</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to report this chat for inappropriate content? 
              This action will send a professional notification to the user about their inappropriate activity.
            </AlertDialogDescription>
            {currentChat && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm border">
                <div className="font-medium text-foreground mb-2">Chat Information:</div>
                <div className="space-y-1 text-muted-foreground">
                  <div><strong>Chat:</strong> {currentChat.title || 'Untitled Chat'}</div>
                  <div><strong>Messages:</strong> {currentChat.messages?.length || 0}</div>
                </div>
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowReportDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmReport}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Send Report
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function AdminChatViewPage() {
  return (
    <div className="fixed top-16 bottom-0 left-0 right-0 overflow-hidden">
      <TooltipProvider>
        <SidebarProvider>
          <AdminChatViewContent />
        </SidebarProvider>
      </TooltipProvider>
    </div>
  )
}
