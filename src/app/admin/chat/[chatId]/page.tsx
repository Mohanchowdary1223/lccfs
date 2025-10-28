"use client"
import React, { useEffect, useState, useRef } from 'react'
import { useSearchParams, useParams, useRouter } from 'next/navigation'
import { SidebarProvider, SidebarTrigger, useSidebar, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { motion, AnimatePresence } from "framer-motion"
import { History, Eye } from 'lucide-react'

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
import { ChatMessageSkeleton } from '@/components/ui/loading-skeletons'
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
  const [showHistoryPopup, setShowHistoryPopup] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const historyButtonRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { open, openMobile, isMobile, setOpen, setOpenMobile } = useSidebar()

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
    if (isMobile) setOpenMobile(false)
    else setOpen(false)
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

  // Hover handlers for floating popup
  const handleMouseEnterHistory = () => {
    if (!open && !isMobile) {
      if (hoverTimeoutRef.current)
        clearTimeout(hoverTimeoutRef.current)
      setShowHistoryPopup(true)
    }
  }
  const handleMouseLeaveHistory = () => {
    if (!open && !isMobile) {
      hoverTimeoutRef.current = setTimeout(() => {
        setShowHistoryPopup(false)
      }, 100)
    }
  }
  const handleMouseEnterPopup = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
  }
  const handleMouseLeavePopup = () => {
    if (!open && !isMobile) {
      hoverTimeoutRef.current = setTimeout(() => {
        setShowHistoryPopup(false)
      }, 100)
    }
  }
  const handleHistoryClick = () => {
    if (!open && !isMobile) {
      setOpen(true)
      setShowHistoryPopup(false)
    }
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => { if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current) }
  }, [])

  // Hide popup when sidebar opens
  useEffect(() => { if (open) setShowHistoryPopup(false) }, [open])

  return (
    <TooltipProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <SuccessMessage
          show={show}
          message={message}
          type={type}
          onClose={hideMessage}
        />

        {/* Admin Chat Sidebar */}
        <motion.div
          initial={{ x: -280 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <Sidebar
            side="left"
            variant="sidebar"
            collapsible="icon"
            className="fixed left-0 top-16 bottom-0 z-50 w-[280px] border-r bg-background/95 backdrop-blur-md transition-all duration-300 ease-out shadow-xl"
          >
            <SidebarHeader className="border-b bg-gradient-to-r from-muted/30 to-muted/10 backdrop-blur-sm">
              <SidebarMenu>
                <SidebarMenuItem>
                  {(isMobile ? openMobile : open) ? (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex w-full items-center justify-between p-3"
                    >
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-sm text-foreground">Admin Chat View</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <SidebarTrigger className="h-8 w-8 cursor-pointer hover:bg-muted/60 rounded-md transition-colors" aria-label="Close sidebar" />
                        </motion.div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex w-full items-center justify-center p-3">
                      {!isMobile && (
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <SidebarTrigger className="h-8 w-8 cursor-pointer hover:bg-muted/60 rounded-md transition-colors" aria-label="Expand sidebar" />
                        </motion.div>
                      )}
                    </div>
                  )}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarHeader>
            <SidebarContent className="flex-1 overflow-hidden">
              <SidebarMenu className="px-2 py-2 space-y-1">
                {/* History Header */}
                <SidebarMenuItem>
                  <div
                    ref={historyButtonRef}
                    onMouseEnter={handleMouseEnterHistory}
                    onMouseLeave={handleMouseLeaveHistory}
                  >
                    <motion.div 
                      whileHover={{ scale: open ? 1.02 : 1.1, x: open ? 4 : 0 }} 
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <SidebarMenuButton 
                        className="w-full text-foreground cursor-pointer justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 hover:bg-muted/60 rounded-lg transition-all duration-200"
                        tooltip="User Chat History"
                        onClick={handleHistoryClick}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <History className="size-4 text-primary shrink-0" />
                            <span className="text-foreground group-data-[collapsible=icon]:sr-only font-medium">User Chat History</span>
                          </div>
                        </div>
                      </SidebarMenuButton>
                    </motion.div>
                  </div>
                </SidebarMenuItem>
              </SidebarMenu>
              {/* Chat History List (when sidebar is open) */}
              {(isMobile ? openMobile : open) && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
                  className="flex-1 overflow-y-auto px-2 pb-20"
                >
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-xs text-muted-foreground px-3 pb-2 bg-muted/20 rounded-md mb-2 p-2"
                  >
                    👁️ Read-only admin view
                  </motion.div>
                  <SidebarMenu>
                    {chatHistory.length === 0 ? (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="py-8 text-center text-sm text-muted-foreground"
                      >
                        No chat history
                      </motion.div>
                    ) : (
                      chatHistory.map((chat, index) => (
                        <motion.div key={chat._id}
                          initial={{ opacity: 0, x: -20, scale: 0.95 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          transition={{ 
                            delay: index * 0.05, 
                            duration: 0.3,
                            ease: "easeOut"
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <SidebarMenuItem>
                            <div className={`group flex w-full items-center p-3 rounded-xl hover:bg-gradient-to-r transition-all duration-200 relative shadow-sm backdrop-blur-sm border mb-2 cursor-pointer ${
                              currentChat?._id === chat._id 
                                ? 'bg-primary/10 border-primary/30 hover:from-primary/15 hover:to-primary/5 shadow-md' 
                                : 'bg-card/50 border-border/50 hover:from-muted/40 hover:to-muted/20 hover:shadow-md hover:border-primary/20'
                            }`} style={{ minHeight: 60 }} onClick={() => handleContinueChat(chat)}>
                              <motion.div 
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 mr-3 shadow-md"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <span className="text-sm font-bold text-primary-foreground">
                                  {chat.title?.[0]?.toUpperCase() || "#"}
                                </span>
                              </motion.div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-foreground truncate text-sm">{chat.title}</div>
                                <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {chat.messages?.length || 0} messages • {new Date(chat.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}, {new Date(chat.createdAt).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false
                                  })}
                                </div>
                              </div>
                            </div>
                          </SidebarMenuItem>
                        </motion.div>
                      ))
                    )}
                  </SidebarMenu>
                </motion.div>
              )}
            </SidebarContent>
          </Sidebar>
        </motion.div>

        {/* Mobile Sidebar Overlay */}
        {isMobile && openMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 top-16 bg-black/20 backdrop-blur-sm z-30"
            onClick={() => setOpenMobile(false)}
          />
        )}

        {/* Main Chat Area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="fixed top-16 bottom-0 right-0 z-40 flex flex-col bg-background"
          style={{
            left: isMobile ? '0' : (open ? '280px' : '64px'),
            transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            borderLeft: isMobile ? 'none' : open ? '1px solid hsl(var(--border))' : '1px solid hsl(var(--border))'
          }}
        >
          {/* Mobile Sidebar Trigger - Only show when sidebar is closed */}
          {isMobile && !openMobile && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="fixed top-20 left-4 z-50"
            >
              <SidebarTrigger 
                className="md:hidden bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl rounded-full p-3 transition-all duration-200 hover:scale-110 active:scale-95 border-2 border-primary-foreground/20"
                aria-label="Open admin chat history"
              />
            </motion.div>
          )}
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-background to-muted/20 w-full" ref={scrollContainerRef}>
            {loading ? (
              <div className="flex flex-col items-center w-full px-2 sm:px-4">
                <div className="w-full max-w-2xl pb-5 pt-5">
                  <ChatMessageSkeleton />
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
                <div className="w-full max-w-2xl pb-5 pt-5">
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
        </motion.div>
        
        {/* Enhanced Floating History Popup (when sidebar is collapsed) */}
        <AnimatePresence>
          {showHistoryPopup && !open && !isMobile && (
            <motion.div
              ref={popupRef}
              initial={{ opacity: 0, x: -20, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, x: 0, scale: 1, y: 0 }}
              exit={{ opacity: 0, x: -20, scale: 0.95, y: 10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="fixed left-16 top-[180px] z-[60] w-[320px] max-h-[calc(100vh-200px)] overflow-hidden rounded-xl border bg-background/95 backdrop-blur-xl shadow-2xl border-border/50"
              onMouseEnter={handleMouseEnterPopup}
              onMouseLeave={handleMouseLeavePopup}
            >
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="border-b px-4 py-3 bg-gradient-to-r from-muted/40 to-muted/20"
              >
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm text-foreground">Admin Chat View</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-1">👁️ User Chat History</p>
              </motion.div>
              <div className="overflow-y-auto max-h-[calc(100vh-260px)] p-3">
                {chatHistory.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    No chat history yet
                  </motion.div>
                ) : (
                  chatHistory.map((chat, index) => (
                    <motion.div
                      key={chat._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 + 0.2 }}
                      className={`group flex items-center p-3 rounded-xl hover:bg-gradient-to-r transition-all duration-200 relative shadow-sm bg-card/50 backdrop-blur-sm border mb-2 cursor-pointer ${
                        currentChat?._id === chat._id 
                          ? 'bg-primary/10 border-primary/30 hover:from-primary/15 hover:to-primary/5 shadow-md' 
                          : 'border-border/30 hover:from-muted/60 hover:to-muted/40 hover:shadow-md hover:border-primary/20'
                      }`}
                      style={{ minHeight: 60 }}
                      onClick={() => { handleContinueChat(chat); setShowHistoryPopup(false); }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <motion.div 
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 mr-3 shadow-md"
                        whileHover={{ scale: 1.1 }}
                      >
                        <span className="text-sm font-bold text-primary-foreground">
                          {chat.title?.[0]?.toUpperCase() || "#"}
                        </span>
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground truncate text-sm">{chat.title}</div>
                        <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {chat.messages?.length || 0} messages • {new Date(chat.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}, {new Date(chat.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                          })}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
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
    </TooltipProvider>
  )
}

export default function AdminChatViewPage() {
  return (
    <div className="fixed top-16 bottom-0 left-0 right-0 overflow-hidden">
      <SidebarProvider defaultOpen={false}>
        <AdminChatViewContent />
      </SidebarProvider>
    </div>
  )
}
