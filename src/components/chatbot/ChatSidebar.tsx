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
          className="fixed left-0 top-16 bottom-0 z-50 w-[280px] border-r bg-background transition-all duration-200 ease-in-out"
        >
          <SidebarHeader className="border-b bg-muted/20">
            <SidebarMenu>
              <SidebarMenuItem>
                  {(isMobile ? openMobile : open) ? (
                  <div className="flex w-full items-center justify-between p-3">
                    <span className="font-semibold text-sm text-foreground">Legal Chat</span>
                    <div className="flex items-center gap-2">
                      {!isMobile && (
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <SidebarTrigger className="h-8 w-8 cursor-pointer" />
                        </motion.div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex w-full items-center justify-center p-3">
                    {!isMobile && (
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <SidebarTrigger className="h-8 w-8 cursor-pointer" />
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
                <motion.div whileHover={{ scale: open ? 1.02 : 1.1, x: open ? 4 : 0 }} whileTap={{ scale: 0.98 }}>
                  <SidebarMenuButton 
                    onClick={onNewChat} 
                    className="w-full cursor-pointer justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8"
                    tooltip="New Legal Chat"
                  >
                    <Plus className="size-4 shrink-0" />
                    <span className="group-data-[collapsible=icon]:sr-only">New Legal Chat</span>
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
                  <motion.div whileHover={{ scale: open ? 1.02 : 1.1, x: open ? 4 : 0 }} whileTap={{ scale: 0.98 }}>
                    <SidebarMenuButton 
                      className="w-full text-foreground cursor-pointer justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8" 
                      onClick={handleHistoryClick}
                      tooltip="Chat History"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <History className="size-4 text-foreground shrink-0" />
                          <span className="text-foreground group-data-[collapsible=icon]:sr-only">Recent Chats</span>
                        </div>
                        {open && onDeleteAll && chatHistory && chatHistory.length > 0 && (
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => { e.stopPropagation(); onDeleteAll(); }}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onDeleteAll(); } }}
                            className="text-xs text-destructive hover:underline cursor-pointer select-none"
                          >
                            Delete all
                          </span>
                        )}
                      </div>
                    </SidebarMenuButton>
                  </motion.div>
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
            {/* Chat History List (when sidebar is open) */}
            {(isMobile ? openMobile : open) && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="flex-1 overflow-y-auto px-2 pb-20"
              >
                <SidebarMenu>
                  {chatHistory.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">No chat history yet</div>
                  ) : (
                    chatHistory.map((chat, index) => (
                      <motion.div key={chat._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <SidebarMenuItem>
                          <div className="group flex w-full items-center p-3 rounded-lg hover:bg-muted/60 transition relative shadow-sm bg-card border border-border mb-2" style={{ minHeight: 60 }}>
                            <button
                              onClick={() => onContinueChat(chat)}
                              className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary mr-3 cursor-pointer"
                              tabIndex={-1}
                            >
                              <span className="text-base font-bold text-primary-foreground">
                                {chat.title?.[0]?.toUpperCase() || "#"}
                              </span>
                            </button>
                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onContinueChat(chat)}>
                              <div className="font-semibold text-foreground truncate">{chat.title}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {chat.messages?.length || 0} messages
                              </div>
                            </div>
                            {/* Dropdown should stay open if mouse is inside row or menu */}
                            <div
                              className="relative"
                              onMouseLeave={() => setPopupOpenIndex(popupOpenIndex === index ? null : popupOpenIndex)}
                              onMouseEnter={() => setPopupOpenIndex(index)}
                            >
                              <DropdownMenu open={popupOpenIndex === index} onOpenChange={open => setPopupOpenIndex(open ? index : null)}>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    className="ml-2 flex items-center p-1 rounded hover:bg-primary/10 transition cursor-pointer"
                                    onClick={e => { e.stopPropagation(); setPopupOpenIndex(index) }}
                                    tabIndex={0}
                                    aria-label="More"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-52 z-[2000]"
                                  onMouseLeave={() => setPopupOpenIndex(null)}
                                >
                                  <DropdownMenuItem
                                    onClick={e => { e.stopPropagation(); onContinueChat(chat); setPopupOpenIndex(null); }}
                                  >
                                    <MessageCircle className="mr-2 h-4 w-4" />
                                    Continue Chat
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={e => { e.stopPropagation(); onShareWhatsApp(chat); setPopupOpenIndex(null); }}
                                  >
                                    <FaWhatsapp className="mr-2 h-4 w-4 text-green-600" />
                                    Share on WhatsApp
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={e => { e.stopPropagation(); onShareInstagram(chat); setPopupOpenIndex(null); }}
                                  >
                                    <Instagram className="mr-2 h-4 w-4 text-pink-600" />
                                    Share on Instagram
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={e => { e.stopPropagation(); onShareEmail(chat); setPopupOpenIndex(null); }}
                                  >
                                    <Mail className="mr-2 h-4 w-4 text-blue-600" />
                                    Share via Email
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={e => { e.stopPropagation(); onCopyLink(chat); setPopupOpenIndex(null); }}
                                  >
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy Link
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={e => { e.stopPropagation(); onDeleteChat(chat._id!); setPopupOpenIndex(null); }}
                                    className="text-destructive"
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
      {/* Floating History Popup (when sidebar is collapsed) */}
      <AnimatePresence>
        {showHistoryPopup && !open && !isMobile && (
          <motion.div
            ref={popupRef}
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed left-16 top-[180px] z-[60] w-[280px] max-h-[calc(100vh-200px)] overflow-hidden rounded-lg border bg-background shadow-2xl"
            onMouseEnter={handleMouseEnterPopup}
            onMouseLeave={handleMouseLeavePopup}
          >
            <div className="border-b px-4 py-3 bg-muted/50">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-foreground" />
                <h3 className="font-semibold text-sm text-foreground">Recent Chats</h3>
              </div>
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-260px)] p-2">
              {chatHistory.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No chat history yet
                </div>
              ) : (
                chatHistory.map((chat, index) => (
                  <div
                    key={chat._id}
                    className="group flex items-center p-3 rounded-lg hover:bg-muted/80 transition relative shadow-sm bg-background border border-border"
                    style={{ minHeight: 60 }}
                    onMouseLeave={() => setPopupOpenIndex(popupOpenIndex === index ? null : popupOpenIndex)}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary mr-3">
                      <span className="text-base font-bold text-primary-foreground">
                        {chat.title?.[0]?.toUpperCase() || "#"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { onContinueChat(chat); setShowHistoryPopup(false); }}>
                      <div className="font-semibold text-foreground truncate">{chat.title}</div>
                      <div className="text-xs text-muted-foreground truncate">
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
                          <button
                            className="ml-1 flex items-center p-1 rounded hover:bg-primary/10 transition"
                            onClick={e => { e.stopPropagation(); setPopupOpenIndex(index) }}
                            tabIndex={0}
                            aria-label="More"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-52 z-[2000]"
                          onMouseLeave={() => setPopupOpenIndex(null)}
                        >
                          <DropdownMenuItem
                            onClick={e => { e.stopPropagation(); onContinueChat(chat); setPopupOpenIndex(null); setShowHistoryPopup(false); }}
                          >
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Continue Chat
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={e => { e.stopPropagation(); onShareWhatsApp(chat); setPopupOpenIndex(null); }}
                          >
                            <FaWhatsapp className="mr-2 h-4 w-4 text-green-600" />
                            Share on WhatsApp
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={e => { e.stopPropagation(); onShareInstagram(chat); setPopupOpenIndex(null); }}
                          >
                            <Instagram className="mr-2 h-4 w-4 text-pink-600" />
                            Share on Instagram
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={e => { e.stopPropagation(); onShareEmail(chat); setPopupOpenIndex(null); }}
                          >
                            <Mail className="mr-2 h-4 w-4 text-blue-600" />
                            Share via Email
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={e => { e.stopPropagation(); onCopyLink(chat); setPopupOpenIndex(null); }}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Link
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={e => { e.stopPropagation(); onDeleteChat(chat._id!); setPopupOpenIndex(null); }}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Chat
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
