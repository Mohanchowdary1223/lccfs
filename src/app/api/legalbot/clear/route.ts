import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  try {
    const url = new URL(request.url)
    const scope = url.searchParams.get('scope') || 'all' // files | chats | all
    const client = await clientPromise
    const db = client.db()

    if (scope === 'chats') {
      // Delete chats and any files referenced by those chats
      const chats = await db.collection('chats').find({ userId }).toArray()
      const fileIds = chats.flatMap(c => (c.messages || []).map((m: unknown) => (m as { fileId?: string }).fileId).filter(Boolean))
      const uniqueFileIds = Array.from(new Set(fileIds))
      if (uniqueFileIds.length > 0) {
        const objectIds = uniqueFileIds.map((id: string) => new ObjectId(id))
        await db.collection('files').deleteMany({ _id: { $in: objectIds } })
      }
      await db.collection('chats').deleteMany({ userId })
      return NextResponse.json({ success: true, scope: 'chats' })
    }

    if (scope === 'files') {
      // Delete files owned by the user and remove references in chats
      const userFiles = await db.collection('files').find({ userId }).toArray()
      const fileIds = userFiles.map(f => f._id.toString())
      if (fileIds.length > 0) {
        const objectIds = fileIds.map(id => new ObjectId(id))
        await db.collection('files').deleteMany({ _id: { $in: objectIds } })
        // Note: chat messages that referenced these fileIds will still contain those ids.
        // This avoids complex schema updates server-side; UI should handle missing file docs gracefully.
      }
      return NextResponse.json({ success: true, scope: 'files' })
    }

    // scope === 'all'
    // Find all chats for user and collect file ids
    const chats = await db.collection('chats').find({ userId }).toArray()
    const fileIds = chats.flatMap(c => (c.messages || []).map((m: unknown) => (m as { fileId?: string }).fileId).filter(Boolean))
    const uniqueFileIds = Array.from(new Set(fileIds))
    if (uniqueFileIds.length > 0) {
      const objectIds = uniqueFileIds.map((id: string) => new ObjectId(id))
      await db.collection('files').deleteMany({ _id: { $in: objectIds } })
    }
    await db.collection('chats').deleteMany({ userId })
    return NextResponse.json({ success: true, scope: 'all' })
  } catch (err) {
    console.error('Failed to clear history', err)
    return NextResponse.json({ error: 'Failed to clear history' }, { status: 500 })
  }
}
