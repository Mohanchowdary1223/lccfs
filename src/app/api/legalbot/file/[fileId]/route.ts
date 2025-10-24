import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params
    const userId = request.headers.get('x-user-id')

    if (!fileId) {
      return NextResponse.json({ success: false, error: 'File ID is required' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 })
    }

    if (!ObjectId.isValid(fileId)) {
      return NextResponse.json({ success: false, error: 'Invalid File ID format' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('legal_compliance_chatbot')

    const fileDoc = await db.collection('files').findOne({
      _id: new ObjectId(fileId),
      userId: userId
    })

    if (!fileDoc) {
      return NextResponse.json({ success: false, error: 'File not found or access denied' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      content: fileDoc.data, // base64 data
      mimeType: fileDoc.mimeType,
      originalName: fileDoc.originalName,
      size: fileDoc.size,
      extractedText: fileDoc.extractedText || null,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('File fetch error:', errorMessage)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params
    const userId = request.headers.get('x-user-id')

    if (!fileId) {
      return NextResponse.json({ success: false, error: 'File ID is required' }, { status: 400 })
    }
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 })
    }
    if (!ObjectId.isValid(fileId)) {
      return NextResponse.json({ success: false, error: 'Invalid File ID format' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('legal_compliance_chatbot')

    const fileObjId = new ObjectId(fileId)
    // Find the file first so we can reference the originalName in chat messages
    const fileDoc = await db.collection('files').findOne({ _id: fileObjId, userId })
    if (!fileDoc) {
      return NextResponse.json({ success: false, error: 'File not found or access denied' }, { status: 404 })
    }

  // Delete the file document
    await db.collection('files').deleteOne({ _id: fileObjId, userId })

    // Find chats that reference this file and update them
    const chatsWithFile = await db.collection('chats').find({
      userId,
      'messages.fileId': fileId,
    }).toArray()

    if (chatsWithFile.length > 0) {
      for (const chat of chatsWithFile) {
        const messages = chat.messages || []
        // Build new messages: remove fileId/fileName from messages that referenced it
  const newMessages = []
        for (let i = 0; i < messages.length; i++) {
          const m = messages[i]
          if (m.fileId === fileId) {
            // strip file reference and mark the message as having its file deleted
            const copy = { ...m }
            delete copy.fileId
            delete copy.fileName
            // mark so clients can show an inline placeholder
            copy.fileDeleted = true
            newMessages.push(copy)
          } else {
            newMessages.push(m)
          }
        }

        // Only update if changes were made
        await db.collection('chats').updateOne(
          { _id: chat._id },
          { $set: { messages: newMessages, updatedAt: new Date() } }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('File delete error:', errorMessage)
    return NextResponse.json({ success: false, error: 'Internal server error', details: errorMessage }, { status: 500 })
  }
}
