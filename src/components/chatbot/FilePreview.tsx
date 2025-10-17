import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, FileText, Image as ImageIcon, File } from 'lucide-react'
import * as mammoth from 'mammoth'

interface FilePreviewProps {
  isOpen: boolean
  onClose: () => void
  fileId: string
  fileName: string
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  isOpen,
  onClose,
  fileId,
  fileName,
}) => {
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [htmlContent, setHtmlContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileType, setFileType] = useState<'text' | 'image' | 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'unknown'>('unknown')

  useEffect(() => {
    if (isOpen && fileId) {
      fetchFileContent()
    }
    if (!isOpen) {
      setFileContent(null)
      setHtmlContent(null)
      setError(null)
      setFileType('unknown')
    }
    // eslint-disable-next-line
  }, [isOpen, fileId])

  const fetchFileContent = async () => {
    setLoading(true)
    setError(null)
    try {
      const userStr = localStorage.getItem('user')
      const userId = userStr ? JSON.parse(userStr).id : null

      const response = await fetch(`/api/legalbot/file/${fileId}`, {
        headers: { 'x-user-id': userId || '' }
      })
      const data = await response.json()

      if (data.success) {
        setFileContent(data.content)
        setHtmlContent(null)

        const mimeType = data.mimeType?.toLowerCase() || ''
        const ext = fileName.toLowerCase()
        if (mimeType.startsWith('image/') || ext.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) {
          setFileType('image')
        }
        else if (mimeType === 'application/pdf' || ext.endsWith('.pdf')) {
          setFileType('pdf')
        }
        else if (ext.endsWith('.docx')) {
          setFileType('docx')
          const arrayBuffer = Uint8Array.from(atob(data.content), c => c.charCodeAt(0)).buffer
          const mammothResult = await mammoth.convertToHtml({ arrayBuffer })
          setHtmlContent(mammothResult.value)
        }
        else if (ext.endsWith('.xlsx')) {
          setFileType('xlsx')
        }
        else if (ext.endsWith('.pptx')) {
          setFileType('pptx')
        }
        else if (data.extractedText || mimeType.includes('text') || ext.match(/\.(txt|md)$/)) {
          setFileType('text')
        }
        else {
          setFileType('unknown')
        }
      } else {
        // If server says file not found/access denied, treat as deleted for UX
        const err = data.error || 'Failed to load file'
        if (data.error && (data.error.toLowerCase().includes('not found') || data.error.toLowerCase().includes('access denied'))) {
          setError('This file was deleted')
        } else {
          setError(err)
        }
      }
    } catch {
      setError('Failed to fetch file content')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (fileContent) {
      const byteCharacters = atob(fileContent)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      let mime
      switch (fileType) {
        case 'image': mime = 'image/*'; break
        case 'pdf': mime = 'application/pdf'; break
        case 'text': mime = 'text/plain'; break
        case 'docx': mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; break
        case 'xlsx': mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'; break
        case 'pptx': mime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'; break
        default: mime = 'application/octet-stream'
      }
      const blob = new Blob([byteArray], { type: mime })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const renderFileIcon = () => {
    switch (fileType) {
      case 'image': return <ImageIcon className="h-6 w-6 text-blue-600" aria-label="Image" />
      case 'text': return <FileText className="h-6 w-6 text-green-600" aria-label="Text" />
      case 'pdf': return <File className="h-6 w-6 text-red-600" aria-label="PDF" />
      case 'docx':
      case 'xlsx':
      case 'pptx': return <File className="h-6 w-6 text-blue-600" aria-label="Office File" />
      default: return <File className="h-6 w-6 text-gray-600" aria-label="File" />
    }
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading file...</span>
        </div>
      )
    }
    if (error) {
      return (
        <div className="flex items-center justify-center h-64 text-red-500 dark:text-red-400">
          <p>{error}</p>
        </div>
      )
    }
    if (!fileContent && !htmlContent) return null

    switch (fileType) {
      case 'image':
        return (
          <div className="w-full flex flex-col items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/*;base64,${fileContent}`}
              alt={fileName}
              className="max-w-full max-h-96 rounded-lg border border-gray-200 dark:border-gray-700 object-contain bg-white dark:bg-gray-800"
            />
            
          </div>
        )
      case 'text':
        return (
          <div className="w-full flex flex-col gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-mono">
                {atob(fileContent!)}
              </pre>
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors w-fit mx-auto shadow-sm"
            >
              <Download className="h-4 w-4" />
              Download Text File
            </button>
          </div>
        )
      case 'pdf':
        return (
          <div className="w-full flex flex-col items-center gap-4">
            <iframe
              src={`data:application/pdf;base64,${fileContent}`}
              title={fileName}
              className="w-full max-w-2xl h-[60vh] rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            />
           
          </div>
        )
      case 'docx':
        return (
          <div className="w-full flex flex-col gap-4">
            <div className="max-w-none max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 p-4 transition-colors">
              <div 
                className="docx-content text-gray-900 dark:text-gray-100 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: htmlContent || '' }} 
                style={{
                  color: 'rgb(17, 24, 39)', // gray-900 in light mode
                }}
              />
              <style dangerouslySetInnerHTML={{
                __html: `
                  .dark .docx-content {
                    color: rgb(243, 244, 246) !important; /* gray-100 in dark mode */
                  }
                  .docx-content * {
                    color: inherit !important;
                  }
                  .docx-content p {
                    margin-bottom: 0.5rem;
                    color: inherit !important;
                  }
                  .docx-content strong {
                    font-weight: 600;
                    color: inherit !important;
                  }
                  .docx-content em {
                    font-style: italic;
                    color: inherit !important;
                  }
                  .docx-content span {
                    color: inherit !important;
                  }
                  .docx-content div {
                    color: inherit !important;
                  }
                `
              }} />
            </div>
           
          </div>
        )
      case 'xlsx':
      case 'pptx':
        return (
          <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <File className="h-16 w-16 text-blue-500 dark:text-blue-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-300 mb-4 text-center px-4">
              Cannot preview Office files. Download to open in Microsoft Office.
            </p>
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Download className="h-4 w-4" />
              Download file
            </button>
          </div>
        )
      default:
        return (
          <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <File className="h-16 w-16 text-gray-600 dark:text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-300 mb-4 text-center px-4">
              This file type cannot be previewed
            </p>
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Download className="h-4 w-4" />
              Download file
            </button>
          </div>
        )
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl max-h-[80vh] w-full mx-4 overflow-hidden transition-colors border border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-colors">
              <div className="flex items-center gap-3">
                {renderFileIcon()}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {fileName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                    {fileType} file
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!fileContent}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors cursor-pointer"
                  title="Download file"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            {/* Content */}
            <div className="p-4 bg-white dark:bg-gray-900 transition-colors">{renderContent()}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
