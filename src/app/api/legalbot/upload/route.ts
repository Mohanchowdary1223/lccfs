import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import mammoth from 'mammoth'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    console.log('Storing file in MongoDB:', file.name, 'Size:', file.size)

    const fileBuffer = Buffer.from(await file.arrayBuffer())
    let extractedText = null

    // Extract text from DOCX files
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        file.name.toLowerCase().endsWith('.docx')) {
      try {
        const result = await mammoth.extractRawText({ buffer: fileBuffer })
        extractedText = result.value
        console.log('Extracted text from DOCX:', extractedText.substring(0, 200) + '...')
      } catch (extractError) {
        console.error('Failed to extract text from DOCX:', extractError)
      }
    }

    const base64Data = fileBuffer.toString('base64')

    const client = await clientPromise
    const db = client.db()

    const fileDoc = {
      userId,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      data: base64Data,
      extractedText, // Store extracted text for DOCX files
      createdAt: new Date(),
    }

    const result = await db.collection('files').insertOne(fileDoc)
    const fileId = result.insertedId.toString()

    console.log('File stored in MongoDB with ID:', fileId)

    return NextResponse.json({
      fileId: fileId,
      originalFileName: file.name,
      success: true,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('File upload error:', errorMessage)
    return NextResponse.json(
      {
        error: 'Internal server error during file upload',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
