"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  SuccessMessage,
  useSuccessMessage,
} from "@/components/ui/success-message"
import { ArrowLeft, Eye, EyeOff } from "lucide-react"

function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get("returnUrl")
  const {
    show: showSuccessMessage,
    message: successMessage,
    type: messageType,
    showMessage,
    hideMessage,
  } = useSuccessMessage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()

      if (response.ok) {
        localStorage.setItem("token", data.token)
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user))
        showMessage("Login successful! Redirecting...", "success")
        setTimeout(() => {
          if (returnUrl) {
            router.push(decodeURIComponent(returnUrl))
            return
          }
          if (data.role === "admin") {
            router.push("/admin/dashboard")
          } else if (data.role === "blocked") {
            localStorage.setItem(
              "blockedUser",
              JSON.stringify(data.user || { id: data.user?.id || "" })
            )
            router.push("/user/unblock")
          } else {
            router.push("/user/chatbot")
          }
        }, 1000)
      } else {
        setError(data.message || "Login failed")
        showMessage(data.message || "Login failed", "error")
      }
    } catch {
      setError("An error occurred. Please try again.")
      showMessage("An error occurred. Please try again.", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    if (loading) return // Prevent double clicks
    
    try {
      setLoading(true)
      setError("")
      showMessage("Redirecting to Google Sign-In...", "info")
      
      // Import and use Google auth utilities
      const { signInWithGoogle } = await import('@/lib/google-auth')
      signInWithGoogle()
      
    } catch (error) {
      console.error('Google login error:', error)
      const errorMessage = error instanceof Error ? error.message : "Failed to initialize Google Sign-In"
      setError(errorMessage)
      showMessage(errorMessage, "error")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <SuccessMessage
        show={showSuccessMessage}
        message={successMessage}
        type={messageType}
        onClose={hideMessage}
      />

      <Button
        variant="ghost"
        size="icon"
        onClick={() => router.push("/")}
        className="fixed top-4 left-4 h-10 w-10 rounded-full bg-background border shadow-md hover:bg-accent z-10"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>

      <div className="w-full max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            {/* OR Divider */}
            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-muted"></div>
              <span className="px-3 text-sm text-muted-foreground">OR</span>
              <div className="flex-grow border-t border-muted"></div>
            </div>

            {/* Continue with Google */}
            <Button
              onClick={handleGoogleLogin}
              variant="outline"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 border border-gray-300 bg-white hover:bg-gray-50 text-black dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-white"></div>
              ) : (
                <Image
                  src="/google.svg"
                  alt="Google Logo"
                  width={20}
                  height={20}
                />
              )}
              {loading ? "Signing in..." : "Continue with Google"}
            </Button>

            <div className="mt-6 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/auth/register" className="text-primary hover:underline">
                Register here
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
