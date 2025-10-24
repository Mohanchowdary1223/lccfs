import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function GET(request: Request) {
  try {
    console.log('Admin profile GET request received')
    
    const authHeader = request.headers.get('authorization')
    console.log('Auth header:', authHeader ? 'Present' : 'Missing')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header')
      return NextResponse.json({ message: 'Authorization token required' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    console.log('Token extracted:', token.substring(0, 20) + '...')
    
    const decoded = verifyToken(token)
    console.log('Token decoded:', { userId: decoded.userId, role: decoded.role })
    
    if (decoded.role !== 'admin') {
      console.log('User is not admin, role:', decoded.role)
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 })
    }

    const client = await clientPromise
    const db = client.db('legal_compliance_chatbot')
    const adminsColl = db.collection('admins')

    // Find admin user in the admins collection
    const adminId = typeof decoded.userId === 'string' ? new ObjectId(decoded.userId) : decoded.userId
    console.log('Looking for admin with ID:', adminId)
    
    const admin = await adminsColl.findOne(
      { _id: adminId },
      { projection: { password: 0 } }
    )

    console.log('Admin found:', admin ? 'Yes' : 'No')

    if (!admin) {
      console.log('Admin not found in database')
      return NextResponse.json({ message: 'Admin not found' }, { status: 404 })
    }

    console.log('Returning admin data successfully')
    return NextResponse.json({ admin })
  } catch (error) {
    console.error('Admin profile GET error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Authorization token required' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    
    if (decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { name, email } = body

    if (!name || !email) {
      return NextResponse.json({ message: 'Name and email are required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('legal_compliance_chatbot')
    const adminsColl = db.collection('admins')

    // Check if email is already taken by another admin
    const adminId = typeof decoded.userId === 'string' ? new ObjectId(decoded.userId) : decoded.userId
    const existingAdmin = await adminsColl.findOne({
      email,
      _id: { $ne: adminId }
    })

    if (existingAdmin) {
      return NextResponse.json({ message: 'Email already taken' }, { status: 400 })
    }

    // Update admin profile
    const result = await adminsColl.updateOne(
      { _id: adminId },
      { 
        $set: { 
          name, 
          email,
          updatedAt: new Date()
        } 
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Admin not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Profile updated successfully' })
  } catch (error) {
    console.error('Admin profile PATCH error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}