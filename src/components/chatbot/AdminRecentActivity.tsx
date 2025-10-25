"use client"

import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ChatSession } from './types'
import { AlertCircle } from 'lucide-react'
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
  const [pendingReport, setPendingReport] = useState<{ chatId: string; title: string } | null>(null)
  const [reporting, setReporting] = useState(false)

  const confirmReport = async () => {
    if (!pendingReport || !userId) return
    setReporting(true)
    setPendingReport(null)
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/user/report', { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }, 
        body: JSON.stringify({ 
          userId, 
          chatId: pendingReport.chatId,
          chatTitle: pendingReport.title,
          reason: 'Inappropriate chat content reported by admin'
        }) 
      })
      
      if (response.ok) {
        if (onSuccess) {
          onSuccess('✅ Report submitted successfully! User has been notified and will receive appropriate guidance.', 'success')
        }
      } else {
        if (onSuccess) {
          onSuccess('❌ Failed to submit report. Please try again or contact technical support.', 'error')
        }
      }
    } catch (e) { 
      console.error(e); 
      if (onSuccess) {
        onSuccess('❌ Failed to submit report. Please check your connection and try again.', 'error')
      }
    } finally {
      setReporting(false)
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
                <div className="text-sm text-muted-foreground">{(c.messages || []).length} messages • {new Date(c.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}, {new Date(c.createdAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })}</div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => router.push(`/admin/chat/${c._id}?userId=${userId}`)}>View chat</Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setPendingReport({ chatId: c._id || '', title: c.title || 'Untitled Chat' })}
                  disabled={reporting}
                  className="text-red-600 hover:text-red-700"
                >
                  {reporting ? 'Reporting...' : 'Report'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      
      {/* Report Chat Confirmation Dialog */}
      <AlertDialog open={!!pendingReport} onOpenChange={() => setPendingReport(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Report Inappropriate Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to report this chat for inappropriate content? 
              This action will send a professional notification to the user about their inappropriate activity.
              {pendingReport && (
                <div className="mt-3 p-3 bg-muted/50 rounded text-sm border">
                  <div className="font-medium text-foreground mb-1">Chat Details:</div>
                  <div className="text-muted-foreground">
                    <div><strong>Title:</strong> {pendingReport.title}</div>
                    <div><strong>Chat ID:</strong> {pendingReport.chatId}</div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingReport(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmReport}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={reporting}
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              {reporting ? 'Reporting...' : 'Send Report'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
