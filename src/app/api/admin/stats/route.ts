import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Authorization token required' }, { status: 401 })
    }
    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    if (decoded.role !== 'admin') return NextResponse.json({ message: 'Admin access required' }, { status: 403 })

    const client = await clientPromise
    const db = client.db('legal_compliance_chatbot')

    const usersColl = db.collection('users')
    const chatsColl = db.collection('chats')
    const filesColl = db.collection('files')
    const notificationsColl = db.collection('notifications')

    const totalUsers = await usersColl.countDocuments({ role: { $ne: 'blocked' } })
    const blockedUsers = await usersColl.countDocuments({ role: 'blocked' })
    const totalChats = await chatsColl.countDocuments({})
    const totalNotifications = await notificationsColl.countDocuments({
      $or: [
        { type: { $in: ['unblock_request', 'issue', 'reply'] } },
        { type: { $exists: false } }
      ]
    })

    // today's logins: assumes users have lastLogin field
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const todayLogins = await usersColl.countDocuments({ lastLogin: { $gte: start } })

    // activity: total chats today
    const chatsToday = await chatsColl.countDocuments({ createdAt: { $gte: start } })

    // totals
    const totalUploads = await filesColl.countDocuments({})

    // monthly active users (last 30 days)
    const monthAgo = new Date()
    monthAgo.setDate(monthAgo.getDate() - 30)
    const monthlyActive = await usersColl.countDocuments({ lastLogin: { $gte: monthAgo } })

    return NextResponse.json({ 
      stats: {
        totalUsers,
        blockedUsers,
        totalNotifications,
        totalChats
      },
      // Keep existing stats for backward compatibility
      totalUsers, 
      blockedCount: blockedUsers, 
      todayLogins, 
      chatsToday, 
      totalUploads, 
      monthlyActive 
    })
  } catch (error) {
    console.error('Stats error', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
