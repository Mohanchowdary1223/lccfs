import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, message } = body
    if (!userId || !message) return NextResponse.json({ message: 'userId and message required' }, { status: 400 })

    const client = await clientPromise
    const db = client.db('legal_compliance_chatbot')
    const doc = { userId, message, createdAt: new Date().toISOString(), status: 'pending', type: 'unblock_request' }
    await db.collection('notifications').insertOne(doc)
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Unblock request error', e)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
