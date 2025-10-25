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
    
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { targetUserId, replyMessage, originalNotificationId } = body

    if (!targetUserId || !replyMessage?.trim()) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('legal_compliance_chatbot')

    // Get the target user details
    const user = await db.collection('users').findOne({ _id: new ObjectId(targetUserId) })
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // Create reply notification for user
    const replyNotification = {
      userId: targetUserId,
      message: `Admin Response:

${replyMessage.trim()}

---

If you have any further questions or concerns, please don't hesitate to reach out to our support team.

Best regards,
LCCFS Administration Team`,
      type: 'reply',
      read: false,
      createdAt: new Date(),
      ...(originalNotificationId && { originalNotificationId: originalNotificationId }),
      sentBy: 'admin'
    }

    await db.collection('notifications').insertOne(replyNotification)

    // Dispatch event for real-time notifications
    // Note: In a production environment, you might want to use WebSockets or Server-Sent Events
    
    return NextResponse.json({ 
      message: 'Reply sent successfully',
      success: true
    })
    
  } catch (error) {
    console.error('Error sending admin reply:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}