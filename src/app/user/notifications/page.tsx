"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Trash2, CheckCircle, AlertCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Notification {
  _id: string;
  message: string;
  type: "report" | "warning" | "info" | "unblock";
  read: boolean;
  createdAt: string;
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "report", label: "Reports" },
  { key: "unblock", label: "Unblocked" },
];

export default function UserNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
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
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Bell className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Notifications</h1>
              <p className="text-muted-foreground">
                Stay updated with important messages from administrators
              </p>
            </div>
          </div>

          {/* FILTER BUTTONS */}
          <div className="flex gap-2 mb-6">
            {FILTERS.map((f) => (
              <Button
                key={f.key}
                variant={filter === f.key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f.key)}
                className="transition-all"
              >
                {f.label}
              </Button>
            ))}
          </div>

          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                <p className="text-muted-foreground text-center">
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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getNotificationIcon(notification.type)}
                        <div>
                          <CardTitle className="text-base">
                            {getNotificationBadge(notification.type)}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3" />
                            {new Date(notification.createdAt).toLocaleString()}
                          </CardDescription>
                        </div>
                      </div>
                     <div className="flex items-center gap-2">
  {!notification.read && (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => markAsRead(notification._id)}
      className="text-primary hover:text-primary-600"
      aria-label="Mark as read"
    >
      <CheckCircle className="h-4 w-4" />
      <span className="ml-1">Mark as read</span>
    </Button>
  )}
  <Button
    variant="ghost"
    size="sm"
    onClick={() => deleteNotification(notification._id)}
    className="text-red-500 hover:text-red-600"
    aria-label="Delete notification"
  >
    <Trash2 className="h-4 w-4" />
    <span className="ml-1">Delete</span>
  </Button>
  {/* View/Close button */}
  <Button
    variant="outline"
    size="sm"
    onClick={() =>
      expandedId === notification._id
        ? setExpandedId(null)
        : setExpandedId(notification._id)
    }
    className="gap-1 ml-2"
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
                          <p className="text-foreground leading-relaxed whitespace-pre-line">
                            {notification.message}
                          </p>
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

          
        </motion.div>
      </div>
    </div>
  );
}
