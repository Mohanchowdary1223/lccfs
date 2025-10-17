export interface UserData {
  _id: string
  name: string
  email: string
  createdAt: Date
  lastLogin?: Date
  role: 'user' | 'admin'
  chatStats?: {
    totalChats: number
    totalMessages: number
    lastChatDate?: Date
    favoriteTopics?: string[]
  }
}

export interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date | string
}

export interface ChatSession {
  _id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

export interface ChatStats {
  totalChats: number
  totalMessages: number
  avgMessagesPerChat: number
  totalFiles: number
}

export interface UploadedFile {
  _id: string
  filename: string
  originalName: string
  fileType: string
  fileSize: number
  uploadedAt: Date
  userId: string
  mimeType?: string
  associatedChats?: number
  chatIds?: string[]
  lastUsedInChat?: number | null
}

export interface FileStats {
  totalFiles: number
  pdfFiles: number
  imageFiles: number
  docFiles: number
}

export interface ProfileTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export interface ProfileEditProps {
  userData: UserData
  isEditing: boolean
  editName: string
  editEmail: string
  newPassword: string
  confirmPassword: string
  loading: boolean
  error: string
  showPassword: boolean
  onEditToggle: () => void
  onNameChange: (name: string) => void
  onEmailChange: (email: string) => void
  onPasswordChange: (password: string) => void
  onConfirmPasswordChange: (password: string) => void
  onPasswordToggle: () => void
  onUpdateProfile: () => void
  onCancelEdit: () => void
}

export interface SecurityTabProps {
  loading: boolean
  newPassword: string
  confirmPassword: string
  showPassword: boolean
  onPasswordChange: (password: string) => void
  onConfirmPasswordChange: (password: string) => void
  onPasswordToggle: () => void
  onUpdateProfile: () => void
  onDeleteAccount: () => void
}