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
  uploadedFile: { id?: string; file?: File; name: string } | null
  onInputChange: (value: string) => void
  onSendMessage: () => void
  onFileUpload: (file: File) => void
  onRemoveFile: () => void
  onSuccess?: (message: string, type?: 'success' | 'error') => void;
}


export const ChatInput = forwardRef<any, ChatInputProps>(({
  inputMessage,
  loading,
  dragActive,
  locked,
  uploadedFile,
  onInputChange,
  onSendMessage,
  onFileUpload,
  onRemoveFile,
  onSuccess,
}, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const fileInputPdf = useRef<HTMLInputElement>(null)
  const fileInputImage = useRef<HTMLInputElement>(null)
  const fileInputDoc = useRef<HTMLInputElement>(null)
  const [dragOverInput, setDragOverInput] = useState(false)


  // Allow parent to add files from global page drop
  useImperativeHandle(ref, () => ({
    addExternalFile: (file: File) => {
      onFileUpload(file)
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
      onFileUpload(file)
      setModalOpen(false)
    } else if (file) {
      if (onSuccess) {
        onSuccess("Please select a valid file type.", 'error')
      } else {
        alert("Please select a valid file type.")
      }
    }
    e.target.value = ""
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
        onFileUpload(file)
      } else {
        if (onSuccess) {
          onSuccess("Please select a PDF, DOC/DOCX, or image file.", 'error')
        } else {
          alert("Please select a PDF, DOC/DOCX, or image file.")
        }
      }
    }
  }


  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (locked) return
    const items = e.clipboardData?.items
    if (!items) return
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      if (it.kind === 'file') {
        const file = it.getAsFile()
        if (file) {
          const ext = file.name.split('.').pop()?.toLowerCase()
          if (["pdf", "jpg", "jpeg", "png", "doc", "docx"].includes(ext || "")) {
            onFileUpload(file)
            e.preventDefault()
            return
          } else {
            alert("Please select a PDF, DOC/DOCX, or image file.")
          }
        }
      }
    }
  }


  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="border-t bg-background p-3 sm:p-4"
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
          <AnimatePresence>
            {uploadedFile && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-wrap gap-2"
              >
                <div
                  className="flex items-center bg-secondary/80 backdrop-blur-sm px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium
                  border border-border shadow-sm max-w-full sm:max-w-[220px] overflow-hidden transition-all hover:shadow-md">
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 text-primary flex-shrink-0" />
                  <span className="truncate flex-1 min-w-0">{uploadedFile.name}</span>
                  <button 
                    onClick={onRemoveFile} 
                    title="Remove file"
                    className="ml-2 flex-shrink-0 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={locked}
                  >
                    <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Textarea with integrated upload button */}
          <div className="relative flex items-center">
            <Textarea
              ref={textareaRef}
placeholder="Ask your legal compliance questions..."
              value={inputMessage}
              onChange={handleInputChange}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
              disabled={loading || locked}
              className="min-h-[44px] sm:min-h-[48px] max-h-[120px] resize-none overflow-y-auto text-sm sm:text-base pr-12 sm:pr-14 py-3 leading-relaxed transition-all"
              rows={1}
              style={{ background: undefined }}
            />
            
            {/* Upload button inside textarea - positioned to align with text */}
            <Button
              type="button"
              variant="ghost"
              className="absolute right-1.5 bottom-1.5 h-8 w-8 p-0 flex-shrink-0 transition-all hover:bg-secondary rounded-md"
              title="Upload file"
              onClick={() => setModalOpen(true)}
              disabled={loading || locked}
            >
              <Paperclip className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground hover:text-foreground transition-colors" />
            </Button>
            
            {/* Drag overlay */}
            <AnimatePresence>
              {(dragOverInput || dragActive) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center
                    border-2 border-dashed border-primary bg-primary/10 backdrop-blur-sm rounded-md"
                >
                  <span className="text-primary font-semibold text-sm sm:text-base text-center px-2">
                    Drop file to add as attachment
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    (PDF, DOC, DOCX, JPG, PNG)
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Hidden file inputs */}
          <input ref={fileInputPdf} type="file" accept=".pdf" style={{ display: "none" }}
            onChange={e => handleFileChange(e, ["pdf"])} />
          <input ref={fileInputImage} type="file" accept="image/png,image/jpeg,image/jpg" style={{ display: "none" }}
            onChange={e => handleFileChange(e, ["jpg", "jpeg", "png"])} />
          <input ref={fileInputDoc} type="file" accept=".doc,.docx" style={{ display: "none" }}
            onChange={e => handleFileChange(e, ["doc", "docx"])} />
        </div>
        
        {/* Send button */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={onSend}
            disabled={loading || locked || (!inputMessage.trim() && !uploadedFile)}
            className="cursor-pointer h-10 w-10 sm:h-11 sm:w-11 p-0 flex-shrink-0 transition-all"
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="h-4 w-4 sm:h-5 sm:w-5 rounded-full border-2 border-muted border-t-primary"
              />
            ) : (
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative bg-background shadow-2xl p-6 sm:p-8 rounded-xl border w-full max-w-[95vw] sm:max-w-md flex flex-col items-center"
              onClick={e => e.stopPropagation()}
              tabIndex={0}
            >
              <button
                className="absolute top-3 right-3 rounded-full bg-secondary/80 p-1.5 hover:bg-red-500 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-primary"
                onClick={() => setModalOpen(false)}
                tabIndex={1}
                disabled={locked}
                aria-label="Close modal"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              
              <div className="w-full flex flex-col gap-4 items-center justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <Paperclip className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  <span className="font-bold text-lg sm:text-xl text-foreground">Upload File</span>
                </div>
                
                <div className="flex flex-col gap-3 w-full">
                  <Button 
                    className="w-full justify-start h-11 sm:h-12 text-sm sm:text-base" 
                    variant="outline" 
                    onClick={() => triggerFileSelect("pdf")} 
                    disabled={locked}
                  >
                    <FileText className="mr-2 w-5 h-5 text-primary" /> 
                    <span>Upload PDF</span>
                  </Button>
                  <Button 
                    className="w-full justify-start h-11 sm:h-12 text-sm sm:text-base" 
                    variant="outline" 
                    onClick={() => triggerFileSelect("image")} 
                    disabled={locked}
                  >
                    <FileImage className="mr-2 w-5 h-5 text-primary" /> 
                    <span>Upload Image (JPG/PNG)</span>
                  </Button>
                  <Button 
                    className="w-full justify-start h-11 sm:h-12 text-sm sm:text-base" 
                    variant="outline" 
                    onClick={() => triggerFileSelect("doc")} 
                    disabled={locked}
                  >
                    <File className="mr-2 w-5 h-5 text-primary" /> 
                    <span>Upload Doc (DOC/DOCX)</span>
                  </Button>
                </div>
                
                <div className="w-full mt-2">
                  <div className="w-full h-24 sm:h-28 bg-primary/10 flex flex-col items-center justify-center relative transition-all
                    border-2 border-dashed border-primary rounded-lg hover:bg-primary/15">
                    <span className="text-sm sm:text-base text-primary font-semibold pointer-events-none text-center px-2">
                      Drag & Drop files here
                    </span>
                    <span className="text-xs sm:text-sm text-muted-foreground pointer-events-none mt-1 text-center px-2">
                      PDF, DOC, DOCX, JPG, PNG allowed
                    </span>
                  </div>
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
