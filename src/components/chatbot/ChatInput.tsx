/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, forwardRef, useImperativeHandle } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Paperclip, FileImage, FileText, File, X } from "lucide-react"

interface ChatInputProps {
  inputMessage: string
  loading: boolean
  dragActive: boolean   // "global" drag state from page
  locked?: boolean      // <--- disables all input/UI while bot typing
  onInputChange: (value: string) => void
  onSendMessage: () => void
  onFileUpload: (file: File) => void
}

export const ChatInput = forwardRef<any, ChatInputProps>(({
  inputMessage,
  loading,
  dragActive,
  locked,
  onInputChange,
  onSendMessage,
  onFileUpload,
}, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const fileInputPdf = useRef<HTMLInputElement>(null)
  const fileInputImage = useRef<HTMLInputElement>(null)
  const fileInputDoc = useRef<HTMLInputElement>(null)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [dragOverInput, setDragOverInput] = useState(false)

  // Allow parent to add files from global page drop
  useImperativeHandle(ref, () => ({
    addExternalFile: (file: File) => {
      setAttachedFiles(files => [...files, file])
    }
  }))

  // Handle textarea input
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(e.target.value)
    adjustTextareaHeight(e.target)
  }
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = "auto"
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px"
  }
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((loading || locked)) return
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSend()
      if (textareaRef.current) textareaRef.current.style.height = "auto"
    }
  }
  const onSend = () => {
    if (locked) return
    if (attachedFiles.length) {
      attachedFiles.forEach(f => onFileUpload(f))
      setAttachedFiles([])
    }
    onSendMessage()
  }

  // File upload modal and chips
  const triggerFileSelect = (type: "pdf" | "image" | "doc") => {
    if (locked || loading) return
    if (type === "pdf") fileInputPdf.current?.click()
    else if (type === "image") fileInputImage.current?.click()
    else if (type === "doc") fileInputDoc.current?.click()
  }
  const validateFile = (file: File, acceptTypes: string[]) => {
    const ext = file.name.split(".").pop()?.toLowerCase()
    return !!ext && acceptTypes.includes(ext)
  }
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    acceptTypes: string[]
  ) => {
    const file = e.target.files?.[0]
    if (file && validateFile(file, acceptTypes)) {
      setAttachedFiles(files => [...files, file])
      setModalOpen(false)
    } else if (file) {
      alert("Please select a valid file type.")
    }
    e.target.value = ""
  }
  const removeFile = (idx: number) => {
    if (locked) return
    setAttachedFiles(files => files.filter((_, i) => i !== idx))
  }

  // Drag/Drop on textarea itself
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOverInput(true)
  }
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOverInput(false)
  }
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOverInput(false)
    if (locked) return
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (
        ["pdf", "jpg", "jpeg", "png", "doc", "docx"].includes(ext || "")
      ) {
        setAttachedFiles(files => [...files, file])
      } else {
        alert("Please select a PDF, DOC/DOCX, or image file.")
      }
    }
  }

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="border-t bg-background p-4"
    >
      <div className="flex space-x-2 max-w-4xl mx-auto items-end">
        <div
          className="flex-1 flex flex-col items-stretch gap-2 relative"
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* File chips */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-1">
              {attachedFiles.map((f, i) => (
                <div key={i}
                  className="flex items-center bg-secondary pr-2 pl-2 py-1 rounded text-xs font-medium mr-1 mb-1
                  border shadow-sm max-w-[180px] overflow-hidden">
                  {f.type.startsWith("image")
                    ? <FileImage className="w-4 h-4 mr-1 text-primary" />
                    : f.type === "application/pdf"
                    ? <FileText className="w-4 h-4 mr-1 text-primary" />
                    : <File className="w-4 h-4 mr-1 text-primary" />}
                  <span className="truncate max-w-[100px]">{f.name}</span>
                  <button onClick={() => removeFile(i)} title="Remove"
                    className="ml-1 flex-shrink-0 hover:text-red-600"
                    disabled={locked}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            {/* Drag overlay on textarea */}
            <div className="relative flex-1">
              <Textarea
                ref={textareaRef}
                placeholder="Ask about legal compliance, contracts, incorporation…"
                value={inputMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={loading || locked}
                className="min-h-[40px] max-h-[120px] resize-none overflow-y-auto"
                rows={1}
                style={{ background: undefined }}
              />
              {/* Show overlay if dragging input or page */}
              <AnimatePresence>
                {(dragOverInput || dragActive) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center
                      border-2 border-dashed border-primary bg-primary/10 rounded"
                  >
                    <span className="text-primary font-semibold text-base">
                      Drop file to add as attachment
                    </span>
                    <span className="text-xs text-muted-foreground">(PDF, DOC, DOCX, JPG, PNG)</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* Upload buttons, hidden inputs */}
            <input ref={fileInputPdf} type="file" accept=".pdf" style={{ display: "none" }}
              onChange={e => handleFileChange(e, ["pdf"])} />
            <input ref={fileInputImage} type="file" accept="image/png,image/jpeg,image/jpg" style={{ display: "none" }}
              onChange={e => handleFileChange(e, ["jpg", "jpeg", "png"])} />
            <input ref={fileInputDoc} type="file" accept=".doc,.docx" style={{ display: "none" }}
              onChange={e => handleFileChange(e, ["doc", "docx"])} />
            <Button
              type="button"
              variant="outline"
              className="h-10 w-10 p-0 flex-shrink-0"
              title="Upload file"
              onClick={() => setModalOpen(true)}
              disabled={loading || locked}
            >
              <Paperclip className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={onSend}
            disabled={loading || locked || (!inputMessage.trim() && attachedFiles.length === 0)}
            className="cursor-pointer h-10 w-10 p-0 flex-shrink-0"
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="h-4 w-4 rounded-full border-2 border-muted border-t-primary"
              />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </motion.div>
      </div>
      {/* Upload Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-background shadow-xl p-8 rounded-lg border w-[480px] max-w-lg flex flex-col items-center"
              onClick={e => e.stopPropagation()}
              tabIndex={0}
            >
              <button
                className="absolute top-3 right-3 rounded-full bg-muted p-1 hover:bg-red-500 hover:text-white focus:outline-none"
                onClick={() => setModalOpen(false)}
                tabIndex={1}
                disabled={locked}
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-full flex flex-col gap-4 items-center justify-center">
                <span className="font-bold text-lg mb-2 text-foreground">Upload File</span>
                <div className="flex flex-col gap-3 w-full">
                  <Button className="w-full justify-start" variant="outline" onClick={() => triggerFileSelect("pdf")} disabled={locked}>
                    <FileText className="mr-2 w-5 h-5 text-primary" /> Upload PDF
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => triggerFileSelect("image")} disabled={locked}>
                    <FileImage className="mr-2 w-5 h-5 text-primary" /> Upload Image (JPG/PNG)
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => triggerFileSelect("doc")} disabled={locked}>
                    <File className="mr-2 w-5 h-5 text-primary" /> Upload Doc (DOC/DOCX)
                  </Button>
                </div>
                <div
                  className={`
                    w-full h-20 mt-3 bg-primary/10 flex flex-col items-center justify-center relative transition
                    border-2 border-dashed border-primary rounded-lg
                  `}
                >
                  <span className="text-[18px] text-primary font-semibold pointer-events-none">
                    --- Drag & Drop PDF, Image, or DOC here ---
                  </span>
                  <span className="text-xs text-muted-foreground pointer-events-none">
                    (PDF, DOC, DOCX, JPG, PNG allowed)
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
})
ChatInput.displayName = "ChatInput"
