import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Connect to MongoDB and fetch real user files
    const client = await clientPromise
    const db = client.db()

    // Fetch files from the database that belong to the user
    const userFiles = await db.collection('files')
      .find({ userId: userId })
      .sort({ createdAt: -1 }) // Sort by newest first
      .toArray()

    // For each file, find which chats it's associated with
    const filesWithChatInfo = await Promise.all(userFiles.map(async (file) => {
      const fileIdString = file._id.toString()
      
      // Find chats that contain messages with this fileId
      const chatsWithFile = await db.collection('chats')
        .find({
          userId: userId,
          'messages.fileId': fileIdString
        })
        .toArray()

      // Get file extension from originalName
      const fileExtension = file.originalName.split('.').pop()?.toLowerCase() || 'unknown'
      
      return {
        _id: fileIdString,
        filename: file.originalName, // Use originalName as filename for display
        originalName: file.originalName,
        fileType: fileExtension, // Derive from file extension
        fileSize: file.size,
        uploadedAt: file.createdAt,
        userId: file.userId,
        mimeType: file.mimeType,
        // Additional context
        associatedChats: chatsWithFile.length,
        chatIds: chatsWithFile.map(chat => chat._id.toString()),
        lastUsedInChat: chatsWithFile.length > 0 ? 
          Math.max(...chatsWithFile.map(chat => new Date(chat.updatedAt || chat.createdAt).getTime())) 
          : null
      }
    }))

    return NextResponse.json({ 
      success: true, 
      files: filesWithChatInfo 
    })
  } catch (error) {
    console.error('Failed to fetch uploaded files:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch files' 
    }, { status: 500 })
  }
}