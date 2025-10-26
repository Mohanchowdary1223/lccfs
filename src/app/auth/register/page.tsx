"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()
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

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      showMessage("Passwords do not match", "error")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await response.json()
      if (response.ok) {
        // Store token and user data for automatic login
        localStorage.setItem("token", data.token)
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user))
        
        showMessage("🎉 Account created successfully! Redirecting...", "success")
        setTimeout(() => {
          // Redirect to user chatbot instead of login page
          router.push("/user/chatbot")
        }, 1500)
      } else {
        setError(data.message || "Registration failed")
        showMessage(data.message || "Registration failed", "error")
      }
    } catch {
      setError("An error occurred. Please try again.")
      showMessage("An error occurred. Please try again.", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    if (loading) return // Prevent double clicks
    
    try {
      setLoading(true)
      setError("")
      showMessage("Redirecting to Google Sign-In...", "info")
      
      // Import Google auth utilities
      const { signInWithGoogle } = await import('@/lib/google-auth')
      signInWithGoogle()
      
    } catch (error) {
      console.error('Google signup error:', error)
      const errorMessage = error instanceof Error ? error.message : "Failed to initialize Google Sign-In"
      setError(errorMessage)
      showMessage(errorMessage, "error")
      setLoading(false)
    } finally {
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

      {/* Back Button */}
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
            <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
            <CardDescription>Register to access the chatbot</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-muted"></div>
              <span className="px-3 text-sm text-muted-foreground">OR</span>
              <div className="flex-grow border-t border-muted"></div>
            </div>

            {/* Continue with Google */}
            <Button
              onClick={handleGoogleSignup}
              variant="outline"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 border border-gray-300 bg-white hover:bg-gray-50 text-black dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700 font-medium"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-white"></div>
              ) : (
                <Image
                  src="/google.svg"
                  alt="Google logo"
                  width={20}
                  height={20}
                />
              )}
              {loading ? "Signing up..." : "Continue with Google"}
            </Button>

            <div className="mt-6 text-center text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary hover:underline">
                Sign in here
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
