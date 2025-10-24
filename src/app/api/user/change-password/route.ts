import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { ObjectId } from 'mongodb'

export async function PATCH(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Authorization token required' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: 'Current password and new password are required' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ message: 'New password must be at least 6 characters long' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('legal_compliance_chatbot')
    const usersColl = db.collection('users')

    // Find user with password
    const userId = typeof decoded.userId === 'string' ? new ObjectId(decoded.userId) : decoded.userId
    const user = await usersColl.findOne({ _id: userId })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ message: 'Current password is incorrect' }, { status: 400 })
    }

    // Hash new password
    const saltRounds = 10
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)

    // Update password
    await usersColl.updateOne(
      { _id: userId },
      { 
        $set: { 
          password: hashedNewPassword,
          updatedAt: new Date()
        } 
      }
    )

    return NextResponse.json({ message: 'Password changed successfully' })
  } catch (error) {
    console.error('User change password error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}