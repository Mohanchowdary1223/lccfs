import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

export async function DELETE(request: Request) {
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

    const client = await clientPromise
    const db = client.db('legal_compliance_chatbot')

    // Delete all admin-targeted notifications
    // This matches the same filter logic from the GET endpoint
    const result = await db.collection('notifications').deleteMany({
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
    })

    return NextResponse.json({ 
      message: `Successfully deleted ${result.deletedCount} notifications`,
      deletedCount: result.deletedCount,
      success: true
    })
    
  } catch (error) {
    console.error('Error deleting all admin notifications:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}