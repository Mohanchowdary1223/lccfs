"use client"

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChatSession } from './types'
import { } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props { 
  chatHistory: ChatSession[]; 
  limit?: number; 
  userId: string;
  onSuccess?: (message: string, type?: 'success' | 'error') => void;
}

export const AdminRecentActivity: React.FC<Props> = ({ chatHistory, limit = 10, userId, onSuccess }) => {
  const router = useRouter()
  const display = chatHistory.slice(0, limit)

  const handleReport = async (chatId: string, title?: string) => {
    if (!userId) return
    if (!confirm('Report this chat as inappropriate? This will notify the user.')) return
    try {
      await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, message: `Admin reported chat "${title || chatId}" as inappropriate.`, type: 'report', chatId }) })
      if (onSuccess) {
        onSuccess('Report sent', 'success')
      } else {
        alert('Report sent')
      }
    } catch (e) { 
      console.error(e); 
      if (onSuccess) {
        onSuccess('Failed to send report', 'error')
      } else {
        alert('Failed to send report')
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Chats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {display.length === 0 ? (
            <div className="text-sm text-muted-foreground">No activity</div>
          ) : display.map((c) => (
            <div key={c._id} className="flex items-center justify-between p-2 border rounded">
              <div>
                <div className="font-medium">{c.title}</div>
                <div className="text-sm text-muted-foreground">{(c.messages || []).length} messages • {new Date(c.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => router.push(`/admin/chat/${c._id}?userId=${userId}`)}>View chat</Button>
                <Button variant="ghost" onClick={() => handleReport(c._id || '', c.title)}>Report</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
