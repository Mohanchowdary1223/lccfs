/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { motion, AnimatePresence } from "framer-motion"
import { ChatSidebar } from "@/components/chatbot/ChatSidebar"
import { ChatMessage } from "@/components/chatbot/ChatMessage"
import { ChatInput } from "@/components/chatbot/ChatInput"
import { EmptyState } from "@/components/chatbot/EmptyState"
import { ShareButton } from "@/components/chatbot/ShareButton"
import { Message, ChatSession } from "@/components/chatbot/types"
import { getUserIdFromLocalStorage } from "@/components/chatbot/utils"

const LegalComplianceChatBotContent: React.FC = () => {
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([])
  const [currentChat, setCurrentChat] = useState<ChatSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [inputMessage, setInputMessage] = useState("")
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false)
  const [pageDragActive, setPageDragActive] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null)
  const { open, openMobile, isMobile, setOpen, setOpenMobile } = useSidebar()
  const router = useRouter()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<any>(null)

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [currentChat?.messages])

  // Fetch chat history on mount
  useEffect(() => {
    const id = getUserIdFromLocalStorage();
    setUserId(id);
    if (!id) {
      setChatHistory([]);
      setCurrentChat(null);
      return;
    }
    let continueChatId: string | null = null;
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      continueChatId = url.searchParams.get('continue');
    }
    const fetchHistoryAndMaybeContinue = async () => {
      try {
        const res = await fetch("/api/legalbot", {
          headers: { "x-user-id": id },
        });
        const data = await res.json();
        const uniqueHistory = (data.history || []).filter((chat: any, idx: number, arr: any[]) =>
          arr.findIndex((c) => c._id === chat._id) === idx
        );
        setChatHistory(uniqueHistory);

        if (continueChatId) {
          const userCopy = uniqueHistory.find((c: any) => c.originalSharedId === continueChatId);
          if (userCopy) {
            setCurrentChat(userCopy);
            return;
          }
          const found = uniqueHistory.find((c: any) => c._id === continueChatId);
          if (found) {
            setCurrentChat(found);
            return;
          }
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
          } else {
            setCurrentChat(null);
          }
        } else {
          setCurrentChat(null);
        }
      } catch (error) {
        console.error("Failed to fetch chat history:", error);
        setCurrentChat(null);
      }
    };
    fetchHistoryAndMaybeContinue();
  }, []);

  // GLOBAL drag and drop handlers
  const handlePageDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setPageDragActive(true)
  }
  const handlePageDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setPageDragActive(false)
  }
  const handlePageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setPageDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (
        ["pdf", "jpg", "jpeg", "png", "doc", "docx"].includes(file.name.split('.').pop()?.toLowerCase() || "")
      ) {
        if (chatInputRef.current && chatInputRef.current.addExternalFile) {
          chatInputRef.current.addExternalFile(file)
        }
      } else {
        alert("Please select a PDF, DOC/DOCX, or image file.")
      }
    }
  }

  // Share/Sidebar/message handlers (unchanged)...

  const generateShareLink = (chat: ChatSession) => {
    if (!chat._id) return window.location.origin
    return `${window.location.origin}/shared-chat/${chat._id}`
  }

  const generateShareContent = (chat: ChatSession) => {
    const title = chat.title
    const messageCount = chat.messages?.length || 0
    const link = generateShareLink(chat)
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

  const sendMessage = async () => {
    if (!inputMessage.trim() || !userId) return;
    setLoading(true);
    const tempTypingId = `temp-${Date.now()}`;
    const tempTypingMsg: Message = {
      id: tempTypingId,
      text: "Analyzing your legal query...",
      sender: "bot",
      timestamp: new Date(),
      isTyping: true,
    };
    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };
    if (currentChat) {
      setCurrentChat({
        ...currentChat,
        messages: [...currentChat.messages, userMsg, tempTypingMsg],
      });
    } else {
      setCurrentChat({
        title: inputMessage.slice(0, 30) + (inputMessage.length > 30 ? "…" : ""),
        messages: [userMsg, tempTypingMsg],
        createdAt: new Date(),
      });
    }
    setInputMessage("");
    try {
      const chatId = currentChat?._id;
      const title = currentChat?.title || inputMessage.slice(0, 30) + (inputMessage.length > 30 ? "…" : "");
      const res = await fetch("/api/legalbot", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ chatId, message: inputMessage, title }),
      });
      const data = await res.json();
      if (data.chat?.messages) {
        const updatedMessages = data.chat.messages.filter((msg: Message) => msg.id !== tempTypingId);
        const latestMessage = updatedMessages[updatedMessages.length - 1];
        if (latestMessage?.sender === 'bot') setTypingMessageId(latestMessage.id);
        data.chat.messages = updatedMessages;
      }
      if (chatId) {
        setChatHistory((prev) => prev.map((c) => (c._id === chatId ? data.chat : c)));
        setCurrentChat(data.chat);
      } else {
        setChatHistory((prev) => [data.chat, ...prev]);
        setCurrentChat(data.chat);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      if (currentChat) setCurrentChat({
        ...currentChat,
        messages: currentChat.messages.filter((msg) => msg.id !== tempTypingId),
      })
    } finally { setLoading(false) }
  };

  const handleEditUserMessage = async (msgId: string, newText: string) => {
    if (!currentChat || !userId) return
    const messages = currentChat.messages.map((m) => m.id === msgId ? { ...m, text: newText } : m)
    const idx = messages.findIndex((m) => m.id === msgId)
    let nextBotIdx = idx + 1
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
    } catch (e) {}
    setTypingMessageId(null)
  }

  const handleFileUpload = async (file: File) => {
    if (!userId) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);
      const res = await fetch('/api/legalbot/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      const fileMsg: Message = {
        id: Date.now().toString(),
        text: `Uploaded file: ${file.name}`,
        sender: 'user',
        timestamp: new Date(),
      };
      if (currentChat) {
        setCurrentChat({ ...currentChat, messages: [...currentChat.messages, fileMsg] });
      } else {
        setCurrentChat({
          title: file.name,
          messages: [fileMsg],
          createdAt: new Date(),
        });
      }
    } catch (error) {
      alert('Failed to upload file.');
    } finally {
      setLoading(false);
    }
  }

  const handleNewChat = () => {
    setCurrentChat(null)
    setTypingMessageId(null)
    if (isMobile) setOpenMobile(false)
    else setOpen(false)
  }
  const handleContinueChat = (chat: ChatSession) => {
    setCurrentChat(chat)
    setTypingMessageId(null)
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
    } catch (error) { console.error("Failed to delete chat:", error) }
  }

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
              className="fixed top-20 right-4 z-[60] rounded-md bg-green-500 px-4 py-2 text-white shadow-lg"
            >
              Chat deleted successfully!
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
        {isMobile && !openMobile && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="fixed top-20 left-4 z-[60]"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <SidebarTrigger className="h-10 w-10 cursor-pointer border bg-background shadow-md" />
            </motion.div>
          </motion.div>
        )}
        <ChatSidebar
          chatHistory={chatHistory}
          onNewChat={handleNewChat}
          onContinueChat={handleContinueChat}
          onDeleteChat={deleteChat}
          onShareWhatsApp={handleWhatsAppShare}
          onShareEmail={handleEmailShare}
          onShareInstagram={handleInstagramShare}
          onCopyLink={handleCopyLink}
        />
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="fixed top-16 bottom-0 right-0 z-40 flex flex-col border-l bg-background"
          style={{ 
            left: isMobile ? (openMobile ? '280px' : '0') : (open ? '280px' : '64px'),
            transition: 'left 0.2s ease-in-out'
          }}
        >
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
                        onEdit={handleEditUserMessage}
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
