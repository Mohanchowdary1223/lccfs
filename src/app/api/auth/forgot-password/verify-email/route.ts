import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('legal_compliance_chatbot')

    // Check if email exists in users collection
    const user = await db.collection('users').findOne({ email })
    
    if (!user) {
      // Check if email exists in admins collection
      const admin = await db.collection('admins').findOne({ email })
      
      if (!admin) {
        return NextResponse.json(
          { message: 'Email not found in our records' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json({
      message: 'Email verified successfully',
      success: true,
    })
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}