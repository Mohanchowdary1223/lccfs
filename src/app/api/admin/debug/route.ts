import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    console.log('Debug endpoint called')
    
    const client = await clientPromise
    const db = client.db('legal_compliance_chatbot')
    const usersColl = db.collection('users')

    // Count all users
    const totalUsers = await usersColl.countDocuments({})
    console.log('Total users in database:', totalUsers)

    // Count admin users
    const adminUsers = await usersColl.countDocuments({ role: 'admin' })
    console.log('Admin users in database:', adminUsers)

    // Get all admin users (without passwords)
    const admins = await usersColl.find(
      { role: 'admin' },
      { projection: { password: 0 } }
    ).toArray()

    console.log('Admin users found:', admins)

    // Get all users with their roles
    const allUsers = await usersColl.find(
      {},
      { projection: { password: 0, email: 1, role: 1, name: 1 } }
    ).limit(10).toArray()

    return NextResponse.json({
      success: true,
      totalUsers,
      adminUsers,
      admins,
      sampleUsers: allUsers
    })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}