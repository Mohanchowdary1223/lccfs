import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const userName = request.headers.get('x-user-name') || ''
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const body = await request.json()
    const { chatId } = body

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()

    // First, fetch the original shared chat
    const originalChat = await db.collection('chats').findOne({ _id: new ObjectId(chatId) })
    
    if (!originalChat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    // Check if user already has a copy of this shared chat
    const existingCopy = await db.collection('chats').findOne({ 
      userId, 
      originalSharedId: chatId 
    })

    if (existingCopy) {
      return NextResponse.json({ chat: existingCopy })
    }

    // Create a copy of the chat for the current user
    const chatCopy = {
      userId,
      userName,
      title: originalChat.title || 'Shared Chat Copy',
      messages: originalChat.messages || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      originalSharedId: chatId // Keep reference to original shared chat
    }

    // If the original chat has messages with files, we need to copy those files too
    const messagesWithFiles = originalChat.messages?.filter((msg: { fileId?: string }) => msg.fileId) || []
    
    if (messagesWithFiles.length > 0) {
      // Copy each file and update the message references
      for (let i = 0; i < chatCopy.messages.length; i++) {
        const message = chatCopy.messages[i]
        if (message.fileId) {
          try {
            // Fetch the original file
            const originalFile = await db.collection('files').findOne({ _id: new ObjectId(message.fileId) })
            
            if (originalFile) {
              // Create a copy of the file for the new user
              const fileCopy = {
                userId,
                originalName: originalFile.originalName,
                mimeType: originalFile.mimeType,
                data: originalFile.data,
                extractedText: originalFile.extractedText,
                createdAt: new Date(),
                originalFileId: originalFile._id // Keep reference to original file
              }
              
              const fileResult = await db.collection('files').insertOne(fileCopy)
              
              // Update the message to reference the new file
              chatCopy.messages[i] = {
                ...message,
                fileId: fileResult.insertedId.toString()
              }
            }
          } catch (error) {
            console.error(`Failed to copy file ${message.fileId}:`, error)
            // Keep the message but mark that file copy failed
            chatCopy.messages[i] = {
              ...message,
              fileId: undefined,
              fileName: message.fileName ? `${message.fileName} (file copy failed)` : undefined
            }
          }
        }
      }
    }

    const result = await db.collection('chats').insertOne(chatCopy)
    const newChat = await db.collection('chats').findOne({ _id: result.insertedId })

    return NextResponse.json({ chat: newChat })
  } catch (error) {
    console.error('Failed to copy chat:', error)
    return NextResponse.json({ error: 'Failed to copy chat' }, { status: 500 })
  }
}