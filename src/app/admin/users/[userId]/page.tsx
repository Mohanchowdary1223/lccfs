"use client"
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ProfileHeader, StatsCards } from '@/components/profile'
import { AdminRecentActivity } from '@/components/chatbot/AdminRecentActivity'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { AlertCircle } from 'lucide-react'
import { UserData, ChatSession, Message } from '@/components/profile/types'
import { SuccessMessage } from "@/components/ui/success-message";
import { useSuccessMessage } from "@/components/ui/success-message";

export default function AdminUserDetailsPage() {
  const { showMessage, hideMessage, show, message, type } = useSuccessMessage();
  const params = useParams() as { userId?: string }
  const userId = params.userId || ''
  const router = useRouter()

  const [userData, setUserData] = useState<UserData | null>(null)
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [reporting, setReporting] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    if (!userId) return
    setLoading(true)

    const fetchUser = fetch(`/api/admin/user/${userId}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    const fetchChats = fetch(`/api/admin/user/${userId}/chats`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())

    Promise.all([fetchUser, fetchChats])
      .then(([uRes, cRes]) => {
        if (uRes && uRes.user) {
          const ud = uRes.user
          const cs = ud.chatStats || {}
          const normalized: UserData = {
            _id: ud._id,
            name: ud.name || (ud.email || '').split('@')[0],
            email: ud.email || '',
            createdAt: ud.createdAt ? new Date(ud.createdAt) : new Date(),
            lastLogin: ud.lastLogin ? new Date(ud.lastLogin) : undefined,
            role: ud.role === 'admin' ? 'admin' : 'user',
            chatStats: {
              totalChats: cs.totalChats ?? 0,
              totalMessages: cs.totalMessages ?? 0,
              lastChatDate: cs.lastChatDate ? new Date(cs.lastChatDate) : undefined,
              favoriteTopics: cs.favoriteTopics || undefined
            }
          }
          setUserData(normalized)
        }
        if (cRes && cRes.chats) {
          type FetchedChat = { _id: string; title?: string; messages?: unknown[]; createdAt?: string | number; updatedAt?: string | number }
          const mapped = (cRes.chats as FetchedChat[]).map((item) => ({
            _id: item._id,
            title: item.title || '',
            messages: (item.messages || []) as Message[],
            createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
            updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date()
          } as ChatSession))
          setChatHistory(mapped)
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [userId])

  const handleReport = () => {
    setShowReportDialog(true)
  }

  const confirmReport = async () => {
    if (!userData) return
    setReporting(true)
    setShowReportDialog(false)
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/user/report', { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }, 
        body: JSON.stringify({ 
          userId: userData._id,
          reason: 'Inappropriate user activity reported by admin'
        }) 
      })
      
      if (response.ok) {
        showMessage('✅ Report submitted successfully! User has been notified and will receive appropriate guidance.', 'success')
      } else {
        showMessage('❌ Failed to submit report. Please try again or contact technical support.', 'error')
      }
    } catch (e) { 
      console.error(e)
      showMessage('❌ Failed to submit report. Please check your connection and try again.', 'error')
    } finally { 
      setReporting(false) 
    }
  }

  if (!userId) return <div className="p-6 pt-24">Missing user id</div>

  return (
    <div className="p-6 pt-24">
      <SuccessMessage
        show={show}
        message={message}
        type={type}
        onClose={hideMessage}
      />
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">User details</h1>
        <div>
          <button onClick={() => router.back()} className="btn">Back</button>
        </div>
      </div>

      {loading ? <div>Loading...</div> : (
        <div className="space-y-6">
          {userData && (
            <>
              <ProfileHeader userData={userData} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* ensure a ChatStats-shaped object */}
                      <StatsCards stats={{
                        totalChats: userData.chatStats?.totalChats ?? chatHistory.length,
                        totalMessages: userData.chatStats?.totalMessages ?? chatHistory.reduce((sum, chat) => sum + (chat.messages?.length || 0), 0),
                        avgMessagesPerChat: (() => {
                          const totalChats = userData.chatStats?.totalChats ?? chatHistory.length
                          const totalMessages = userData.chatStats?.totalMessages ?? chatHistory.reduce((sum, chat) => sum + (chat.messages?.length || 0), 0)
                          return totalChats > 0 ? Math.round((totalMessages / totalChats) * 10) / 10 : 0
                        })(),
                        totalFiles: 0 // Files count can be added later if needed
                      }} />
                      <AdminRecentActivity chatHistory={chatHistory} limit={10} userId={userData._id} />
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="font-medium">Full Name</p>
                          <p className="text-sm text-muted-foreground">{userData.name}</p>
                        </div>
                        <div>
                          <p className="font-medium">Email</p>
                          <p className="text-sm text-muted-foreground">{userData.email}</p>
                        </div>
                        <div>
                          <p className="font-medium">Role</p>
                          <p className="text-sm text-muted-foreground">{userData.role}</p>
                        </div>
                        <div>
                          <p className="font-medium">Joined</p>
                          <p className="text-sm text-muted-foreground">{userData.createdAt.toLocaleDateString()}</p>
                        </div>
                        <div className="pt-4 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReport}
                            disabled={reporting}
                            className="w-full flex items-center gap-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                          >
                            <AlertCircle className="h-4 w-4" />
                            {reporting ? 'Reporting...' : 'Report User Activity'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Report Confirmation Dialog */}
      <AlertDialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Report Inappropriate Activity</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to report this user for inappropriate activity? 
              This action will send a professional notification to the user about their inappropriate behavior.
            </AlertDialogDescription>
            {userData && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm border">
                <div className="font-medium text-foreground mb-2">User Information:</div>
                <div className="space-y-1 text-muted-foreground">
                  <div><strong>User:</strong> {userData.name}</div>
                  <div><strong>Email:</strong> {userData.email}</div>
                  <div><strong>Total Chats:</strong> {userData.chatStats?.totalChats || 0}</div>
                </div>
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowReportDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmReport}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Send Report
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
