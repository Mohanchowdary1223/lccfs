import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, otp, newPassword } = await request.json()

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { message: 'Email, OTP, and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('legal_compliance_chatbot')

    // Verify OTP one more time
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

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword)

    // Update password in users collection
    let updateResult = await db.collection('users').updateOne(
      { email },
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: new Date()
        } 
      }
    )

    // If not found in users, try admins collection
    if (updateResult.matchedCount === 0) {
      updateResult = await db.collection('admins').updateOne(
        { email },
        { 
          $set: { 
            password: hashedPassword,
            updatedAt: new Date()
          } 
        }
      )
    }

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Delete the used OTP
    await db.collection('password_reset_otps').deleteOne({ email, otp })

    return NextResponse.json({
      message: 'Password reset successfully',
      success: true,
    })
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}