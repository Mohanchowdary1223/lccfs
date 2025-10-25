import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) return NextResponse.json({ message: 'Authorization token required' }, { status: 401 })
    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    if (decoded.role !== 'admin') return NextResponse.json({ message: 'Admin access required' }, { status: 403 })

    const client = await clientPromise
    const db = client.db('legal_compliance_chatbot')
    // Admin should see notifications meant for admin review, not user-targeted notifications
    // Exclude user-targeted notifications: 'report', 'warning', 'unblock' (when sent to users)
    const notes = await db.collection('notifications').find({
      $or: [
        { type: { $in: ['unblock_request', 'issue', 'reply'] } }, // Admin-targeted notifications
        { type: { $exists: false } }, // Legacy notifications without type
        { 
          $and: [
            { type: 'unblock' },
            { userId: { $exists: false } } // Admin unblock notifications (not user-targeted)
          ]
        }
      ]
    }).toArray()
    const sortedNotes = notes.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return dateB - dateA // Most recent first
    })
    return NextResponse.json({ notifications: sortedNotes })
  } catch (e) {
    console.error('Notifications GET error', e)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) return NextResponse.json({ message: 'Authorization token required' }, { status: 401 })
    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    if (decoded.role !== 'admin') return NextResponse.json({ message: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const { action, notificationId } = body
    if (!action || !notificationId) return NextResponse.json({ message: 'action and notificationId required' }, { status: 400 })

    const client = await clientPromise
    const db = client.db('legal_compliance_chatbot')

    if (action === 'mark-read') {
      const result = await db.collection('notifications').updateOne(
        { _id: new ObjectId(notificationId) },
        { $set: { read: true } }
      )
      
      if (result.matchedCount === 1) {
        return NextResponse.json({ message: 'Marked as read', success: true })
      } else {
        return NextResponse.json({ message: 'Notification not found', success: false }, { status: 404 })
      }
    }

    if (action === 'delete') {
      console.log('Attempting to delete notification:', notificationId)
      const result = await db.collection('notifications').deleteOne({ _id: new ObjectId(notificationId) })
      console.log('Delete result:', result)
      
      if (result.deletedCount === 1) {
        return NextResponse.json({ message: 'Deleted', success: true })
      } else {
        return NextResponse.json({ message: 'Notification not found or already deleted', success: false }, { status: 404 })
      }
    }

    if (action === 'unblock') {
      const note = await db.collection('notifications').findOne({ _id: new ObjectId(notificationId) })
      if (!note) return NextResponse.json({ message: 'Notification not found' }, { status: 404 })
      const userId = note.userId
      
      // Get user details for professional message
      const user = await db.collection('users').findOne({ _id: new ObjectId(userId) })
      if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })
      
      // Unblock the user
      await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $set: { role: 'user' } })
      
      // Send professional unblock notification to user
      const unblockMessage = `Dear ${user.name || 'User'},

We are writing to inform you that your account access has been restored following our review of your recent activity.

Your account has been unblocked and you now have full access to all platform features. However, we want to emphasize the importance of adhering to our community guidelines and terms of service moving forward.

Please take this opportunity to review our platform policies to ensure that all future interactions comply with our standards. We trust that you will maintain appropriate behavior and contribute positively to our community.

Should you have any questions about our guidelines or need clarification on acceptable platform usage, please don't hesitate to contact our support team.

We appreciate your understanding and look forward to your continued participation in our platform.

Best regards,
LCCFS Administration Team`

      await db.collection('notifications').insertOne({
        userId: userId,
        message: unblockMessage,
        type: 'unblock',
        read: false,
        createdAt: new Date(),
        sentBy: 'admin'
      })
      
      return NextResponse.json({ message: 'User unblocked and notified' })
    }

    return NextResponse.json({ message: 'Unknown action' }, { status: 400 })
  } catch (e) {
    console.error('Notifications PATCH error', e)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
