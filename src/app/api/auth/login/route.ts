import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { comparePasswords, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('legal_compliance_chatbot')

    // Check in users collection first
    let user = await db.collection('users').findOne({ email })
    let role = 'user'

    if (!user) {
      // Only check admins collection if not found in users
      user = await db.collection('admins').findOne({ email })
      if (user) {
        role = 'admin'
      }
    } else {
      // User found in users collection - use their stored role or default to 'user'
      role = (user.role as string) || 'user'
    }

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const isValidPassword = await comparePasswords(password, user.password)
    
    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const token = generateToken({
      userId: user._id,
      email: user.email,
      role: role,
    })

    return NextResponse.json({
      message: 'Login successful',
      token,
      role,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
