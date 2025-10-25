"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { FileText, Image as ImageIcon, File, Download, Eye, Filter, Trash2, CheckCircle } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from '@/components/ui/toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UploadedFile } from "./types"
// icon removed: CheckCircle
import { formatFileSize, calculateFileStats } from "./utils"
import { FilePreview } from "@/components/chatbot/FilePreview"
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

interface FilesTabProps {
  uploadedFiles: UploadedFile[]
  onFilesReload?: () => Promise<void>
}

export const FilesTab: React.FC<FilesTabProps> = ({ uploadedFiles, onFilesReload }) => {
  const [activeFileTab, setActiveFileTab] = useState('all')
  const [showFilePreview, setShowFilePreview] = useState(false)
  const [selectedFileId, setSelectedFileId] = useState('')
  const [selectedFileName, setSelectedFileName] = useState('')
  const toast = useToast()
  const fileStats = calculateFileStats(uploadedFiles)

  const getFilesByType = (type: string) => {
    switch (type) {
      case 'pdf':
        return uploadedFiles.filter(file => file.fileType === 'pdf')
      case 'images':
        return uploadedFiles.filter(file => ['jpg', 'jpeg', 'png'].includes(file.fileType))
      case 'docs':
        return uploadedFiles.filter(file => ['doc', 'docx'].includes(file.fileType))
      default:
        return uploadedFiles
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


  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [pendingDeleteName, setPendingDeleteName] = useState<string | null>(null)

  const openDeleteDialog = (fileId: string, fileName: string) => {
    setPendingDeleteId(fileId)
    setPendingDeleteName(fileName)
  }

  const performDelete = async () => {
    if (!pendingDeleteId) return
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    const userId = userStr ? JSON.parse(userStr).id || JSON.parse(userStr)._id : ''
    try {
        if (pendingDeleteId === '__all__') {
        // Delete all files for user
        const res = await fetch(`/api/legalbot/clear?scope=files`, { method: 'POST', headers: { 'x-user-id': userId } })
        if (!res.ok) throw new Error('Failed to delete all files')
        try { localStorage.setItem('files-cleared', JSON.stringify({ ts: Date.now() })) } catch {}
        toast.push('All files deleted', 'success', <CheckCircle className="w-5 h-5 text-white" />)
        try { window.dispatchEvent(new CustomEvent('files-cleared')) } catch {}
        if (onFilesReload) await onFilesReload()
      } else {
        const fileId = pendingDeleteId
        const res = await fetch(`/api/legalbot/file/${fileId}`, { method: 'DELETE', headers: { 'x-user-id': userId } })
        const data = await res.json()
        if (res.ok && data.success) {
          toast.push('File deleted successfully', 'success', <CheckCircle className="w-5 h-5 text-white" />)
          try { localStorage.setItem('file-deleted', JSON.stringify({ fileId, ts: Date.now() })) } catch {}
          try { window.dispatchEvent(new CustomEvent('file-deleted', { detail: { fileId } })) } catch {}
          if (onFilesReload) {
            await onFilesReload()
          } else {
            window.location.reload()
          }
        } else {
          throw new Error(data.error || 'Failed to delete')
        }
      }
    } catch (err) {
      console.error('Delete file error', err)
      toast.push('Failed to delete file(s)', 'error')
    } finally {
      setPendingDeleteId(null)
      setPendingDeleteName(null)
    }
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return FileText
      case 'jpg':
      case 'jpeg':
      case 'png':
        return ImageIcon
      case 'doc':
      case 'docx':
        return File
      default:
        return File
    }
  }

  // TabsList is a horizontal scrollable bar, never wraps
  const TabsListResponsive = (
    <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/30">
      <TabsList className="flex min-w-max w-full space-x-2 px-1 pb-1 border-b-2 border-border bg-background">
        <TabsTrigger value="all" className="flex items-center space-x-1 px-4 py-2 whitespace-nowrap rounded-md text-xs sm:text-sm">
          <File className="h-4 w-4" />
          <span>All ({fileStats.totalFiles})</span>
        </TabsTrigger>
        <TabsTrigger value="pdf" className="flex items-center space-x-1 px-4 py-2 whitespace-nowrap rounded-md text-xs sm:text-sm">
          <FileText className="h-4 w-4" />
          <span>PDFs ({fileStats.pdfFiles})</span>
        </TabsTrigger>
        <TabsTrigger value="images" className="flex items-center space-x-1 px-4 py-2 whitespace-nowrap rounded-md text-xs sm:text-sm">
          <ImageIcon className="h-4 w-4" />
          <span>Images ({fileStats.imageFiles})</span>
        </TabsTrigger>
        <TabsTrigger value="docs" className="flex items-center space-x-1 px-4 py-2 whitespace-nowrap rounded-md text-xs sm:text-sm">
          <File className="h-4 w-4" />
          <span>Docs ({fileStats.docFiles})</span>
        </TabsTrigger>
      </TabsList>
    </div>
  )

  const renderFileList = (files: UploadedFile[]) => (
    <div className="space-y-3">
      {files.map((file, index) => {
        const FileIcon = getFileIcon(file.fileType)
        return (
          <motion.div
            key={file._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors gap-4 sm:gap-0">
              <div className="flex items-center gap-3 flex-1 min-w-0 w-full">
                <FileIcon className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="min-w-0 w-1 flex-1">
                  <p
                    className="font-medium truncate overflow-hidden whitespace-nowrap w-44 sm:w-64 md:w-96"
                    title={file.originalName}
                  >
                    {file.originalName}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mt-1">
                    <span>{formatFileSize(file.fileSize)}</span>
                    <span>Uploaded {new Date(file.uploadedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}, {new Date(file.uploadedAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })}</span>
                    <span className="px-2 py-1 bg-secondary rounded text-xs uppercase">
                      {file.fileType}
                    </span>
                    {file.associatedChats && file.associatedChats > 0 && (
                      <span className="text-primary">Used in {file.associatedChats} chat{file.associatedChats > 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-row gap-2 flex-wrap sm:flex-nowrap mt-2 sm:mt-0">
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
      {files.length === 0 && (
        <div className="text-center py-12">
          <Filter className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Files Found</h3>
          <p className="text-muted-foreground mb-4">
            No files of this type have been uploaded yet
          </p>
        </div>
      )}
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Uploaded Files
          </CardTitle>
          <div>
            {uploadedFiles.length > 0 && (
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setPendingDeleteId('__all__')}>Delete all files</Button>
            )}
          </div>
        </div>
        <CardDescription>All your uploaded files organized by type</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeFileTab} onValueChange={setActiveFileTab} className="space-y-4">
          {TabsListResponsive}
          <TabsContent value="all">
            {renderFileList(uploadedFiles)}
          </TabsContent>
          <TabsContent value="pdf">
            {renderFileList(getFilesByType('pdf'))}
          </TabsContent>
          <TabsContent value="images">
            {renderFileList(getFilesByType('images'))}
          </TabsContent>
          <TabsContent value="docs">
            {renderFileList(getFilesByType('docs'))}
          </TabsContent>
        </Tabs>
        {/* File Preview Modal */}
        <FilePreview
          isOpen={showFilePreview}
          onClose={() => setShowFilePreview(false)}
          fileId={selectedFileId}
          fileName={selectedFileName}
        />
        {/* Delete confirmation dialog */}
        <AlertDialog open={!!pendingDeleteId}>
          <AlertDialogContent>
            <AlertDialogHeader>
                  <AlertDialogTitle>{pendingDeleteId === '__all__' ? 'Delete all files' : 'Delete file'}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {pendingDeleteId === '__all__' ? 'This will permanently delete all your uploaded files. This action cannot be undone.' : `Are you sure you want to permanently delete ${pendingDeleteName ? `"${pendingDeleteName}"` : 'this file'}? This action cannot be undone.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setPendingDeleteId(null); setPendingDeleteName(null) }}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={performDelete} className="ml-2">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
