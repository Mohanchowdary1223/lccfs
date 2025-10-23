import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'
import jwt from 'jsonwebtoken'

interface DecodedToken {
  userId: string
  role: string
  email: string
}

export async function GET(request: NextRequest) {
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

    if (decoded.role !== 'user') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const client = await clientPromise
    const db = client.db()

    // Fetch notifications for this user
    const notifications = await db.collection('notifications')
      .find({ 
        userId: decoded.userId,
        type: { $in: ['report', 'warning', 'info', 'unblock'] } // User-visible notification types
      })
      .sort({ createdAt: -1 }) // Most recent first
      .toArray()

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('Error fetching user notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
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

    if (decoded.role !== 'user') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { notificationId, action } = await request.json()

    if (!notificationId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()

    if (action === 'mark_read') {
      const result = await db.collection('notifications').updateOne(
        { 
          _id: new ObjectId(notificationId),
          userId: decoded.userId 
        },
        { 
          $set: { 
            read: true,
            readAt: new Date()
          } 
        }
      )

      if (result.matchedCount === 0) {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
      }

      return NextResponse.json({ message: 'Notification marked as read' })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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

    if (decoded.role !== 'user') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { notificationId } = await request.json()

    if (!notificationId) {
      return NextResponse.json({ error: 'Missing notification ID' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()

    const result = await db.collection('notifications').deleteOne({
      _id: new ObjectId(notificationId),
      userId: decoded.userId
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Notification deleted' })
  } catch (error) {
    console.error('Error deleting notification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}