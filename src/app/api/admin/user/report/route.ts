import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'
import jwt from 'jsonwebtoken'

interface DecodedToken {
  userId: string
  role: string
  email: string
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    let decoded: DecodedToken
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as DecodedToken
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { userId, chatId, chatTitle, reason } = await request.json()

    if (!userId || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()

    // Get user details for professional message
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create professional notification message
    let message = ''
    if (chatId && chatTitle) {
      // Report from chat page
      message = `Dear ${user.name || 'User'},

We have identified that your recent chat activity ("${chatTitle}") may not align with our community guidelines and platform policies. 

Our administrators have reviewed the content and found it potentially inappropriate. We kindly ask you to review our terms of service and ensure all future interactions comply with our community standards.

If you believe this notification was sent in error, please contact our support team for further clarification.

Thank you for your understanding and cooperation in maintaining a respectful environment for all users.

Best regards,
LCCFS Administration Team`
    } else {
      // Report from user details page
      message = `Dear ${user.name || 'User'},

We have reviewed your recent activity on our platform and identified some concerns regarding compliance with our community guidelines and terms of service.

Our administrators have flagged certain behaviors or content that may be inappropriate or against our platform policies. We kindly request that you review our guidelines and ensure all future activities align with our community standards.

We appreciate your cooperation in maintaining a respectful and professional environment for all users. Should you have any questions or concerns about this notification, please don't hesitate to contact our support team.

Thank you for your understanding.

Best regards,
LCCFS Administration Team`
    }

    // Create notification record
    const notification = {
      userId: userId,
      message: message,
      type: 'report',
      read: false,
      createdAt: new Date(),
      reportedBy: decoded.userId,
      ...(chatId && { chatId: chatId })
    }

    await db.collection('notifications').insertOne(notification)

    // Also create an admin log entry for tracking
    const adminLog = {
      adminId: decoded.userId,
      action: 'user_report',
      targetUserId: userId,
      ...(chatId && { chatId: chatId }),
      reason: reason,
      createdAt: new Date()
    }

    await db.collection('admin_logs').insertOne(adminLog)

    return NextResponse.json({ 
      message: 'Report submitted successfully', 
      notificationId: notification
    })
  } catch (error) {
    console.error('Error submitting report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}