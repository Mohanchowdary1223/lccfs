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

    // Check in both users and admins collections
    let user = await db.collection('users').findOne({ email })
    let role = 'user'

    if (!user) {
      user = await db.collection('admins').findOne({ email })
      role = 'admin'
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
