import { NextResponse, NextRequest } from 'next/server'

// Simple proxy to fetch a remote file and return base64 + mimeType
export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url')
    if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 })

    // Only allow http(s)
    if (!/^https?:\/\//i.test(url)) {
      return NextResponse.json({ error: 'Invalid url scheme' }, { status: 400 })
    }

    const res = await fetch(url)
    if (!res.ok) return NextResponse.json({ error: 'Failed to fetch remote file' }, { status: 502 })

    const arrayBuffer = await res.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const contentType = res.headers.get('content-type') || 'application/octet-stream'

    return NextResponse.json({ success: true, content: base64, mimeType: contentType })
  } catch (err) {
    console.error('Preview proxy error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
