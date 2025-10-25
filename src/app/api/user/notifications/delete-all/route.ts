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
    
    if (!decoded || decoded.role !== 'user') {
      return NextResponse.json({ message: 'User access required' }, { status: 403 })
    }

    const client = await clientPromise
    const db = client.db('legal_compliance_chatbot')

    // Delete all notifications for this user
    const result = await db.collection('notifications').deleteMany({
      userId: decoded.userId
    })

    return NextResponse.json({ 
      message: `Successfully deleted ${result.deletedCount} notifications`,
      deletedCount: result.deletedCount,
      success: true
    })
    
  } catch (error) {
    console.error('Error deleting all user notifications:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}