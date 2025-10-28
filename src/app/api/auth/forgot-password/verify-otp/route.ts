import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json()

    if (!email || !otp) {
      return NextResponse.json(
        { message: 'Email and OTP are required' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('legal_compliance_chatbot')

    // Find the OTP record
    const otpRecord = await db.collection('password_reset_otps').findOne({
      email,
      otp,
    })

    if (!otpRecord) {
      return NextResponse.json(
        { message: 'Invalid OTP' },
        { status: 400 }
      )
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      // Delete expired OTP
      await db.collection('password_reset_otps').deleteOne({ email, otp })
      return NextResponse.json(
        { message: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'OTP verified successfully',
      success: true,
    })
  } catch (error) {
    console.error('OTP verification error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}