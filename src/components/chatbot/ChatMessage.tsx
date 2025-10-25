import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Scale, Pencil, Check, X, Copy, Check as CheckIcon, Paperclip, Eye } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { TypewriterText } from "./TypewriterText"
import { FilePreview } from "./FilePreview"
import { Message } from "./types"

interface ChatMessageProps {
  message: Message
  index: number
  typingMessageId: string | null
  onTypingComplete: () => void
  onEdit?: (id: string, newText: string) => void
  readOnly?: boolean
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  index,
  typingMessageId,
  onTypingComplete,
  onEdit,
  readOnly = false,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editingText, setEditingText] = useState(message.text)
  const [showEditIcon, setShowEditIcon] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showFilePreview, setShowFilePreview] = useState(false)

  const isFileMsg = message.sender === "user" && (message.fileId || message.fileName || message.fileDeleted)
  const isBotTyping = message.sender === "bot" && (typingMessageId === message.id || message.isTyping)
  const isFileReading = message.isFileReading && isBotTyping

  useEffect(() => {
    if (message.sender === "user" && !isEditing) {
      if (isFileMsg) {
        const hasEditableText = message.text &&
          !message.text.startsWith("Analyze this file:") &&
          message.text !== "File uploaded for analysis"
        if (hasEditableText) {
          const timer = setTimeout(() => setShowEditIcon(true), 2000)
          return () => clearTimeout(timer)
        }
      } else {
        const timer = setTimeout(() => setShowEditIcon(true), 2000)
        return () => clearTimeout(timer)
      }
    }
    setShowEditIcon(false)
  }, [message.id, message.sender, isEditing, isFileMsg, message.text])

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

  const AnimatedDots = () => (
    <motion.span
      className="inline-block"
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ repeat: Infinity, duration: 1, ease: "linear", delay: 0.2 }}
    >...</motion.span>
  )

  const FileShimmerBar = () => (
    <div className="relative w-24 h-2 rounded bg-blue-100 dark:bg-blue-900 overflow-hidden mx-2">
      <motion.div
        className="absolute left-0 top-0 h-full w-1/3 bg-gradient-to-r from-blue-300 to-blue-600/80 dark:from-blue-600 dark:to-blue-400 opacity-60"
        initial={{ x: "-75%" }}
        animate={{ x: "140%" }}
        transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
      />
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
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
          transition={{ delay: index * 0.08 + 0.2, type: "spring", stiffness: 300 }}
          className={`flex-shrink-0 ${message.sender === "user" ? "ml-3" : "mr-3"}`}
        >
          {message.sender === "user" ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <span className="text-lg font-bold text-primary-foreground">{getUserInitial()}</span>
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
              {isFileReading ? (
                <motion.div
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.3,
                    ease: "easeInOut"
                  }}
                  className="flex items-center justify-center"
                >
                  <Paperclip className="h-5 w-5 text-blue-600" />
                </motion.div>
              ) : (
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
              )}
            </div>
          )}
        </motion.div>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: index * 0.08 + 0.3 }}
          className={`rounded-lg px-4 py-3 relative ${
            message.sender === "user"
              ? "bg-primary text-primary-foreground"
              : "bg-muted dark:bg-gray-800 text-muted-foreground dark:text-gray-200"
          }`}
        >
          {/* Editing */}
          {message.sender === "user" && isEditing ? (
            <div>
              <textarea
                className="w-full rounded bg-background dark:bg-gray-900 text-foreground dark:text-gray-100 px-2 py-1 text-sm border border-gray-300 dark:border-gray-700"
                value={editingText}
                autoFocus
                onChange={e => setEditingText(e.target.value)}
                rows={2}
                style={{ minHeight: "44px"}}
              />
              <div className="flex mt-1 gap-2">
                <button
                  className="rounded-full bg-green-500 hover:bg-green-600 text-white p-1 cursor-pointer"
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
                  className="rounded-full bg-gray-500 hover:bg-gray-600 text-white p-1 cursor-pointer"
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
          ) : isFileMsg ? (
            <div className="space-y-2">
              {/* File Display */}
              {message.fileDeleted ? (
                <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-md text-sm text-gray-600 dark:text-gray-300">
                  <Paperclip className="h-4 w-4 text-gray-500" />
                  <span className="font-semibold flex-1">This file was deleted</span>
                </div>
              ) : readOnly ? (
                <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-md text-sm text-gray-600 dark:text-gray-300">
                  <Paperclip className="h-4 w-4 text-gray-500" />
                  <span className="font-semibold flex-1">File is secure</span>
                </div>
              ) : (
                <div 
                  className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/40 rounded-md cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors group"
                  onClick={() => setShowFilePreview(true)}
                >
                  <Paperclip className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-blue-700 dark:text-blue-300 flex-1">
                    {message.fileName || "Uploaded File"}
                  </span>
                  <Eye className="h-4 w-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}

              {/* Editable Text Message */}
              {message.text && !message.text.startsWith("Analyze this file:") && message.text !== "File uploaded for analysis" && (
                isEditing ? (
                  <div>
                    <textarea
                      className="w-full rounded bg-background dark:bg-gray-900 text-foreground dark:text-gray-100 px-2 py-1 text-sm border border-gray-300 dark:border-gray-700"
                      value={editingText}
                      autoFocus
                      onChange={e => setEditingText(e.target.value)}
                      rows={2}
                      style={{ minHeight: "44px"}}
                    />
                    <div className="flex mt-1 gap-2">
                      <button
                        className="rounded-full bg-green-500 hover:bg-green-600 text-white p-1 cursor-pointer"
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
                        className="rounded-full bg-gray-500 hover:bg-gray-600 text-white p-1 cursor-pointer"
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
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed break-words hyphens-auto text-gray-900/80 dark:text-white">
                    {message.text}
                  </p>
                )
              )}
              
              {/* File Preview Modal */}
              {message.fileId && (
                <FilePreview
                  isOpen={showFilePreview}
                  onClose={() => setShowFilePreview(false)}
                  fileId={message.fileId}
                  fileName={message.fileName || "Unknown File"}
                />
              )}
            </div>
          ) : message.sender === "bot" && isBotTyping ? (
            <div>
              {isFileReading && (
                <div className="flex items-center gap-3 mb-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.6, ease: "linear" }}
                    className="p-1 rounded-full bg-blue-50 dark:bg-blue-900"
                  >
                    <Paperclip className="h-5 w-5 text-blue-600" />
                  </motion.div>
                  <span className="text-primary font-semibold text-base animate-pulse">
                    Reading file <AnimatedDots />
                  </span>
                  <FileShimmerBar />
                </div>
              )}
              <TypewriterText
                text={message.isTyping ? (isFileReading ? "Reading and analyzing your file..." : "Analyzing your legal query...") : message.text}
                onComplete={() => {
                  if (!message.isTyping) onTypingComplete()
                }}
                isActive={!message.isTyping}
              />
            </div>
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
                      return t && !isNaN(t.getTime()) ? t.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      }) : '';
                    })()}
                  </span>
                  {showEditIcon && onEdit && !isEditing && (
                    <button
                      className="ml-2 p-1 opacity-75 hover:opacity-100 transition text-gray-900/80 dark:text-white cursor-pointer"
                      onClick={() => setIsEditing(true)}
                      title={isFileMsg ? "Edit message text" : "Edit message"}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                </>
              )}
            </div>
                {message.sender === "bot" && !isBotTyping && (
              <div className="flex items-center gap-2 pt-1 opacity-80 text-[11px] text-gray-900/80 dark:text-white">
                <span>
                  This response is AI-generated, not legal advice.
                </span>
                {!readOnly && (
                  <button
                    onClick={handleCopy}
                    className={`ml-1 p-1 rounded-full hover:bg-primary/20 transition cursor-pointer`}
                    title={copied ? "Copied!" : "Copy full response"}
                    aria-label="Copy message"
                  >
                    {copied ? <CheckIcon className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
