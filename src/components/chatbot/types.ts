export interface Message {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date | string
  isTyping?: boolean
  isFileReading?: boolean
  fileId?: string
  fileName?: string
  fileDeleted?: boolean
}


export interface ChatSession {
  _id?: string
  title: string
  messages: Message[]
  createdAt: Date
  originalSharedId?: string
}
