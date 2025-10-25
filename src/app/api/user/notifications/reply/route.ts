import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Authorization token required' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    
    if (!decoded || decoded.role !== 'user') {
      return NextResponse.json({ message: 'User access required' }, { status: 403 })
    }

    const body = await request.json()
    const { originalNotificationId, replyMessage, senderName } = body

    if (!originalNotificationId || !replyMessage?.trim()) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('legal_compliance_chatbot')

    // Get the original notification to find who sent it
    const originalNotification = await db.collection('notifications').findOne({
      _id: new ObjectId(originalNotificationId)
    })

    if (!originalNotification) {
      return NextResponse.json({ message: 'Original notification not found' }, { status: 404 })
    }

    // Get user details
    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) })
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // Create reply notification for admin
    const replyNotification = {
      message: `Reply from ${senderName || user.name || 'User'} regarding ${originalNotification.type}:

"${replyMessage.trim()}"

---
Original message: ${originalNotification.message.substring(0, 200)}${originalNotification.message.length > 200 ? '...' : ''}`,
      type: 'reply',
      read: false,
      createdAt: new Date(),
      originalNotificationId: originalNotificationId,
      userId: decoded.userId, // This is for tracking who sent the reply
      replyTo: originalNotification.reportedBy || 'admin' // Who should receive this reply
    }

    await db.collection('notifications').insertOne(replyNotification)

    // Dispatch event for real-time notifications
    // Note: In a production environment, you might want to use WebSockets or Server-Sent Events
    
    return NextResponse.json({ 
      message: 'Reply sent successfully',
      success: true
    })
    
  } catch (error) {
    console.error('Error sending reply:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}