import { NextResponse, NextRequest } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function GET(request: NextRequest, context: { params: { userId: string } | Promise<{ userId: string }> }) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) return NextResponse.json({ message: 'Authorization token required' }, { status: 401 })
    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    if (decoded.role !== 'admin') return NextResponse.json({ message: 'Admin access required' }, { status: 403 })

    const client = await clientPromise
    const db = client.db('legal_compliance_chatbot')
    const usersColl = db.collection('users')
    const chatsColl = db.collection('chats')

    let params = context.params
    if (params && typeof params === 'object' && 'then' in (params as object)) {
      params = await params
    }
    const userIdStr = (params as { userId: string }).userId
    const user = await usersColl.findOne({ _id: new ObjectId(userIdStr) }, { projection: { password: 0 } })
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })

    // Calculate chat statistics
    const chats = await chatsColl.find({ userId: userIdStr }).toArray()
    const totalChats = chats.length
    const totalMessages = chats.reduce((sum, chat) => sum + (Array.isArray(chat.messages) ? chat.messages.length : 0), 0)
    const lastChatDate = chats.length > 0 ? chats.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0].createdAt : null

    const userWithStats = {
      ...user,
      chatStats: {
        totalChats,
        totalMessages,
        lastChatDate
      }
    }

    return NextResponse.json({ user: userWithStats })
  } catch (error) {
    console.error('Get user error', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: { params: { userId: string } | Promise<{ userId: string }> }) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) return NextResponse.json({ message: 'Authorization token required' }, { status: 401 })
    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    if (decoded.role !== 'admin') return NextResponse.json({ message: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const action = body.action as 'block' | 'unblock' | 'deactivate'
    const client = await clientPromise
    const db = client.db('legal_compliance_chatbot')
    const usersColl = db.collection('users')
    const chatsColl = db.collection('chats')
    const filesColl = db.collection('files')

    let params = context.params
    if (params && typeof params === 'object' && 'then' in (params as object)) {
      params = await params
    }
    const userIdStr = (params as { userId: string }).userId
    const userId = new ObjectId(userIdStr)

    if (action === 'block') {
      await usersColl.updateOne({ _id: userId }, { $set: { role: 'blocked' } })
      return NextResponse.json({ message: 'User blocked' })
    }

    if (action === 'unblock') {
      // Get user details for professional message
      const user = await usersColl.findOne({ _id: userId })
      if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })
      
      // Unblock the user
      await usersColl.updateOne({ _id: userId }, { $set: { role: 'user' } })
      
      // Send professional unblock notification to user
      const unblockMessage = `Dear ${user.name || 'User'},

We are writing to inform you that your account access has been restored following our review of your recent activity.

Your account has been unblocked and you now have full access to all platform features. However, we want to emphasize the importance of adhering to our community guidelines and terms of service moving forward.

Please take this opportunity to review our platform policies to ensure that all future interactions comply with our standards. We trust that you will maintain appropriate behavior and contribute positively to our community.

Should you have any questions about our guidelines or need clarification on acceptable platform usage, please don't hesitate to contact our support team.

We appreciate your understanding and look forward to your continued participation in our platform.

Best regards,
LCCFS Administration Team`

      const notificationsColl = db.collection('notifications')
      await notificationsColl.insertOne({
        userId: userIdStr,
        message: unblockMessage,
        type: 'unblock',
        read: false,
        createdAt: new Date(),
        sentBy: 'admin'
      })
      
      return NextResponse.json({ message: 'User unblocked and notified' })
    }

    if (action === 'deactivate') {
      // delete user and all related data including notifications
      const notificationsColl = db.collection('notifications')
      await chatsColl.deleteMany({ userId: userIdStr })
      await filesColl.deleteMany({ userId: userIdStr })
      await notificationsColl.deleteMany({ userId: userIdStr })
      await usersColl.deleteOne({ _id: userId })
      return NextResponse.json({ message: 'User deactivated and all data removed permanently' })
    }

    return NextResponse.json({ message: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Patch user error', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
