import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { sendOTPEmail, generateOTP } from '@/lib/email'

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

    // Check if email exists in users or admins collection
    const user = await db.collection('users').findOne({ email })
    const admin = await db.collection('admins').findOne({ email })
    
    if (!user && !admin) {
      return NextResponse.json(
        { message: 'Email not found in our records' },
        { status: 404 }
      )
    }

    // Generate OTP
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now

    // Store OTP in database
    await db.collection('password_reset_otps').deleteMany({ email }) // Remove any existing OTPs
    await db.collection('password_reset_otps').insertOne({
      email,
      otp,
      expiresAt,
      createdAt: new Date(),
    })

    // Send OTP via email
    const emailSent = await sendOTPEmail(email, otp)
    
    if (!emailSent) {
      return NextResponse.json(
        { message: 'Failed to send OTP email. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'OTP sent successfully to your email',
      success: true,
    })
  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}