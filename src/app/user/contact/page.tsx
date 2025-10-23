"use client";
import React, { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";

export default function ContactPage() {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      const userStr = localStorage.getItem("user");
      const userId = userStr ? (JSON.parse(userStr).id || JSON.parse(userStr)._id) : null;
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId || "anonymous",
          message: `Issue from user: ${message}`,
          type: "issue",
        }),
      });
      alert("✅ Issue submitted successfully! Our support team will review your request and respond soon.");
      setMessage("");
    } catch (e) {
      console.error(e);
      alert("❌ Failed to submit issue. Please try again or contact support directly.");
    }
    setSending(false);
  };

  return (
    <div className="min-h-screen pt-24 flex items-center justify-center bg-background">
      <Card className="w-full max-w-lg shadow-lg border">
        <CardHeader className="pb-2">
          <h1 className="text-2xl font-bold text-foreground">Contact Support</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Need help or found a problem? Submit your issue below and our support team will respond shortly.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 pt-1">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="resize-none min-h-[120px]"
              placeholder="Describe your issue or question here..."
              disabled={sending}
              maxLength={1000}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSend}
                disabled={sending || !message.trim()}
                className="gap-2"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
