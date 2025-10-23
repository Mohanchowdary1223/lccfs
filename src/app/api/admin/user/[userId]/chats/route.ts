import { NextResponse, NextRequest } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  context: { params: { userId: string } | Promise<{ userId: string }> }
) {
  // context.params may be a Promise in some Next versions; handle both cases
  let params = context.params
  if (params && typeof params === 'object' && 'then' in (params as object)) {
  params = await params
  }
  const userIdParam = (params as { userId: string }).userId
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) return NextResponse.json({ message: 'Authorization token required' }, { status: 401 })
    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    if (decoded.role !== 'admin') return NextResponse.json({ message: 'Admin access required' }, { status: 403 })

    const client = await clientPromise
    const db = client.db('legal_compliance_chatbot')
    const chatsColl = db.collection('chats')

  const chats = await chatsColl.find({ userId: userIdParam }).sort({ createdAt: -1 }).toArray()
    // Normalize to the shape expected by the UI: { _id, title, messages, createdAt, updatedAt }
    type MessageDoc = { id?: string; _id?: unknown; text?: string; message?: string; sender?: string; isBot?: boolean; timestamp?: unknown; createdAt?: unknown; fileId?: string; fileName?: string }
    const toStringId = (v: unknown) => {
      if (!v) return `${Date.now()}-${Math.random()}`
      if (typeof v === 'string') return v
  try { return String(v) } catch { return `${Date.now()}-${Math.random()}` }
    }
    const sanitized = chats.map(c => ({
      _id: c._id?.toString?.() ?? String(c._id),
      title: c.title || (Array.isArray(c.messages) && c.messages[0] && typeof c.messages[0].text === 'string' ? (c.messages[0].text as string).slice(0, 40) : 'Chat'),
      messages: Array.isArray(c.messages) ? c.messages.map((m: MessageDoc) => ({
  id: m.id ?? toStringId(m._id),
  text: m.text ?? m.message ?? '',
        sender: (m.sender === 'bot' || m.sender === 'user') ? m.sender : (m.isBot ? 'bot' : 'user'),
  timestamp: (m.timestamp ? (m.timestamp instanceof Date ? m.timestamp.toISOString() : String(m.timestamp)) : (m.createdAt ? (m.createdAt instanceof Date ? m.createdAt.toISOString() : String(m.createdAt)) : new Date().toISOString())),
        fileId: m.fileId,
        fileName: m.fileName,
      })) : [],
      createdAt: c.createdAt ? (c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt)) : new Date().toISOString(),
      updatedAt: c.updatedAt ? (c.updatedAt instanceof Date ? c.updatedAt.toISOString() : String(c.updatedAt)) : (c.createdAt ? (c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt)) : new Date().toISOString())
    }))

    return NextResponse.json({ chats: sanitized })
  } catch (error) {
    console.error('Get user chats error', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
