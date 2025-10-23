"use client"

import React, { useState } from 'react'

export default function BlockedRequestForm({ user }: { user: unknown }) {
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  const submit = async () => {
    // try to extract userId from token payload or from user object
    let userId = ''
    try {
      const u = user as unknown as Record<string, unknown>
      userId = (u.id as string) || (u._id as string) || ''
    } catch {}
    if (!userId) {
      // try localStorage
      try {
        const u = localStorage.getItem('user')
        if (u) userId = JSON.parse(u)._id || JSON.parse(u).id || ''
      } catch {}
    }
    if (!userId) return
    await fetch('/api/unblock-request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, message }) })
    setSent(true)
  }

  if (sent) return <div className="text-sm text-green-600 font-medium p-3 bg-green-50 border border-green-200 rounded-lg">✅ Unblock request submitted successfully! Admin will review your request and reply via notifications.</div>
  return (
    <div>
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="w-full border rounded p-2 mb-2" placeholder="Explain why you should be unblocked" />
      <div className="flex gap-2">
        <button onClick={submit} className="btn">Send request</button>
      </div>
    </div>
  )
}
