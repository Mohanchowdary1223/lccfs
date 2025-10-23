"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserMinus, UserCheck, Trash2, AlertCircle, CheckCircle, Bell, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

type Notification = { _id: string; userId: string; message: string; type?: string; createdAt: string };
type NoteWithUser = Notification & { userName?: string; userRole?: string };

const FILTERS = [
  { key: "all", label: "All" },
  { key: "unblock_request", label: "Unblock Requests" },
  { key: "issue", label: "Issues" },
];

const AdminNotificationsPage = () => {
  const [notes, setNotes] = useState<NoteWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
          alert(`✅ ${confirmDialog.userName} has been successfully blocked. They will no longer have access to the platform.`);
        } else {
          alert(`❌ Failed to block ${confirmDialog.userName}. Please try again.`);
        }
      } else if (confirmDialog.action === 'unblock') {
        const response = await fetch("/api/admin/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: "unblock", notificationId: confirmDialog.notificationId }),
        });
        
        if (response.ok) {
          alert(`✅ ${confirmDialog.userName} has been successfully unblocked and notified. They can now access the platform again.`);
        } else {
          alert(`❌ Failed to unblock ${confirmDialog.userName}. Please try again.`);
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
          alert(`✅ Notification deleted successfully.`);
        } else {
          alert(`❌ Failed to delete notification: ${responseData.message || 'Unknown error'}`);
        }
      }
      
      await refresh();
      if (expandedId === confirmDialog.notificationId) setExpandedId(null);
    } catch (error) {
      console.error('Action failed:', error);
      alert(`❌ An error occurred while performing the action. Please try again.`);
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
        return <Bell className="h-5 w-5 text-blue-500" />;
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
        return <Badge variant="secondary">Reply</Badge>;
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pt-24 max-w-4xl mx-auto">
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Notifications</h1>
        <p className="text-muted-foreground">Review, filter, and act on user notifications and requests.</p>
      </div>

      {/* Filter buttons */}
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

      <div className="space-y-4">
        {filteredNotes.length === 0 ? (
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
          filteredNotes.map((n) => (
            <Card key={n._id} className="transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(n.type)}
                    <div>
                      <CardTitle className="text-base">
                        {getTypeBadge(n.type)}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3" />
                        {new Date(n.createdAt).toLocaleString()}
                        <span className="ml-2 text-xs text-muted-foreground font-medium">
                          {n.userName || n.userId}
                        </span>
                        {n.userRole === "blocked" && (
                          <Badge variant="destructive">Blocked User</Badge>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                 <div className="flex items-center gap-2">
  {n.userRole === "blocked" ? (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => showConfirmation('unblock', n._id, n.userName || n.userId, n.userId)}
      className="text-green-600 hover:text-green-700"
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
      className="text-orange-600 hover:text-orange-700"
      aria-label="Block user"
    >
      <UserMinus className="h-4 w-4" />
      <span className="ml-1">Block</span>
    </Button>
  )}
  <Button
    variant="ghost"
    size="sm"
    onClick={() => showConfirmation('delete', n._id, n.userName || n.userId, n.userId)}
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
      expandedId === n._id
        ? setExpandedId(null)
        : setExpandedId(n._id)
    }
    className="gap-1 ml-2"
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
                      <p className="text-foreground leading-relaxed whitespace-pre-line">
                        {n.message}
                      </p>
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'block' && 'Block User?'}
              {confirmDialog.action === 'unblock' && 'Unblock User?'}
              {confirmDialog.action === 'delete' && 'Delete Notification?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
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
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmAction}
              disabled={actionLoading}
              className={
                confirmDialog.action === 'block' ? 'bg-orange-600 hover:bg-orange-700' :
                confirmDialog.action === 'unblock' ? 'bg-green-600 hover:bg-green-700' :
                'bg-red-600 hover:bg-red-700'
              }
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
    </div>
  );
};

export default AdminNotificationsPage;
