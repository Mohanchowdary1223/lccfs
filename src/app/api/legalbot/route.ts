/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */

import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }
  try {
    const client = await clientPromise
    const db = client.db()
    // Only return chats for this user
    const chats = await db.collection('chats').find({ userId }).sort({ createdAt: -1 }).toArray()
    return NextResponse.json({ history: chats })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const userName = request.headers.get('x-user-name') || ''
    const body = await request.json()
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }
    const API_KEY = process.env.API_KEY
    if (!API_KEY) {
      return NextResponse.json({ error: 'API key not set' }, { status: 500 })
    }
    const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`
    const client = await clientPromise
    const db = client.db()
    let chat
    const chatId = body.chatId
    const title = body.title || 'Legal Query'
    let messages = []
    if (chatId) {
      chat = await db.collection('chats').findOne({ _id: new ObjectId(chatId), userId })
      if (!chat) {
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
      }
      messages = chat.messages || []
    }
    // Add user message
    const userMsg = {
      id: Date.now().toString(),
      text: body.message || (body.fileId ? 'File uploaded for analysis' : ''),
      sender: 'user',
      timestamp: new Date(),
      fileId: body.fileId || undefined,
      fileName: body.fileName || undefined,
    }
    messages.push(userMsg)

    // If this is just a file upload message, don't generate a bot response
    if (body.isFileUpload) {
      // This block is no longer needed with the new simplified flow
      // The fileId is now stored with the user message that contains it
      // We can remove this special handling
    }

    // Build full conversation context for Gemini
    const contents = await Promise.all(
      messages.map(
        async (m: {
          sender: string
          text: any
          fileId?: string
          file?: { originalName: string }
        }) => {
          const role = m.sender === 'user' ? 'user' : 'model'
          const parts: { text: any }[] = []

          // Add text part if it exists
          if (m.text) {
            parts.push({ text: m.text })
          }

          // If there's a fileId, fetch the file from MongoDB and add it appropriately
          if (m.fileId) {
            try {
              const fileDoc = await db
                .collection('files')
                .findOne({ _id: new ObjectId(m.fileId) })
              if (fileDoc) {
                // For DOCX files, use extracted text instead of binary data
                if (fileDoc.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                    fileDoc.originalName.toLowerCase().endsWith('.docx')) {
                  if (fileDoc.extractedText) {
                    // If there's no accompanying text, request a summary
                    const prompt = !m.text || m.text === 'File uploaded for analysis' || m.text.startsWith('Analyze this file:') 
                      ? `Please analyze this document and provide a comprehensive summary in exactly 10 lines. Focus on the key points, main topics, and important details.\n\nDocument content from ${fileDoc.originalName}:\n\n${fileDoc.extractedText}`
                      : `${m.text}\n\nDocument content from ${fileDoc.originalName}:\n\n${fileDoc.extractedText}`;
                    
                    parts.push({ text: prompt })
                  } else {
                    parts.push({ 
                      text: `DOCX file "${fileDoc.originalName}" was uploaded but text could not be extracted.` 
                    })
                  }
                } else {
                  // For other file types (PDFs, images), use inlineData
                  const filePart = {
                    inlineData: {
                      mimeType: fileDoc.mimeType,
                      data: fileDoc.data, // data is already base64
                    },
                  }
                  parts.push(filePart as any)
                  
                  // Add analysis request for file-only messages
                  if (!m.text || m.text === 'File uploaded for analysis' || m.text.startsWith('Analyze this file:')) {
                    parts.push({ 
                      text: `Please analyze this file and provide a comprehensive summary in exactly 10 lines. Focus on the key points, main content, and important details from the file: ${fileDoc.originalName}` 
                    })
                  }
                }
              } else {
                console.warn(
                  `File with ID ${m.fileId} not found in the database.`
                )
              }
            } catch (e) {
              console.error('Error fetching file from DB:', e)
            }
          }

          // Ensure we don't send a message with empty parts
          if (parts.length === 0) {
            return null
          }

          return { role, parts }
        }
      )
    )

    const validContents = contents.filter(Boolean) // Filter out any null messages

    // The logic to find the most recent file is now handled by the mapping above.
    // We can remove the separate block that was here.

    // Call Gemini API with full context and file if present
    const geminiRes = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: validContents }),
    })
    const geminiData = await geminiRes.json()
    let botText = 'Sorry, I could not get a response.'
    if (geminiData?.candidates?.[0]?.content?.parts?.[0]?.text) {
      botText = geminiData.candidates[0].content.parts[0].text
    }
    const botMsg = {
      id: (Date.now() + 1).toString(),
      text: botText,
      sender: 'bot',
      timestamp: new Date(),
    }
    messages.push(botMsg)

    // Save chat, always store userId and userName
    let result
    if (chatId) {
      await db.collection('chats').updateOne(
        { _id: new ObjectId(chatId), userId },
        { $set: { messages, title, updatedAt: new Date(), userId, userName } }
      )
      chat = await db.collection('chats').findOne({ _id: new ObjectId(chatId), userId })
    } else {
      result = await db.collection('chats').insertOne({
        userId,
        userName,
        title,
        messages,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      chat = await db.collection('chats').findOne({ _id: result.insertedId })
    }
    return NextResponse.json({ chat })
  } catch {
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!userId || !id) {
      return NextResponse.json({ error: 'User ID and chat ID required' }, { status: 400 })
    }
    const client = await clientPromise
    const db = client.db()

    // Find the chat first to get the file IDs
    const chatToDelete = await db.collection('chats').findOne({ _id: new ObjectId(id), userId })

    if (!chatToDelete) {
      return NextResponse.json({ error: 'Chat not found or user not authorized' }, { status: 404 })
    }

    // Collect all file IDs from the messages in the chat
    const fileIdsToDelete = chatToDelete.messages
      .map((message: { fileId?: string }) => message.fileId)
      .filter((fileId: string | undefined): fileId is string => !!fileId)
      .map((fileId: string) => new ObjectId(fileId))

    // If there are files to delete, delete them from the 'files' collection
    if (fileIdsToDelete.length > 0) {
      await db.collection('files').deleteMany({ _id: { $in: fileIdsToDelete } })
      console.log(`Deleted ${fileIdsToDelete.length} associated files.`)
    }

    // Finally, delete the chat itself
    await db.collection('chats').deleteOne({ _id: new ObjectId(id), userId })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete chat and/or associated files:', error)
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 })
  }
}
