"use client"

import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Plus,
  Trash2,
  History,
  MoreVertical,
  MessageCircle,
  Mail,
  Copy,
  Instagram,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { FaWhatsapp } from "react-icons/fa"
import { ChatSession } from "./types"

interface ChatSidebarProps {
  chatHistory: ChatSession[]
  onNewChat: () => void
  onContinueChat: (chat: ChatSession) => void
  onDeleteChat: (id: string) => void
  onShareWhatsApp: (chat: ChatSession) => void
  onShareEmail: (chat: ChatSession) => void
  onShareInstagram: (chat: ChatSession) => void
  onCopyLink: (chat: ChatSession) => void
  onDeleteAll?: () => void
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  chatHistory,
  onNewChat,
  onContinueChat,
  onDeleteChat,
  onShareWhatsApp,
  onShareEmail,
  onShareInstagram,
  onCopyLink,
  onDeleteAll,
}) => {
  const { open, openMobile, isMobile, setOpen } = useSidebar()
  // copy status not used here; handled in parent ShareButton
  const [showHistoryPopup, setShowHistoryPopup] = useState(false)
  const [popupOpenIndex, setPopupOpenIndex] = useState<number | null>(null)
  const historyButtonRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // copy handled by parent via onCopyLink prop

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
        setPopupOpenIndex(null)
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
        setPopupOpenIndex(null)
      }, 100)
    }
  }
  const handleHistoryClick = () => {
    if (!open && !isMobile) {
      setOpen(true)
      setShowHistoryPopup(false)
    }
  }
  useEffect(() => {
    return () => { if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current) }
  }, [])
  useEffect(() => { if (open) setShowHistoryPopup(false) }, [open])

  return (
    <>
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
                    <span className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-primary" />
                      Legal Chat
                    </span>
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
              {/* New Chat Button */}
              <SidebarMenuItem>
                <motion.div 
                  whileHover={{ scale: open ? 1.02 : 1.1, x: open ? 4 : 0 }} 
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <SidebarMenuButton 
                    onClick={onNewChat} 
                    className="w-full cursor-pointer justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 border border-primary/20 rounded-lg transition-all duration-200 hover:shadow-md"
                    tooltip="Start New Legal Chat"
                  >
                    <Plus className="size-4 shrink-0 text-primary" />
                    <span className="group-data-[collapsible=icon]:sr-only font-medium">New Legal Chat</span>
                  </SidebarMenuButton>
                </motion.div>
              </SidebarMenuItem>
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
                    transition={{ delay: 0.3 }}
                  >
                    <SidebarMenuButton 
                      className="w-full text-foreground cursor-pointer justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 hover:bg-muted/60 rounded-lg transition-all duration-200" 
                      onClick={handleHistoryClick}
                      tooltip="Chat History"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <History className="size-4 text-foreground shrink-0" />
                          <span className="text-foreground group-data-[collapsible=icon]:sr-only font-medium">Recent Chats</span>
                        </div>
                        {open && onDeleteAll && chatHistory && chatHistory.length > 0 && (
                          <motion.span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => { e.stopPropagation(); onDeleteAll(); }}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onDeleteAll(); } }}
                            className="text-xs text-destructive hover:underline cursor-pointer select-none px-2 py-1 rounded hover:bg-destructive/10 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Clear all
                          </motion.span>
                        )}
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
                <SidebarMenu>
                  {chatHistory.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      No chat history yet
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
                          <div className="group flex w-full items-center p-3 rounded-xl hover:bg-gradient-to-r hover:from-muted/40 hover:to-muted/20 transition-all duration-200 relative shadow-sm bg-card/50 backdrop-blur-sm border border-border/50 mb-2 hover:shadow-md hover:border-primary/20" style={{ minHeight: 60 }}>
                            <motion.button
                              onClick={() => onContinueChat(chat)}
                              className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 mr-3 cursor-pointer shadow-md"
                              tabIndex={-1}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <span className="text-sm font-bold text-primary-foreground">
                                {chat.title?.[0]?.toUpperCase() || "#"}
                              </span>
                            </motion.button>
                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onContinueChat(chat)}>
                              <div className="font-semibold text-foreground truncate text-sm">{chat.title}</div>
                              <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" />
                                {chat.messages?.length || 0} messages
                              </div>
                            </div>
                            {/* Enhanced Dropdown for mobile and desktop */}
                            <div
                              className="relative"
                              onMouseLeave={() => setPopupOpenIndex(popupOpenIndex === index ? null : popupOpenIndex)}
                              onMouseEnter={() => setPopupOpenIndex(index)}
                            >
                              <DropdownMenu open={popupOpenIndex === index} onOpenChange={open => setPopupOpenIndex(open ? index : null)}>
                                <DropdownMenuTrigger asChild>
                                  <motion.button
                                    className="ml-2 flex items-center p-2 rounded-full hover:bg-primary/10 transition-all duration-200 cursor-pointer"
                                    onClick={e => { e.stopPropagation(); setPopupOpenIndex(index) }}
                                    tabIndex={0}
                                    aria-label="More options"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </motion.button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-52 z-[2000] bg-background/95 backdrop-blur-md border-border/50 shadow-xl"
                                  onMouseLeave={() => setPopupOpenIndex(null)}
                                >
                                  <DropdownMenuItem
                                    onClick={e => { e.stopPropagation(); onContinueChat(chat); setPopupOpenIndex(null); }}
                                    className="hover:bg-primary/10 transition-colors"
                                  >
                                    <MessageCircle className="mr-2 h-4 w-4" />
                                    Continue Chat
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={e => { e.stopPropagation(); onShareWhatsApp(chat); setPopupOpenIndex(null); }}
                                    className="hover:bg-green-50 hover:text-green-600 transition-colors"
                                  >
                                    <FaWhatsapp className="mr-2 h-4 w-4 text-green-600" />
                                    Share on WhatsApp
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={e => { e.stopPropagation(); onShareInstagram(chat); setPopupOpenIndex(null); }}
                                    className="hover:bg-pink-50 hover:text-pink-600 transition-colors"
                                  >
                                    <Instagram className="mr-2 h-4 w-4 text-pink-600" />
                                    Share on Instagram
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={e => { e.stopPropagation(); onShareEmail(chat); setPopupOpenIndex(null); }}
                                    className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                  >
                                    <Mail className="mr-2 h-4 w-4 text-blue-600" />
                                    Share via Email
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={e => { e.stopPropagation(); onCopyLink(chat); setPopupOpenIndex(null); }}
                                    className="hover:bg-muted/60 transition-colors"
                                  >
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy Link
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={e => { e.stopPropagation(); onDeleteChat(chat._id!); setPopupOpenIndex(null); }}
                                    className="text-destructive hover:bg-red-50 hover:text-red-600 transition-colors"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Chat
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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
                <History className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">Recent Chats</h3>
              </div>
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
                    className="group flex items-center p-3 rounded-xl hover:bg-gradient-to-r hover:from-muted/60 hover:to-muted/40 transition-all duration-200 relative shadow-sm bg-card/50 backdrop-blur-sm border border-border/30 mb-2 hover:shadow-md hover:border-primary/20"
                    style={{ minHeight: 60 }}
                    onMouseLeave={() => setPopupOpenIndex(popupOpenIndex === index ? null : popupOpenIndex)}
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
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { onContinueChat(chat); setShowHistoryPopup(false); }}>
                      <div className="font-semibold text-foreground truncate text-sm">{chat.title}</div>
                      <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {chat.messages?.length || 0} messages
                      </div>
                    </div>
                    <div
                      className="relative"
                      onMouseLeave={() => setPopupOpenIndex(popupOpenIndex === index ? null : popupOpenIndex)}
                      onMouseEnter={() => setPopupOpenIndex(index)}
                    >
                      <DropdownMenu open={popupOpenIndex === index} onOpenChange={open => setPopupOpenIndex(open ? index : null)}>
                        <DropdownMenuTrigger asChild>
                          <motion.button
                            className="ml-1 flex items-center p-2 rounded-full hover:bg-primary/10 transition-all duration-200"
                            onClick={e => { e.stopPropagation(); setPopupOpenIndex(index) }}
                            tabIndex={0}
                            aria-label="More options"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </motion.button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-52 z-[2000] bg-background/95 backdrop-blur-md border-border/50 shadow-xl"
                          onMouseLeave={() => setPopupOpenIndex(null)}
                        >
                          <DropdownMenuItem
                            onClick={e => { e.stopPropagation(); onContinueChat(chat); setPopupOpenIndex(null); setShowHistoryPopup(false); }}
                            className="hover:bg-primary/10 transition-colors"
                          >
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Continue Chat
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={e => { e.stopPropagation(); onShareWhatsApp(chat); setPopupOpenIndex(null); }}
                            className="hover:bg-green-50 hover:text-green-600 transition-colors"
                          >
                            <FaWhatsapp className="mr-2 h-4 w-4 text-green-600" />
                            Share on WhatsApp
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={e => { e.stopPropagation(); onShareInstagram(chat); setPopupOpenIndex(null); }}
                            className="hover:bg-pink-50 hover:text-pink-600 transition-colors"
                          >
                            <Instagram className="mr-2 h-4 w-4 text-pink-600" />
                            Share on Instagram
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={e => { e.stopPropagation(); onShareEmail(chat); setPopupOpenIndex(null); }}
                            className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          >
                            <Mail className="mr-2 h-4 w-4 text-blue-600" />
                            Share via Email
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={e => { e.stopPropagation(); onCopyLink(chat); setPopupOpenIndex(null); }}
                            className="hover:bg-muted/60 transition-colors"
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Link
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={e => { e.stopPropagation(); onDeleteChat(chat._id!); setPopupOpenIndex(null); }}
                            className="text-destructive hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Chat
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
