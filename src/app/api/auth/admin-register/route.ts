import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { hashPassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('legal_compliance_chatbot')

    // Check if admin already exists
    const existingAdmin = await db.collection('admins').findOne({ email })
    const existingUser = await db.collection('users').findOne({ email })

    if (existingAdmin || existingUser) {
      return NextResponse.json(
        { message: 'User already exists with this email' },
        { status: 409 }
      )
    }

    const hashedPassword = await hashPassword(password)

    const newAdmin = {
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('admins').insertOne(newAdmin)

    // Generate token for automatic login
    const token = generateToken({
      userId: result.insertedId,
      email: email,
      role: 'admin',
    })

    return NextResponse.json({
      message: 'Admin registered successfully',
      token,
      role: 'admin',
      user: {
        id: result.insertedId,
        name,
        email,
        role: 'admin',
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Admin registration error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
