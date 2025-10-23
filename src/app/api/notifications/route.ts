import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    // user notifications: support x-user-id header or token-based auth
    const userIdHeader = request.headers.get('x-user-id')
    const authHeader = request.headers.get('authorization')
    let userId = userIdHeader
    if (!userId && authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      try { const decoded = verifyToken(token); userId = decoded.id } catch {}
    }
    if (!userId) return NextResponse.json({ message: 'User id required' }, { status: 401 })

    const client = await clientPromise
    const db = client.db('legal_compliance_chatbot')
    const notes = await db.collection('notifications').find({ userId: userId }).sort({ createdAt: -1 }).toArray()
    return NextResponse.json({ notifications: notes })
  } catch (e) {
    console.error('User notifications GET error', e)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, message, type } = body
    if (!userId || !message) return NextResponse.json({ message: 'userId and message required' }, { status: 400 })

    const client = await clientPromise
    const db = client.db('legal_compliance_chatbot')
    const doc = { userId, message, type: type || 'info', createdAt: new Date().toISOString() }
    await db.collection('notifications').insertOne(doc)
    return NextResponse.json({ message: 'Notification created' })
  } catch (e) {
    console.error('User notifications POST error', e)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
