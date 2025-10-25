"use client";
import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserMinus, UserCheck, Trash2, AlertCircle, CheckCircle, Bell, Clock, ChevronDown, ChevronUp, Reply, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SuccessMessage } from "@/components/ui/success-message";
import { useSuccessMessage } from "@/components/ui/success-message";
import { NotificationSkeleton } from "@/components/ui/loading-skeletons";


type Notification = { _id: string; userId: string; message: string; type?: string; createdAt: string; read?: boolean; originalNotificationId?: string; replyTo?: string };
type NoteWithUser = Notification & { userName?: string; userRole?: string };


const FILTERS = [
  { key: "all", label: "All" },
  { key: "unblock_request", label: "Unblock Requests" },
  { key: "reply", label: "Replies" },
  { key: "issue", label: "Issues" },
];


const AdminNotificationsPage = () => {
  const { showMessage, hideMessage, show, message, type } = useSuccessMessage();
  const [notes, setNotes] = useState<NoteWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'block' | 'unblock' | 'delete' | null;
    notificationId: string;
    userName: string;
    userId: string;
  }>({
    open: false,
    action: null,
    notificationId: '',
    userName: '',
    userId: ''
  });
  const [actionLoading, setActionLoading] = useState(false);


  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch("/api/admin/notifications", { headers: { Authorization: `Bearer ${token}` } });
        const d = await res.json();
        const notes: Notification[] = d.notifications || [];
        const withUsers: NoteWithUser[] = await Promise.all(
          notes.map(async (n) => {
            try {
              const r = await fetch(`/api/admin/user/${n.userId}`, { headers: { Authorization: `Bearer ${token}` } });
              if (r.ok) {
                const ud = await r.json();
                return { ...n, userName: ud.user?.name || n.userId, userRole: ud.user?.role };
              }
            } catch { }
            return { ...n };
          })
        );
        setNotes(withUsers);
        setLoading(false);
      } catch {
        setLoading(false);
      }
    };
    load();
  }, []);


  const refresh = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const res = await fetch("/api/admin/notifications", { headers: { Authorization: `Bearer ${token}` } });
    const d = await res.json();
    const raw: Notification[] = d.notifications || [];
    const withUsers: NoteWithUser[] = await Promise.all(
      raw.map(async (n) => {
        try {
          const r = await fetch(`/api/admin/user/${n.userId}`, { headers: { Authorization: `Bearer ${token}` } });
          if (r.ok) {
            const ud = await r.json();
            return { ...n, userName: ud.user?.name || n.userId, userRole: ud.user?.role };
          }
        } catch { }
        return { ...n };
      })
    );
    setNotes(withUsers);
  };


  const showConfirmation = (action: 'block' | 'unblock' | 'delete', notificationId: string, userName: string, userId: string) => {
    setConfirmDialog({
      open: true,
      action,
      notificationId,
      userName,
      userId
    });
  };


  const sendReply = async (originalNotificationId: string, targetUserId: string) => {
    if (!replyText.trim()) return;

    setSendingReply(true);
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch("/api/admin/notifications/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          targetUserId,
          replyMessage: replyText,
          originalNotificationId
        }),
      });

      if (response.ok) {
        setReplyText("");
        setReplyingTo(null);
        // Show success message or refresh notifications
      } else {
        console.error("Failed to send reply");
      }
    } catch (error) {
      console.error("Error sending reply:", error);
    } finally {
      setSendingReply(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "mark-read", notificationId }),
      });

      if (response.ok) {
        // Update local state
        setNotes((prev) => 
          prev.map((n) => 
            n._id === notificationId ? { ...n, read: true } : n
          )
        );
        // Notify navbar to update notification count
        window.dispatchEvent(new CustomEvent('notificationRead'));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const deleteAllNotifications = async () => {
    setDeletingAll(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/notifications/delete-all", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotes([]);
        setExpandedId(null);
        setReplyingTo(null);
        setReplyText("");
        // Notify navbar to update notification count
        window.dispatchEvent(new CustomEvent('notificationRead'));
      } else {
        console.error("Failed to delete all notifications");
      }
    } catch (error) {
      console.error("Error deleting all notifications:", error);
    } finally {
      setDeletingAll(false);
      setDeleteAllDialogOpen(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.action || !confirmDialog.notificationId) return;
    
    setActionLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setActionLoading(false);
      return;
    }


    try {
      if (confirmDialog.action === 'block') {
        const response = await fetch(`/api/admin/user/${confirmDialog.userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: "block" }),
        });
        
        if (response.ok) {
          showMessage(`✅ ${confirmDialog.userName} has been successfully blocked. They will no longer have access to the platform.`, 'success');
        } else {
          showMessage(`❌ Failed to block ${confirmDialog.userName}. Please try again.`, 'error');
        }
      } else if (confirmDialog.action === 'unblock') {
        const response = await fetch("/api/admin/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: "unblock", notificationId: confirmDialog.notificationId }),
        });
        
        if (response.ok) {
          showMessage(`✅ ${confirmDialog.userName} has been successfully unblocked and notified. They can now access the platform again.`, 'success');
        } else {
          showMessage(`❌ Failed to unblock ${confirmDialog.userName}. Please try again.`, 'error');
        }
      } else if (confirmDialog.action === 'delete') {
        console.log('Deleting notification:', confirmDialog.notificationId)
        const response = await fetch("/api/admin/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: "delete", notificationId: confirmDialog.notificationId }),
        });
        
        const responseData = await response.json();
        console.log('Delete response:', responseData)
        
        if (response.ok && responseData.success) {
          showMessage(`✅ Notification deleted successfully.`, 'success');
          // Notify navbar to update notification count
          window.dispatchEvent(new CustomEvent('notificationRead'));
        } else {
          showMessage(`❌ Failed to delete notification: ${responseData.message || 'Unknown error'}`, 'error');
        }
      }
      
      await refresh();
      if (expandedId === confirmDialog.notificationId) setExpandedId(null);
    } catch (error) {
      console.error('Action failed:', error);
      showMessage(`❌ An error occurred while performing the action. Please try again.`, 'error');
    } finally {
      setActionLoading(false);
      setConfirmDialog({ open: false, action: null, notificationId: '', userName: '', userId: '' });
    }
  };


  const getTypeIcon = (type?: string) => {
    switch (type) {
      case "unblock_request":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "report":
      case "issue":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "reply":
        return <Reply className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };


  const getTypeBadge = (type?: string) => {
    switch (type) {
      case "unblock_request":
        return <Badge variant="outline" className="border-green-500 text-green-600">Unblock Request</Badge>;
      case "report":
        return <Badge variant="destructive">Report</Badge>;
      case "issue":
        return <Badge variant="outline" className="border-red-500 text-red-600">Issue</Badge>;
      case "reply":
        return <Badge variant="outline" className="border-blue-500 text-blue-600">Reply</Badge>;
      case "warning":
        return <Badge variant="outline" className="border-orange-500 text-orange-600">Warning</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };


  const filteredNotes =
    filter === "all"
      ? notes
      : notes.filter((n) => n.type === filter);


  if (loading) {
    return (
      <div className="p-4 sm:p-6 pt-20 sm:pt-24 max-w-4xl mx-auto">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-accent animate-pulse rounded-md" />
            <div className="h-4 w-96 bg-accent animate-pulse rounded-md" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-16 bg-accent animate-pulse rounded-md" />
            <div className="h-9 w-20 bg-accent animate-pulse rounded-md" />
            <div className="h-9 w-18 bg-accent animate-pulse rounded-md" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <NotificationSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="p-4 sm:p-6 pt-20 sm:pt-24 max-w-4xl mx-auto">
      <SuccessMessage
        show={show}
        message={message}
        type={type}
        onClose={hideMessage}
      />
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Notifications</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Review, filter, and act on user notifications and requests.</p>
      </div>


      {/* Filter and Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Button
              key={f.key}
              variant={filter === f.key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f.key)}
              className="transition-all text-xs sm:text-sm"
            >
              {f.label}
            </Button>
          ))}
        </div>
        {notes.length > 0 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteAllDialogOpen(true)}
              className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 text-xs sm:text-sm"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete All
            </Button>
          </div>
        )}
      </div>


      <div className="space-y-4">
        {filteredNotes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notifications</h3>
              <p className="text-muted-foreground text-center text-sm">
                You&apos;re all caught up! New notifications will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotes.map((n) => (
            <Card key={n._id} className="transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="flex-shrink-0 mt-0.5 sm:mt-0">
                      {getTypeIcon(n.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base">
                        {getTypeBadge(n.type)}
                      </CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1.5 text-xs sm:text-sm">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{new Date(n.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}, {new Date(n.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                          })}</span>
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="font-medium truncate">
                          {n.userName || n.userId}
                        </span>
                        {n.userRole === "blocked" && (
                          <Badge variant="destructive" className="text-xs">Blocked</Badge>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  
                  {/* Action buttons - all on separate row on mobile for better spacing */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {n.userRole === "blocked" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => showConfirmation('unblock', n._id, n.userName || n.userId, n.userId)}
                        className="text-green-600 hover:text-green-700 text-xs sm:text-sm"
                        aria-label="Unblock user"
                      >
                        <UserCheck className="h-4 w-4" />
                        <span className="ml-1">Unblock</span>
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => showConfirmation('block', n._id, n.userName || n.userId, n.userId)}
                        className="text-orange-600 hover:text-orange-700 text-xs sm:text-sm"
                        aria-label="Block user"
                      >
                        <UserMinus className="h-4 w-4" />
                        <span className="ml-1">Block</span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (replyingTo === n._id) {
                          setReplyingTo(null);
                          setReplyText("");
                        } else {
                          // Ensure notification is expanded first
                          if (expandedId !== n._id) {
                            setExpandedId(n._id);
                            // Auto-mark as read when viewing
                            markAsRead(n._id);
                          }
                          setReplyingTo(n._id);
                          setReplyText("");
                          // Auto-scroll to reply section after expansion animation
                          setTimeout(() => {
                            if (replyTextareaRef.current) {
                              replyTextareaRef.current.scrollIntoView({ 
                                behavior: 'smooth', 
                                block: 'center' 
                              });
                              replyTextareaRef.current.focus();
                            }
                          }, 350);
                        }
                      }}
                      className="text-blue-500 hover:text-blue-600 text-xs sm:text-sm"
                      aria-label="Reply to notification"
                    >
                      <Reply className="h-4 w-4" />
                      <span className="ml-1">Reply</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => showConfirmation('delete', n._id, n.userName || n.userId, n.userId)}
                      className="text-red-500 hover:text-red-600 text-xs sm:text-sm"
                      aria-label="Delete notification"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="ml-1">Delete</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (expandedId === n._id) {
                          setExpandedId(null);
                          // Also close reply if open
                          if (replyingTo === n._id) {
                            setReplyingTo(null);
                            setReplyText("");
                          }
                        } else {
                          setExpandedId(n._id);
                          // Auto-mark as read when viewing
                          markAsRead(n._id);
                        }
                      }}
                      className="gap-1 text-xs sm:text-sm"
                      aria-label={expandedId === n._id ? "Close" : "View"}
                    >
                      {expandedId === n._id ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          <span className="ml-1">Close</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          <span className="ml-1">View</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <AnimatePresence>
                {expandedId === n._id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <CardContent className="pt-0">
                      <p className="text-sm sm:text-base text-foreground leading-relaxed whitespace-pre-line break-words">
                        {n.message}
                      </p>
                      
                      {/* Reply Section */}
                      {replyingTo === n._id && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                          <h4 className="text-sm font-medium text-foreground">
                            {n.type === "reply" ? "Reply to User's Message" : "Reply to User"}
                          </h4>
                          <Textarea
                            ref={replyTextareaRef}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Type your response here..."
                            className="min-h-[100px] resize-none"
                            disabled={sendingReply}
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => sendReply(n.originalNotificationId || n._id, n.userId)}
                              disabled={!replyText.trim() || sendingReply}
                              size="sm"
                              className="gap-2"
                            >
                              <Send className="h-4 w-4" />
                              {sendingReply ? "Sending..." : "Send Reply"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyText("");
                              }}
                              disabled={sendingReply}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          ))
        )}
      </div>


      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">
              {confirmDialog.action === 'block' && 'Block User?'}
              {confirmDialog.action === 'unblock' && 'Unblock User?'}
              {confirmDialog.action === 'delete' && 'Delete Notification?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              {confirmDialog.action === 'block' && 
                `Are you sure you want to block ${confirmDialog.userName}? They will no longer be able to access the system until unblocked.`
              }
              {confirmDialog.action === 'unblock' && 
                `Are you sure you want to unblock ${confirmDialog.userName}? They will regain access to the system.`
              }
              {confirmDialog.action === 'delete' && 
                `Are you sure you want to delete this notification? This action cannot be undone.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel disabled={actionLoading} className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmAction}
              disabled={actionLoading}
              className={`w-full sm:w-auto text-white dark:text-white  ${
                confirmDialog.action === 'block' ? 'bg-orange-600 hover:bg-orange-700 ' :
                confirmDialog.action === 'unblock' ? 'bg-green-600 hover:bg-green-700' :
                'bg-red-600 hover:bg-red-700 text-white dark:text-white'
              }`}
            >
              {actionLoading ? 'Processing...' : 
                confirmDialog.action === 'block' ? 'Block User' :
                confirmDialog.action === 'unblock' ? 'Unblock User' :
                'Delete Notification'
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Confirmation Dialog */}
      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Delete All Notifications?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Are you sure you want to delete all {notes.length} notification{notes.length !== 1 ? 's' : ''}? 
              This action cannot be undone and will permanently remove all notifications from the admin panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel disabled={deletingAll} className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteAllNotifications}
              disabled={deletingAll}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white dark:text-white"
            >
              {deletingAll ? 'Deleting...' : 'Delete All Notifications'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};


export default AdminNotificationsPage;
