import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Authorization token required' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)

    if (decoded.role !== 'admin') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      )
    }

    const client = await clientPromise
    const db = client.db('legal_compliance_chatbot')

    // allow admin to request blocked or non-blocked users
    const params = request.nextUrl.searchParams
    const onlyBlocked = params.get('blocked') === 'true'

    const users = await db.collection('users')
      .find(onlyBlocked ? { role: 'blocked' } : { role: { $ne: 'blocked' } }, { projection: { password: 0 } })
      .toArray()

    const chatsColl = db.collection('chats')
    const filesColl = db.collection('files')

    // fetch counts per user (only from users collection)
    type U = { _id: { toString(): string }; createdAt?: Date | string | number }
    const usersWithCounts = await Promise.all(
      users.map(async (u: U) => {
        const userId = u._id.toString()
        const chatCount = await chatsColl.countDocuments({ userId })
        const fileCount = await filesColl.countDocuments({ userId })
        return Object.assign({}, u as unknown as Record<string, unknown>, { chatCount, fileCount })
      })
    )

    const createdAtValue = (x: unknown) => {
      try {
        if (!x) return 0
        if (typeof x === 'number') return x
        if (typeof x === 'string') return new Date(x).getTime()
        if (x instanceof Date) return x.getTime()
        return 0
      } catch { return 0 }
    }

    const allUsers = usersWithCounts.sort((a, b) => createdAtValue((b as unknown as Record<string, unknown>).createdAt) - createdAtValue((a as unknown as Record<string, unknown>).createdAt))

    return NextResponse.json({ users: allUsers })
  } catch (error) {
    console.error('Fetch users error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
