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
      text: body.message,
      sender: 'user',
      timestamp: new Date(),
    }
    messages.push(userMsg)

    // Build full conversation context for Gemini, add file if present
    const contents = messages.map((m: { sender: string; text: any }) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }))

    // If fileId provided from client (Gemini fileUri), add as special part
    if (body.fileId) {
      contents.push({
        role: 'user',
        parts: [
          {
            fileData: { fileUri: body.fileId }
          }
        ]
      })
    }

    // Call Gemini API with full context and file if present
    const geminiRes = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
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
    await db.collection('chats').deleteOne({ _id: new ObjectId(id), userId })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 })
  }
}
