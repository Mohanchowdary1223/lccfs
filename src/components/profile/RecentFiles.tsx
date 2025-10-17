"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, Eye, Image, File, Trash2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { UploadedFile } from './types'
import { useToast } from '@/components/ui/toast'
import { formatFileSize } from './utils'
import { FilePreview } from '@/components/chatbot/FilePreview'

interface RecentFilesProps {
  uploadedFiles: UploadedFile[]
  limit?: number
  showHeader?: boolean
  onFilesReload?: () => Promise<void>
}

export const RecentFiles: React.FC<RecentFilesProps> = ({
  uploadedFiles,
  limit = 5,
  showHeader = true,
  onFilesReload,
}) => {
  const toast = useToast()
  const [showFilePreview, setShowFilePreview] = useState(false)
  const [selectedFileId, setSelectedFileId] = useState('')
  const [selectedFileName, setSelectedFileName] = useState('')
  const displayFiles = uploadedFiles.slice(0, limit)

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return FileText
      case 'jpg':
      case 'jpeg':
      case 'png':
        return Image
      case 'doc':
      case 'docx':
        return File
      default:
        return File
    }
  }

  const handleViewFile = (fileId: string, fileName: string) => {
    setSelectedFileId(fileId)
    setSelectedFileName(fileName)
    setShowFilePreview(true)
  }

  const handleDownloadFile = (fileId: string, filename: string) => {
    const link = document.createElement('a')
    link.href = `/api/legalbot/file/${fileId}`
    link.download = filename
    link.click()
  }

  // legacy stub removed: use dialog-based deletion via openDeleteDialog/performDelete

  // AlertDialog state
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [pendingDeleteName, setPendingDeleteName] = useState<string | null>(null)

  const openDeleteDialog = (fileId: string, fileName: string) => {
    setPendingDeleteId(fileId)
    setPendingDeleteName(fileName)
  }

  const performDelete = async () => {
    if (!pendingDeleteId) return
    const fileId = pendingDeleteId
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    const userId = userStr ? JSON.parse(userStr).id || JSON.parse(userStr)._id : ''
    try {
      const res = await fetch(`/api/legalbot/file/${fileId}`, { method: 'DELETE', headers: { 'x-user-id': userId } })
      const data = await res.json()
      if (res.ok && data.success) {
toast.push('File deleted successfully', 'success', <CheckCircle className="w-5 h-5 text-white" />)
        try { localStorage.setItem('file-deleted', JSON.stringify({ fileId, ts: Date.now() })) } catch {}
        try { window.dispatchEvent(new CustomEvent('file-deleted', { detail: { fileId } })) } catch {}
        if (onFilesReload) {
          await onFilesReload()
        }
      } else {
        throw new Error(data.error || 'Failed to delete')
      }
    } catch (err) {
      console.error('Delete file error', err)
      toast.push('Failed to delete file', 'error')
    } finally {
      setPendingDeleteId(null)
      setPendingDeleteName(null)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Recent Uploaded Files
            </CardTitle>
            <CardDescription>Your latest 5 files uploads</CardDescription>
          </CardHeader>
        )}
        <CardContent>
          {displayFiles.map((file, index) => {
            const FileIcon = getFileIcon(file.fileType)
            return (
              <motion.div
                key={file._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="mb-3 last:mb-0"
              >
                {/* Flex row for desktop, column for mobile */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b last:border-b-0">
                  {/* Left: Icon + Details */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <FileIcon className="h-4 w-4 text-primary flex-shrink-0" />
                    <div className="min-w-0 w-32 sm:w-60 md:w-80">
                      <p
                        className="font-medium truncate"
                        title={file.originalName}
                      >
                        {file.originalName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.fileSize)} • {new Date(file.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {/* Right: Actions - row on all screens, margin-top on mobile */}
                  <div className="flex flex-row gap-2 mt-3 sm:mt-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewFile(file._id, file.originalName)}
                      className="flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadFile(file._id, file.originalName)}
                      className="flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteDialog(file._id, file.originalName)}
                      className="flex items-center gap-1 text-red-600 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </Button>
                  </div>
                </div>
              </motion.div>
            )
          })}
          {uploadedFiles.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No files uploaded yet</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => window.location.href = '/user/chatbot'}
              >
                Upload Your First File
              </Button>
            </div>
          )}
          {/* File Preview Modal */}
          <FilePreview
            isOpen={showFilePreview}
            onClose={() => setShowFilePreview(false)}
            fileId={selectedFileId}
            fileName={selectedFileName}
          />
        </CardContent>
        {/* Delete confirmation dialog */}
        <AlertDialog open={!!pendingDeleteId}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete file</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete {pendingDeleteName ? `"${pendingDeleteName}"` : 'this file'}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setPendingDeleteId(null); setPendingDeleteName(null) }}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={performDelete} className="ml-2">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </motion.div>
  )
}
