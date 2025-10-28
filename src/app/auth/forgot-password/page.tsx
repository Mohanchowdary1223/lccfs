"use client"

import { useState, Suspense, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
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
import { ArrowLeft, Eye, EyeOff, Mail, Lock } from "lucide-react"

enum Step {
  EMAIL_VERIFICATION = 1,
  OTP_VERIFICATION = 2,
  PASSWORD_RESET = 3,
}

function ForgotPasswordForm() {
  const [currentStep, setCurrentStep] = useState<Step>(Step.EMAIL_VERIFICATION)
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const otpInputs = useRef<Array<HTMLInputElement | null>>([])
  const [otpStatusMessage, setOtpStatusMessage] = useState("")
  const [otpStatusType, setOtpStatusType] = useState<"error" | "success" | "info" | "" >("")
  const [emailStatusMessage, setEmailStatusMessage] = useState("")
  const [emailStatusType, setEmailStatusType] = useState<"error" | "success" | "info" | "" >("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  // finer-grained loading / state flags for better UX
  const [verifyingEmail, setVerifyingEmail] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtpLoading, setVerifyingOtpLoading] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [error, setError] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  
  // OTP input helpers
  const focusOtpInput = (index: number) => {
    const el = otpInputs.current[index]
    if (el) el.focus()
  }

  const handleOtpChangeAt = (index: number, value: string) => {
    // accept only digits, single char
    const digit = value.replace(/\D/g, "").slice(-1)
    const arr = otp.split("")
    while (arr.length < 6) arr.push("")
    arr[index] = digit
    const newOtp = arr.join("")
    setOtp(newOtp)
    if (digit && index < 5) focusOtpInput(index + 1)
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key
    if (key === "Backspace") {
      const arr = otp.split("")
      while (arr.length < 6) arr.push("")
      if (arr[index]) {
        arr[index] = ""
        setOtp(arr.join(""))
      } else if (index > 0) {
        focusOtpInput(index - 1)
      }
    } else if (key === "ArrowLeft" && index > 0) {
      focusOtpInput(index - 1)
    } else if (key === "ArrowRight" && index < 5) {
      focusOtpInput(index + 1)
    }
  }
  const router = useRouter()
  const {
    show: showSuccessMessage,
    message: successMessage,
    type: messageType,
    showMessage,
    hideMessage,
  } = useSuccessMessage()

  const handleEmailVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
  setVerifyingEmail(true)
  setEmailVerified(false)
    
    try {
      const response = await fetch("/api/auth/forgot-password/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      
      const data = await response.json()

      if (response.ok) {
        // mark email as verified and keep user on same step so they can click Send OTP
        setEmailVerified(true)
        setEmailStatusMessage("Email verified. Click 'Send OTP' to receive the code.")
        setEmailStatusType("success")
        showMessage("Email verified. Click 'Send OTP' to receive the code.", "success")
      } else {
        setError(data.message || "Email verification failed")
        setEmailStatusMessage(data.message || "Email verification failed")
        setEmailStatusType("error")
        showMessage(data.message || "Email verification failed", "error")
      }
    } catch {
      setError("An error occurred. Please try again.")
      showMessage("An error occurred. Please try again.", "error")
    } finally {
      setLoading(false)
      setVerifyingEmail(false)
    }
  }

  const handleSendOTP = async () => {
    // send OTP and move to OTP entry step; hide email input and verify status
    setSendingOtp(true)
    setError("")
    try {
      const response = await fetch("/api/auth/forgot-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()

      if (response.ok) {
        // move to OTP entry
        setCurrentStep(Step.OTP_VERIFICATION)
        setOtpStatusMessage("OTP sent to your email. Enter the 6-digit code below.")
        setOtpStatusType("success")
        // set resend cooldown (5 minutes)
        setResendSeconds(300)
        showMessage("OTP sent to your email! Please check your inbox.", "success")
      } else {
        const msg = data.message || "Failed to send OTP"
        setError(msg)
        setOtpStatusMessage(msg)
        setOtpStatusType("error")
        showMessage(msg, "error")
      }
    } catch (err) {
      console.error(err)
      setError("An error occurred. Please try again.")
      showMessage("An error occurred. Please try again.", "error")
    } finally {
      setSendingOtp(false)
      setLoading(false)
    }
  }

  // Resend cooldown state and timer
  const [resendSeconds, setResendSeconds] = useState(0)

  useEffect(() => {
    if (resendSeconds <= 0) return
    const t = setInterval(() => {
      setResendSeconds((s) => Math.max(0, s - 1))
    }, 1000)
    return () => clearInterval(t)
  }, [resendSeconds])

  const handleResendClick = async () => {
    if (resendSeconds > 0 || sendingOtp) return
    await handleSendOTP()
    // handleSendOTP sets resendSeconds when successful
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setVerifyingOtpLoading(true)
    setError("")
    setOtpStatusMessage("")
    setOtpStatusType("")
    
    try {
      const response = await fetch("/api/auth/forgot-password/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      })
      
      const data = await response.json()

      if (response.ok) {
        showMessage("OTP verified successfully! Set your new password.", "success")
        // move to password reset step and hide OTP input
        setCurrentStep(Step.PASSWORD_RESET)
        setOtpStatusMessage("")
        setOtpStatusType("")
      } else {
        const msg = data.message || "OTP verification failed"
        setError(msg)
        setOtpStatusMessage(msg)
        setOtpStatusType("error")
        showMessage(msg, "error")
      }
    } catch {
      setError("An error occurred. Please try again.")
      showMessage("An error occurred. Please try again.", "error")
    } finally {
      setVerifyingOtpLoading(false)
      setLoading(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setResettingPassword(true)
    setError("")

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      showMessage("Passwords do not match", "error")
      setLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long")
      showMessage("Password must be at least 6 characters long", "error")
      setLoading(false)
      return
    }
    
    try {
      const response = await fetch("/api/auth/forgot-password/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      })
      
      const data = await response.json()

      if (response.ok) {
        showMessage("Password changed successfully! Redirecting to login...", "success")
        setTimeout(() => {
          router.push("/auth/login")
        }, 2000)
      } else {
        setError(data.message || "Password reset failed")
        showMessage(data.message || "Password reset failed", "error")
      }
    } catch {
      setError("An error occurred. Please try again.")
      showMessage("An error occurred. Please try again.", "error")
    } finally {
      setResettingPassword(false)
      setLoading(false)
    }
  }

  const renderEmailVerificationStep = () => (
    <form onSubmit={handleEmailVerification} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md">
          {error}
        </div>
      )}
      <div className="space-y-2">
        {/* Email verification status shown above the input */}
        {emailStatusMessage && (
          <div className={`p-2 text-sm rounded-md ${emailStatusType === 'error' ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : emailStatusType === 'success' ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-muted-foreground'}`}>
            {emailStatusMessage}
          </div>
        )}
        <Label htmlFor="email">Email Address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            placeholder="Enter your email address"
            required
          />
        </div>
      </div>
      {/* If email is verified show Send OTP button instead of Verify */}
      {!emailVerified ? (
        <Button type="submit" className="w-full" disabled={verifyingEmail || loading}>
          {verifyingEmail ? "Checking..." : "Verify Email"}
        </Button>
      ) : (
        <Button type="button" onClick={handleSendOTP} className="w-full" disabled={sendingOtp}>
          {sendingOtp ? "Sending..." : "Send OTP"}
        </Button>
      )}

      {/* Show verification status if email was checked */}
      {/* we show verification status above the input; no extra text here */}
    </form>
  )

  const renderOTPVerificationStep = () => (
    <div className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md">
          {error}
        </div>
      )}
      {/* After sending OTP we show only the OTP input and verify button */}
      <div className="text-center p-2 text-sm text-muted-foreground">Enter the 6-digit OTP sent to your email</div>

      <form onSubmit={handleVerifyOTP} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="otp">6-Digit OTP</Label>

          {/* OTP status message directly above input boxes */}
          {otpStatusMessage && (
            <div className={`p-2 text-sm rounded-md ${otpStatusType === 'error' ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : otpStatusType === 'success' ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-muted-foreground'}`}>
              {otpStatusMessage}
            </div>
          )}

          <div className="mt-2 flex justify-center gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <input
                key={i}
                ref={(el) => { otpInputs.current[i] = el }}
                value={otp.charAt(i) || ''}
                onChange={(e) => handleOtpChangeAt(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className="w-12 h-12 text-center border rounded-md text-lg focus:outline-none focus:ring-2 focus:ring-primary"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                aria-label={`OTP digit ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Resend control centered between inputs and Verify button */}
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-2">Didn&apos;t receive the code?</div>
          <button
            type="button"
            onClick={handleResendClick}
            disabled={resendSeconds > 0 || sendingOtp}
            className={`text-sm font-medium ${resendSeconds > 0 || sendingOtp ? 'text-muted-foreground' : 'text-primary hover:underline'}`}
          >
            {resendSeconds > 0 ? `Resend OTP in ${Math.floor(resendSeconds / 60)}:${String(resendSeconds % 60).padStart(2, '0')}` : sendingOtp ? 'Sending...' : 'Resend OTP'}
          </button>
        </div>

        <Button type="submit" className="w-full" disabled={verifyingOtpLoading || otp.replace(/\D/g, '').length !== 6}>
          {verifyingOtpLoading ? "Verifying..." : "Verify OTP"}
        </Button>
      </form>
    </div>
  )

  const renderPasswordResetStep = () => (
    <form onSubmit={handlePasswordReset} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md">
          {error}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="newPassword"
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="pl-10"
            placeholder="Enter new password"
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowNewPassword(!showNewPassword)}
          >
            {showNewPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="pl-10"
            placeholder="Confirm new password"
            required
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={resettingPassword}>
        {resettingPassword ? "Changing Password..." : "Change Password"}
      </Button>
    </form>
  )

  const getStepTitle = () => {
    switch (currentStep) {
      case Step.EMAIL_VERIFICATION:
        return "Forgot Password"
      case Step.OTP_VERIFICATION:
        return "Verify Email"
      case Step.PASSWORD_RESET:
        return "Reset Password"
      default:
        return "Forgot Password"
    }
  }

  const getStepDescription = () => {
    switch (currentStep) {
      case Step.EMAIL_VERIFICATION:
        return "Enter your email address to reset your password"
      case Step.OTP_VERIFICATION:
        return "We'll send a verification code to your email"
      case Step.PASSWORD_RESET:
        return "Create a new password for your account"
      default:
        return "Enter your email address to reset your password"
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
        onClick={() => router.push("/auth/login")}
        className="fixed top-4 left-4 h-10 w-10 rounded-full bg-background border shadow-md hover:bg-accent z-10"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>

      <div className="w-full max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">{getStepTitle()}</CardTitle>
            <CardDescription>{getStepDescription()}</CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === Step.EMAIL_VERIFICATION && renderEmailVerificationStep()}
            {currentStep === Step.OTP_VERIFICATION && renderOTPVerificationStep()}
            {currentStep === Step.PASSWORD_RESET && renderPasswordResetStep()}

            <div className="mt-6 text-center text-sm">
              Remember your password?{" "}
              <Link href="/auth/login" className="text-primary hover:underline">
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  )
}