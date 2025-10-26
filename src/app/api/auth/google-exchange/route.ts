import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { code, redirect_uri } = await request.json()

    if (!code) {
      return NextResponse.json({ message: 'Authorization code is required' }, { status: 400 })
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Token exchange failed:', errorData)
      return NextResponse.json({ message: 'Failed to exchange code for tokens' }, { status: 400 })
    }

    const tokens = await tokenResponse.json()

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    if (!userResponse.ok) {
      return NextResponse.json({ message: 'Failed to get user info from Google' }, { status: 400 })
    }

    const googleUser = await userResponse.json()

    // Now handle user creation/login
    const client = await clientPromise
    const db = client.db('legal_compliance_chatbot')

    // Check if user already exists in users or admins collection
    let user = await db.collection('users').findOne({ email: googleUser.email })
    let role = 'user'

    if (!user) {
      user = await db.collection('admins').findOne({ email: googleUser.email })
      if (user) {
        role = 'admin'
      }
    } else {
      role = user.role || 'user'
    }

    if (!user) {
      // Create new user
      const newUser = {
        name: googleUser.name || googleUser.email.split('@')[0],
        email: googleUser.email,
        picture: googleUser.picture || null,
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
            ...(googleUser.picture && { picture: googleUser.picture })
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
    console.error('Google OAuth exchange error:', error)
    return NextResponse.json(
      { message: 'Internal server error during Google authentication' },
      { status: 500 }
    )
  }
}