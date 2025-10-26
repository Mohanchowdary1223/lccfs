import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { generateToken } from '@/lib/auth'

// This endpoint handles Google OAuth callback and user creation/login
export async function POST(request: NextRequest) {
  try {
    const { googleToken, name, email, picture } = await request.json()

    if (!googleToken || !email) {
      return NextResponse.json(
        { message: 'Google token and email are required' },
        { status: 400 }
      )
    }

    // Verify Google token (in production, you'd verify this with Google)
    // For now, we'll trust the frontend verification
    
    const client = await clientPromise
    const db = client.db('legal_compliance_chatbot')

    // Check if user already exists in users or admins collection
    let user = await db.collection('users').findOne({ email })
    let role = 'user'

    if (!user) {
      user = await db.collection('admins').findOne({ email })
      if (user) {
        role = 'admin'
      }
    } else {
      role = user.role || 'user'
    }

    if (!user) {
      // Create new user
      const newUser = {
        name: name || email.split('@')[0],
        email,
        picture: picture || null,
        role: 'user',
        provider: 'google',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = await db.collection('users').insertOne(newUser)
      user = { ...newUser, _id: result.insertedId }
      role = 'user'
    } else {
      // Update existing user's last login
      await db.collection(role === 'admin' ? 'admins' : 'users').updateOne(
        { _id: user._id },
        { 
          $set: { 
            lastLogin: new Date(),
            ...(picture && { picture })
          }
        }
      )
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id,
      email: user.email,
      role: role,
    })

    return NextResponse.json({
      message: 'Google authentication successful',
      token,
      role,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role,
        picture: user.picture || null,
      },
    })
  } catch (error) {
    console.error('Google auth error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}