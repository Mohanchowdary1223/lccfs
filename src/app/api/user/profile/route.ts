import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'


export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }
  try {
    const client = await clientPromise
    const db = client.db()
    // Try to find user in users collection
    let user = await db.collection('users').findOne({ _id: new ObjectId(userId) })
    if (!user) {
      // fallback: try admins collection
      user = await db.collection('admins').findOne({ _id: new ObjectId(userId) })
    }
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    // Return only safe fields
    return NextResponse.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }
  try {
    const client = await clientPromise
    const db = client.db()
    const body = await request.json()
    const update: Record<string, unknown> = {}
    if (body.name) update.name = body.name
    if (body.email) update.email = body.email
    if (body.password) {
      // Hash password
      const { hashPassword } = await import('@/lib/auth')
      update.password = await hashPassword(body.password)
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: update }
    )
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return NextResponse.json({ message: 'Profile updated' })
  } catch {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}

// Delete user account

export async function DELETE(request: NextRequest) {

  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }
  try {
    const client = await clientPromise
    const db = client.db()
    // Remove user from users collection
    const userResult = await db.collection('users').deleteOne({ _id: new ObjectId(userId) })
    // Remove user from admins collection (if present)
    const adminResult = await db.collection('admins').deleteOne({ _id: new ObjectId(userId) })
    // Remove user's chat history
    await db.collection('chats').deleteMany({ userId })
    // Remove any other user-related collections here if needed
    if (userResult.deletedCount === 0 && adminResult.deletedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return NextResponse.json({ message: 'Account and all related data deleted' })
  } catch {
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
// (Removed duplicate misplaced GET handler code)