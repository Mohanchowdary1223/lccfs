import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Scale, Pencil, Check, X, Copy, Check as CheckIcon } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { TypewriterText } from "./TypewriterText"
import { Message } from "./types"

interface ChatMessageProps {
  message: Message
  index: number
  typingMessageId: string | null
  onTypingComplete: () => void
  onEdit?: (id: string, newText: string) => void
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  index,
  typingMessageId,
  onTypingComplete,
  onEdit,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editingText, setEditingText] = useState(message.text)
  const [showEditIcon, setShowEditIcon] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (message.sender === "user" && !isEditing) {
      const timer = setTimeout(() => setShowEditIcon(true), 2000)
      return () => clearTimeout(timer)
    }
    if (isEditing) setShowEditIcon(false)
  }, [message.id, message.sender, isEditing])

  const handleCopy = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 900)
    }
  }

  const getUserInitial = () => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user")
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          const name = user.name || ""
          return name.charAt(0).toUpperCase() || "U"
        } catch {}
      }
    }
    return "U"
  }

  // True while typewriter is running for this bot message:
  const isBotTyping = message.sender === "bot" && (typingMessageId === message.id || message.isTyping)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`flex w-full ${message.sender === "user" ? "justify-end" : "justify-start"}`}
    >
      <div className={`flex max-w-xs ${
          message.sender === "user"
            ? "flex-row-reverse lg:max-w-md xl:max-w-lg"
            : "flex-row lg:max-w-md xl:max-w-lg"
        }`}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.1 + 0.2, type: "spring", stiffness: 300 }}
          className={`flex-shrink-0 ${message.sender === "user" ? "ml-3" : "mr-3"}`}
        >
          {message.sender === "user" ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <span className="text-lg font-bold text-primary-foreground">{getUserInitial()}</span>
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
              <motion.div
                animate={{
                  rotate: [0, -5, 5, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 3,
                  ease: "easeInOut"
                }}
              >
                <Scale className="h-4 w-4 text-primary" />
              </motion.div>
            </div>
          )}
        </motion.div>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: index * 0.1 + 0.3 }}
          className={`rounded-lg px-4 py-3 relative ${
            message.sender === "user"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {/* Message Content or Edit */}
          {message.sender === "user" && isEditing ? (
            <div>
              <textarea
                className="w-full rounded bg-background text-foreground px-2 py-1 text-sm border border-gray-300"
                value={editingText}
                autoFocus
                onChange={e => setEditingText(e.target.value)}
                rows={2}
                style={{ minHeight: "44px"}}
              />
              <div className="flex mt-1 gap-2">
                <button
                  className="rounded-full bg-green-500 hover:bg-green-600 text-white p-1"
                  onClick={() => {
                    setIsEditing(false)
                    if (onEdit && editingText.trim() && editingText !== message.text) {
                      onEdit(message.id, editingText)
                    }
                  }}
                  title="Save"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  className="rounded-full bg-gray-500 hover:bg-gray-600 text-white p-1"
                  onClick={() => {
                    setEditingText(message.text)
                    setIsEditing(false)
                  }}
                  title="Cancel"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : message.sender === "bot" && isBotTyping ? (
            <TypewriterText
              text={message.isTyping ? "Analyzing your legal query..." : message.text}
              onComplete={() => {
                if (!message.isTyping) onTypingComplete()
              }}
              isActive={!message.isTyping}
            />
          ) : message.sender === "user" ? (
            <div className="group flex items-center">
              <p className="whitespace-pre-wrap text-sm leading-relaxed break-words hyphens-auto flex-1 text-gray-900/80 dark:text-white">
                {message.text}
              </p>
            </div>
          ) : (
            <div className="text-sm leading-relaxed text-gray-900/80 dark:text-white">
              <ReactMarkdown
                components={{
                  strong: ({ children }) => <strong className="font-bold text-primary">{children}</strong>,
                  em: ({ children }) => <em className="italic text-amber-600 dark:text-amber-400">{children}</em>,
                  p: ({ children }) => <p className="mb-2">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                }}
              >
                {message.text}
              </ReactMarkdown>
            </div>
          )}
          {/* Timeline/User/Time, Declaration, and Edit/Copy Icon --- at bottom */}
          <div className="flex flex-col gap-1 mt-2">
            {/* Timeline row */}
            <div className="flex items-center gap-2 opacity-70 text-xs">
              {message.sender === "bot" ? (
                !isBotTyping && (
                  <span className="font-semibold text-primary">Legal Assistant</span>
                )
              ) : (
                <>
                  <span className="font-semibold text-primary">You</span>
                  <span className="text-gray-900/80 dark:text-white">
                    {(() => {
                      const t = typeof message.timestamp === 'string' ? new Date(message.timestamp) : message.timestamp;
                      return t && typeof t.toLocaleTimeString === 'function' ? t.toLocaleTimeString() : '';
                    })()}
                  </span>
                  {showEditIcon && onEdit && !isEditing && (
                    <button
                      className="ml-2 p-1 opacity-75 hover:opacity-100 transition text-gray-900/80 dark:text-white"
                      onClick={() => setIsEditing(true)}
                      title="Edit message"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                </>
              )}
            </div>
            {/* Declaration and copy for bot only, after typing */}
            {message.sender === "bot" && !isBotTyping && (
              <div className="flex items-center gap-2 pt-1 opacity-80 text-[11px] text-gray-900/80 dark:text-white">
                <span>
                  This response is AI-generated, not legal advice.
                </span>
                <button
                  onClick={handleCopy}
                  className={`ml-1 p-1 rounded-full hover:bg-primary/20 transition`}
                  title={copied ? "Copied!" : "Copy full response"}
                  aria-label="Copy message"
                >
                  {copied ? <CheckIcon className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
