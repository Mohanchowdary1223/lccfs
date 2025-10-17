import { ChatSession, ChatStats, UploadedFile, FileStats } from './types'

export function getUserIdFromLocalStorage(): string {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.id || user._id || `user_${Date.now()}`;
      } catch {
        const newUserId = `user_${Date.now()}`;
        localStorage.setItem('user', JSON.stringify({ id: newUserId, name: 'User' }));
        return newUserId;
      }
    } else {
      const newUserId = `user_${Date.now()}`;
      localStorage.setItem('user', JSON.stringify({ id: newUserId, name: 'User' }));
      return newUserId;
    }
  }
  return `user_${Date.now()}`;  
}

export function calculateStats(chatHistory: ChatSession[], uploadedFiles: UploadedFile[] = []): ChatStats {
  if (!chatHistory.length) return { totalChats: 0, totalMessages: 0, avgMessagesPerChat: 0, totalFiles: uploadedFiles.length }
  
  const totalChats = chatHistory.length
  const totalMessages = chatHistory.reduce((total, chat) => total + (chat.messages?.length || 0), 0)
  const avgMessagesPerChat = Math.round(totalMessages / totalChats)
  
  return { totalChats, totalMessages, avgMessagesPerChat, totalFiles: uploadedFiles.length }
}

export function calculateFileStats(uploadedFiles: UploadedFile[]): FileStats {
  if (!uploadedFiles.length) return { totalFiles: 0, pdfFiles: 0, imageFiles: 0, docFiles: 0 }
  
  const totalFiles = uploadedFiles.length
  const pdfFiles = uploadedFiles.filter(file => file.fileType === 'pdf').length
  const imageFiles = uploadedFiles.filter(file => ['jpg', 'jpeg', 'png'].includes(file.fileType)).length
  const docFiles = uploadedFiles.filter(file => ['doc', 'docx'].includes(file.fileType)).length
  
  return { totalFiles, pdfFiles, imageFiles, docFiles }
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function updateLocalStorageUser(name: string, email: string): void {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      user.name = name
      user.email = email
      localStorage.setItem('user', JSON.stringify(user))
    }
  }
}

export function clearUserData(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }
}