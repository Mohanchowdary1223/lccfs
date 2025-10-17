"use client"

import React, { useState, useEffect, useRef } from "react"
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { motion, AnimatePresence } from "framer-motion"
import { ChatSidebar } from "@/components/chatbot/ChatSidebar"
import { ChatMessage } from "@/components/chatbot/ChatMessage"
import { ChatInput } from "@/components/chatbot/ChatInput"
import { EmptyState } from "@/components/chatbot/EmptyState"
import { ShareButton } from "@/components/chatbot/ShareButton"
import { Message, ChatSession } from "@/components/chatbot/types"
import { useToast } from '@/components/ui/toast'
import { getUserIdFromLocalStorage } from "@/components/chatbot/utils"
import { CheckCircle } from "lucide-react"
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

const LegalComplianceChatBotContent: React.FC = () => {
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([])
  const [currentChat, setCurrentChat] = useState<ChatSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [inputMessage, setInputMessage] = useState("")
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false)
  const [pageDragActive, setPageDragActive] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null)
  // uploadedFile may be local (file present) or already uploaded (id present)
  const [uploadedFile, setUploadedFile] = useState<{ id?: string; file?: File; name: string } | null>(null)
  const toast = useToast()
  const [, setIsFileReading] = useState(false)

  const { open, openMobile, isMobile, setOpen, setOpenMobile } = useSidebar()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<{ addExternalFile?: (f: File) => void } | null>(null)

  const scrollToBottom = () => { if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth" }) }
  useEffect(() => { scrollToBottom() }, [currentChat?.messages])

  // keep a ref to the currentChat so event handlers can access latest value
  const currentChatRef = useRef<ChatSession | null>(null)
  useEffect(() => { currentChatRef.current = currentChat }, [currentChat])

  useEffect(() => {
    const id = getUserIdFromLocalStorage();
    setUserId(id);
    if (!id) { setChatHistory([]); setCurrentChat(null); return; }
    let continueChatId: string | null = null;
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      continueChatId = url.searchParams.get('continue');
    }
    const fetchHistoryAndMaybeContinue = async () => {
      try {
        const res = await fetch("/api/legalbot", { headers: { "x-user-id": id } });
        const data = await res.json();
          const historyArr = (data.history || []) as ChatSession[];
        const uniqueHistory = historyArr.filter((chat, idx, arr) => arr.findIndex(c => c._id === chat._id) === idx)
        setChatHistory(uniqueHistory);

        // If a chat is currently open, update it with the fresh version from the server
        if (currentChatRef.current && currentChatRef.current._id) {
          const updated = uniqueHistory.find(c => c._id === currentChatRef.current!._id)
          if (updated) setCurrentChat(updated)
        }

        if (continueChatId) {
              const userCopy = uniqueHistory.find((c: ChatSession) => {
                  const maybe = c as unknown as Record<string, unknown>;
                  return typeof maybe['originalSharedId'] === 'string' && maybe['originalSharedId'] === continueChatId;
              });
          if (userCopy) { setCurrentChat(userCopy); return; }
            const found = uniqueHistory.find((c: ChatSession) => c._id === continueChatId);
          if (found) { setCurrentChat(found); return; }
          const sharedRes = await fetch(`/api/legalbot?id=${continueChatId}&shared=1`);
          const sharedData = await sharedRes.json();
          if (sharedData.chat) {
            const copyRes = await fetch('/api/legalbot/copy', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-user-id': id,
              },
              body: JSON.stringify({ chatId: continueChatId })
            });
            const copyData = await copyRes.json();
            if (copyData.chat) {
              setCurrentChat(copyData.chat);
              setChatHistory((prev) => {
                const chats = [copyData.chat, ...prev];
                return chats.filter((chat, idx, arr) => arr.findIndex((c) => c._id === chat._id) === idx);
              });
            } else {
              setCurrentChat(sharedData.chat);
            }
          } else { setCurrentChat(null); }
        } else { setCurrentChat(null); }
        return uniqueHistory
      } catch {
          console.error("Failed to fetch chat history")
          setCurrentChat(null);
          return [] as ChatSession[]
        }
    };
    fetchHistoryAndMaybeContinue();

    // If another page performed a bulk files-clear and redirected here, it may have set localStorage marker.
    (async () => {
      try {
        const marker = localStorage.getItem('files-cleared')
        if (marker) {
          // fetch fresh history, then mark messages on the active chat
          const fresh = (await fetchHistoryAndMaybeContinue()) || []
          try {
            setCurrentChat(prev => {
              // try to find the matching chat from fresh history using previous currentChat id if available
              const currentId = prev?._id
              let source = prev
              if (currentId) {
                const found = fresh.find(c => c._id === currentId)
                if (found) source = found
              }
              if (!source) return prev
              const nextMsgs = (source.messages || []).map(m => (m.fileId || m.fileName) ? { ...m, fileDeleted: true } : m)
              return { ...source, messages: nextMsgs }
            })
          } catch {}
          try { localStorage.removeItem('files-cleared') } catch {}
        }
      } catch {
        // ignore
      }
    })()

    // Listen for file deletion events from other parts of the app (storage and custom event)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'file-deleted') {
        fetchHistoryAndMaybeContinue()
      }
    }
    const onFileDeleted = () => {
      fetchHistoryAndMaybeContinue()
    }
    const onFilesCleared = () => {
      // when ActivityTab clears all files, refresh history so message file states update
      fetchHistoryAndMaybeContinue()
      // Also mark existing messages in currentChat as deleted if they referenced a file
      try {
        setCurrentChat(prev => {
          if (!prev) return prev
          const nextMsgs = (prev.messages || []).map(m => (m.fileId || m.fileName) ? { ...m, fileDeleted: true } : m)
          return { ...prev, messages: nextMsgs }
        })
      } catch {
        // swallow
      }
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('file-deleted', onFileDeleted)
    window.addEventListener('files-cleared', onFilesCleared)
    window.addEventListener('history-cleared', () => {
      // refresh history and current chat
      fetchHistoryAndMaybeContinue()
    })
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('file-deleted', onFileDeleted)
      window.removeEventListener('files-cleared', onFilesCleared)
    }
  }, []);

  // Drag & drop support
  const handlePageDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setPageDragActive(true) }
  const handlePageDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setPageDragActive(false) }
  const handlePageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setPageDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (["pdf", "jpg", "jpeg", "png", "doc", "docx"].includes(file.name.split('.').pop()?.toLowerCase() || "")) {
        if (chatInputRef.current && chatInputRef.current.addExternalFile) chatInputRef.current.addExternalFile(file);
      } else {
        alert("Please select a PDF, DOC/DOCX, or image file.")
      }
    }
  }

  // Share/Sidebar/message handlers...

  const generateShareLink = (chat: ChatSession) => {
    if (!chat._id) return window.location.origin
    return `${window.location.origin}/shared-chat/${chat._id}`
  }
  const generateShareContent = (chat: ChatSession) => {
    const title = chat.title; const messageCount = chat.messages?.length || 0; const link = generateShareLink(chat)
    return `Check out this legal compliance conversation: "${title}" - ${messageCount} messages about startup legal matters.\n\nView the chat: ${link}`
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
    navigator.clipboard.writeText(shareText).then(() => {
      alert('Content copied! You can now paste it on Instagram.')
    })
  }
  const handleCopyLink = (chat: ChatSession) => {
    const link = generateShareLink(chat)
    navigator.clipboard.writeText(link)
  }

  // Main SEND LOGIC now supports fileId
  const sendMessage = async () => {
    if ((!inputMessage.trim() && !uploadedFile) || !userId) return
    setLoading(true)
    
    // Set file reading state if there's a file
    if (uploadedFile) {
      setIsFileReading(true)
    }
    
    const tempTypingId = `temp-${Date.now()}`
    const tempTypingMsg: Message = {
      id: tempTypingId,
      text: uploadedFile ? "Reading and analyzing your file..." : "Analyzing your legal query...",
      sender: "bot",
      timestamp: new Date(),
      isTyping: true,
      isFileReading: uploadedFile ? true : false,
    }
    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputMessage || (uploadedFile ? `Analyze this file: ${uploadedFile.name}` : ""),
      sender: "user",
      timestamp: new Date(),
      fileId: uploadedFile?.id,
      fileName: uploadedFile?.name,
    }

    if (currentChat) {
      setCurrentChat({
        ...currentChat,
        messages: [...currentChat.messages, userMsg, tempTypingMsg],
      })
    } else {
      setCurrentChat({
        title: inputMessage.slice(0, 30) + (inputMessage.length > 30 ? "…" : ""),
        messages: [userMsg, tempTypingMsg],
        createdAt: new Date(),
      })
    }
    setInputMessage("")
    try {
      // If there's a local file (not yet uploaded), upload it first
      let fileIdToSend = uploadedFile?.id
      if (uploadedFile?.file && !uploadedFile.id) {
        try {
          const fd = new FormData()
          fd.append('file', uploadedFile.file)
          fd.append('userId', userId)
          const uploadRes = await fetch('/api/legalbot/upload', { method: 'POST', body: fd })
          const uploadData = await uploadRes.json()
          if (!uploadRes.ok || !uploadData.fileId) {
            throw new Error(uploadData.error || 'Upload failed')
          }
          fileIdToSend = uploadData.fileId
          // update uploadedFile id so preview/other logic uses it
          setUploadedFile({ id: uploadData.fileId, name: uploadData.originalFileName || uploadedFile.name })
        } catch (err) {
          console.error('Upload error', err)
          toast.push('Failed to upload file. Please try again.', 'error')
          setLoading(false)
          return
        }
      }

      const chatId = currentChat?._id
      const res = await fetch("/api/legalbot", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({
          chatId,
          message: inputMessage,
          title: currentChat?.title || (inputMessage || uploadedFile?.name || "New Chat").slice(0, 30) + ((inputMessage || uploadedFile?.name || "").length > 30 ? "…" : ""),
          fileId: fileIdToSend,
          fileName: uploadedFile?.name,
        }),
      })
      const data = await res.json()
      if (data.chat?.messages) {
        const updatedMessages = data.chat.messages.filter((msg: Message) => msg.id !== tempTypingId)
        const latestMessage = updatedMessages[updatedMessages.length - 1]
        if (latestMessage?.sender === 'bot') setTypingMessageId(latestMessage.id)
        data.chat.messages = updatedMessages
      }
  setUploadedFile(null) // Clear file after sending
      setIsFileReading(false) // Clear file reading state
      if (chatId) {
        setChatHistory((prev) => prev.map((c) => (c._id === chatId ? data.chat : c)))
        setCurrentChat(data.chat)
      } else {
        setChatHistory((prev) => [data.chat, ...prev])
        setCurrentChat(data.chat)
      }
    } catch {
      if (currentChat) setCurrentChat({
        ...currentChat,
        messages: currentChat.messages.filter((msg) => msg.id !== tempTypingId),
      })
      setIsFileReading(false) // Clear file reading state on error too
    } finally { setLoading(false) }
  }

  // --- File Upload Handler ---
  const handleFileUpload = async (file: File) => {
    // Store locally until user clicks Send; do not change UI
    setUploadedFile({ file, name: file.name })
  }

  // --- EDIT USER MESSAGE ---
  const handleEditUserMessage = async (msgId: string, newText: string) => {
    if (!currentChat || !userId) return
    const messages = currentChat.messages.map((m) => m.id === msgId ? { ...m, text: newText } : m)
    const idx = messages.findIndex((m) => m.id === msgId)
  const nextBotIdx = idx + 1
    let filtered = messages
    if (filtered[nextBotIdx] && filtered[nextBotIdx].sender === "bot") {
      filtered = filtered.filter((_, i) => i !== nextBotIdx)
    }
    const tempTypingId = `typing-edited-${msgId}-${Date.now()}`
    const tempTypingMsg: Message = {
      id: tempTypingId,
      text: "Analyzing your legal query...",
      sender: "bot",
      timestamp: new Date(),
      isTyping: true,
    }
    const newMessages = [
      ...filtered.slice(0, idx + 1),
      tempTypingMsg,
      ...filtered.slice(idx + 1)
    ]
    setCurrentChat({ ...currentChat, messages: newMessages })
    setTypingMessageId(tempTypingMsg.id)
    try {
      const res = await fetch("/api/legalbot", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ chatId: currentChat._id, message: newText, title: currentChat.title }),
      })
      const data = await res.json()
      if (data.chat?.messages) {
        const updatedMsgs = [
          ...filtered.slice(0, idx + 1),
          ...data.chat.messages.slice(-1),
          ...filtered.slice(idx + 1)
        ]
        setCurrentChat((prev) =>
          prev ? { ...prev, messages: updatedMsgs } : null
        )
      }
  } catch {
  }
    setTypingMessageId(null)
  }

  const handleNewChat = () => {
    setCurrentChat(null)
    setTypingMessageId(null)
    setUploadedFile(null)
    if (isMobile) setOpenMobile(false)
    else setOpen(false)
  }
  const handleContinueChat = (chat: ChatSession) => {
    setCurrentChat(chat)
    setTypingMessageId(null)
    setUploadedFile(null)
    if (isMobile) setOpenMobile(false)
    else setOpen(false)
  }
  const deleteChat = async (id: string) => {
    if (!userId) return
    try {
      await fetch(`/api/legalbot?id=${id}`, { method: "DELETE", headers: { "x-user-id": userId } })
      setChatHistory((prev) => prev.filter((c) => c._id !== id))
      if (currentChat && currentChat._id === id) {
        const remaining = chatHistory.filter((c) => c._id !== id)
        setCurrentChat(remaining[0] ?? null)
      }
      setShowDeleteSuccess(true)
      setTimeout(() => setShowDeleteSuccess(false), 3000)
    } catch {}
  }

  const deleteAllChats = async () => {
    // now handled via confirmation dialog
    if (!userId) return
    setDeleteAllOpen(true)
  }

  const [deleteAllOpen, setDeleteAllOpen] = useState(false)
  const performDeleteAllChats = async () => {
    setDeleteAllOpen(false)
    if (!userId) return
    try {
      const res = await fetch('/api/legalbot/clear?scope=chats', { method: 'POST', headers: { 'x-user-id': userId } })
      const data = await res.json()
      if (res.ok && data.success) {
        setChatHistory([])
        setCurrentChat(null)
        toast.push('All chats deleted', 'success', <CheckCircle className="w-5 h-5 text-white" />)
        window.dispatchEvent(new CustomEvent('history-cleared'))
      }
    } catch (err) {
      console.error('Failed to delete all chats', err)
      toast.push('Failed to delete chats', 'error')
    }
  }

  // file-only deletion is handled from ActivityTab (Files button)

  return (
    <TooltipProvider>
      <div
        className="flex h-screen w-full overflow-hidden"
        onDragOver={handlePageDragOver}
        onDragEnter={handlePageDragOver}
        onDragLeave={handlePageDragLeave}
        onDrop={handlePageDrop}
      >
<AnimatePresence>
  {showDeleteSuccess && (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="fixed top-20 right-4 z-[60] rounded-md bg-green-500 px-4 py-2 text-white shadow-lg flex items-center gap-2"
    >
      <CheckCircle className="w-5 h-5 text-white" />
      <span>Chat deleted successfully!</span>
    </motion.div>
  )}
</AnimatePresence>

        <ShareButton
          currentChat={currentChat}
          onShareWhatsApp={() => currentChat && handleWhatsAppShare(currentChat)}
          onShareEmail={() => currentChat && handleEmailShare(currentChat)}
          onShareInstagram={() => currentChat && handleInstagramShare(currentChat)}
          onCopyLink={() => currentChat && handleCopyLink(currentChat)}
        />
        <ChatSidebar
          chatHistory={chatHistory}
          onNewChat={handleNewChat}
          onContinueChat={handleContinueChat}
          onDeleteChat={deleteChat}
          onShareWhatsApp={handleWhatsAppShare}
          onShareEmail={handleEmailShare}
          onShareInstagram={handleInstagramShare}
          onCopyLink={handleCopyLink}
          onDeleteAll={deleteAllChats}
        />
        {/* Delete all confirmation dialog from sidebar */}
        <AlertDialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete all chats</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all your chat history. This action cannot be undone. Are you sure?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteAllOpen(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={performDeleteAllChats} className="ml-2">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="fixed top-16 bottom-0 right-0 z-40 flex flex-col bg-background"
          style={{
            left: isMobile ? (openMobile ? '280px' : '0') : (open ? '280px' : '64px'),
            transition: 'left 0.2s ease-in-out',
            borderLeft: isMobile ? 'none' : open ? '1px solid hsl(var(--border))' : '1px solid hsl(var(--border))'
          }}
        >
          {/* Mobile Sidebar Trigger */}
          {isMobile && !openMobile && (
            <div className="absolute top-4 left-4 z-50">
              <SidebarTrigger 
                className="md:hidden bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg rounded-md p-2"
                aria-label="Open sidebar"
              />
            </div>
          )}
          <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
            <div className="flex flex-col items-center w-full px-2 sm:px-4 h-full">
              {currentChat ? (
                <div className="w-full max-w-2xl pb-5 pt-5">
                  {currentChat.messages?.map((msg, index) => (
                    <div key={msg.id} className="mb-6">
                      <ChatMessage
                        message={msg}
                        index={index}
                        typingMessageId={typingMessageId}
                        onTypingComplete={() => setTypingMessageId(null)}
                        onEdit={handleEditUserMessage}      // ← THIS FIXES IT!
                      />
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <EmptyState />
              )}
            </div>
          </div>
          <ChatInput
            ref={chatInputRef}
            inputMessage={inputMessage}
            loading={loading}
            dragActive={pageDragActive}
            onInputChange={setInputMessage}
            onSendMessage={sendMessage}
            onFileUpload={handleFileUpload}
            locked={!!typingMessageId || loading}
            uploadedFile={uploadedFile}
            onRemoveFile={() => setUploadedFile(null)}
          />
        </motion.div>
      </div>
    </TooltipProvider>
  )
}

const LegalComplianceChatBot: React.FC = () => (
  <SidebarProvider defaultOpen={false}>
    <LegalComplianceChatBotContent />
  </SidebarProvider>
)

export default LegalComplianceChatBot
