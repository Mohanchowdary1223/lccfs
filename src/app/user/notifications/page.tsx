"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Trash2, CheckCircle, AlertCircle, Clock, ChevronDown, ChevronUp, Reply, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { NotificationSkeleton } from "@/components/ui/loading-skeletons";


interface Notification {
  _id: string;
  message: string;
  type: "report" | "warning" | "info" | "unblock" | "reply";
  read: boolean;
  createdAt: string;
  reportedBy?: string;
  originalNotificationId?: string;
}


const FILTERS = [
  { key: "all", label: "All" },
  { key: "report", label: "Reports" },
  { key: "reply", label: "Replies" },
  { key: "unblock", label: "Unblocked" },
];


export default function UserNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);


  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    if (userStr) {
      try {
        JSON.parse(userStr);
      } catch {
        router.push("/auth/login");
        return;
      }
    }
    fetchNotifications();
  }, [router]);


  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/user/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      } else {
        console.error("Failed to fetch notifications");
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };


  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/user/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notificationId, action: "mark_read" }),
      });


      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
        );
        // Notify navbar to update notification count
        window.dispatchEvent(new CustomEvent('notificationRead'));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };


  const sendReply = async (originalNotificationId: string) => {
    if (!replyText.trim()) return;

    setSendingReply(true);
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      
      const response = await fetch("/api/user/notifications/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          originalNotificationId,
          replyMessage: replyText,
          senderName: user.name || "User"
        }),
      });

      if (response.ok) {
        setReplyText("");
        setReplyingTo(null);
        // Optionally refresh notifications or show success message
      } else {
        console.error("Failed to send reply");
      }
    } catch (error) {
      console.error("Error sending reply:", error);
    } finally {
      setSendingReply(false);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/user/notifications", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notificationId }),
      });


      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
        if (expandedId === notificationId) setExpandedId(null);
        // Notify navbar to update notification count
        window.dispatchEvent(new CustomEvent('notificationRead'));
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const deleteAllNotifications = async () => {
    setDeletingAll(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/user/notifications/delete-all", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications([]);
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


  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "report":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case "unblock":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "reply":
        return <Reply className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };


  const getNotificationBadge = (type: string) => {
    switch (type) {
      case "report":
        return <Badge variant="destructive">Report</Badge>;
      case "warning":
        return <Badge variant="outline" className="border-orange-500 text-orange-600">Warning</Badge>;
      case "unblock":
        return <Badge variant="outline" className="border-green-500 text-green-600">Unblocked</Badge>;
      case "reply":
        return <Badge variant="outline" className="border-blue-500 text-blue-600">Reply</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };


  // Filter notifications based on filter button
  const filteredNotifications =
    filter === "all"
      ? notifications
      : notifications.filter((n) => n.type === filter);


  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-4xl">
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
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background pt-20 pb-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-start sm:items-center gap-3 mb-6">
            <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0 mt-1 sm:mt-0" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Notifications</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Stay updated with important messages from administrators
              </p>
            </div>
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
            {notifications.length > 0 && (
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


          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-base sm:text-lg font-semibold mb-2">No notifications</h3>
                <p className="text-sm text-muted-foreground text-center">
                  You&apos;re all caught up! New notifications will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <Card
                  key={notification._id}
                  className={`transition-shadow ${!notification.read ? "border-primary/50 bg-primary/5" : ""}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        <div className="flex-shrink-0 mt-0.5 sm:mt-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base">
                            {getNotificationBadge(notification.type)}
                            {!notification.read && (
                              <Badge variant="secondary" className="ml-2 text-xs">New</Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1 text-xs sm:text-sm">
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{new Date(notification.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}, {new Date(notification.createdAt).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false
                            })}</span>
                          </CardDescription>
                        </div>
                      </div>
                      
                      {/* Action buttons - all on separate row on mobile for better spacing */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification._id)}
                            className="text-primary hover:text-primary-600 text-xs sm:text-sm"
                            aria-label="Mark as read"
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span className="ml-1">Mark as read</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (replyingTo === notification._id) {
                              setReplyingTo(null);
                              setReplyText("");
                            } else {
                              // Ensure notification is expanded first
                              if (expandedId !== notification._id) {
                                setExpandedId(notification._id);
                                // Auto-mark as read when viewing
                                if (!notification.read) {
                                  markAsRead(notification._id);
                                }
                              }
                              setReplyingTo(notification._id);
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
                          onClick={() => deleteNotification(notification._id)}
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
                            if (expandedId === notification._id) {
                              setExpandedId(null)
                              // Also close reply if open
                              if (replyingTo === notification._id) {
                                setReplyingTo(null);
                                setReplyText("");
                              }
                            } else {
                              setExpandedId(notification._id)
                              // Auto-mark as read when viewing
                              if (!notification.read) {
                                markAsRead(notification._id)
                              }
                            }
                          }}
                          className="gap-1 text-xs sm:text-sm"
                          aria-label={expandedId === notification._id ? "Close" : "View"}
                        >
                          {expandedId === notification._id ? (
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
                    {expandedId === notification._id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <CardContent className="pt-0">
                          <p className="text-sm sm:text-base text-foreground leading-relaxed whitespace-pre-line break-words">
                            {notification.message}
                          </p>
                          
                          {/* Reply Section */}
                          {replyingTo === notification._id && (
                            <div className="mt-4 pt-4 border-t space-y-3">
                              <h4 className="text-sm font-medium text-foreground">
                                {notification.type === "reply" ? "Reply to this message" : "Reply to Admin"}
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
                                  onClick={() => sendReply(notification._id)}
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

                          {!notification.read && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-xs text-muted-foreground">
                                This notification is unread. Click the checkmark to mark as read.
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              ))}
            </div>
          )}

          {/* Delete All Confirmation Dialog */}
          <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
            <AlertDialogContent className="max-w-[95vw] sm:max-w-lg">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-base sm:text-lg">Delete All Notifications?</AlertDialogTitle>
                <AlertDialogDescription className="text-sm">
                  Are you sure you want to delete all {notifications.length} notification{notifications.length !== 1 ? 's' : ''}? 
                  This action cannot be undone and will permanently remove all your notifications.
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
          
        </motion.div>
      </div>
    </div>
  );

}
