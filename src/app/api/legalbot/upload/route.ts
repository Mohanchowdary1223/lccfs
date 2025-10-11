import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// Helper: read upload File stream into Buffer
async function fileBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export async function POST(request: NextRequest) {
  try {
    const API_KEY = process.env.API_KEY
    if (!API_KEY) {
      return NextResponse.json({ error: 'API key not set' }, { status: 500 })
    }
    const formData = await request.formData()
    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Upload file to Gemini's /files endpoint
    const geminiModelEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`
    const fileBufferData = await fileBuffer(file)
    const uploadResponse = await fetch(geminiModelEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${file.name}"`,
      },
      body: fileBufferData,
    })
    const fileUploadResult = await uploadResponse.json()
    if (!uploadResponse.ok || !fileUploadResult.name) {
      return NextResponse.json({ error: 'File upload to Gemini failed', details: fileUploadResult }, { status: 500 })
    }
    // name looks like "files/abc123"
    return NextResponse.json({ fileId: fileUploadResult.name, originalFileName: file.name })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 })
  }
}
