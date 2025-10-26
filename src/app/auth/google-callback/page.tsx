"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"

function GoogleCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState("Processing Google authentication...")

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const error = searchParams.get('error')

        if (error) {
          setStatus("Authentication failed: " + error)
          setTimeout(() => router.push('/auth/login'), 3000)
          return
        }

        if (!code) {
          setStatus("No authorization code received")
          setTimeout(() => router.push('/auth/login'), 3000)
          return
        }

        setStatus("Exchanging code for user information...")

        // Send code to our backend to handle the OAuth exchange
        const response = await fetch('/api/auth/google-exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            redirect_uri: `${window.location.origin}/auth/google-callback`,
          }),
        })

        const data = await response.json()

        if (response.ok) {
          localStorage.setItem("token", data.token)
          if (data.user) localStorage.setItem("user", JSON.stringify(data.user))

          setStatus("Success! Redirecting...")

          // Check if we have a return URL
          const returnUrl = sessionStorage.getItem('google_auth_return_url')
          sessionStorage.removeItem('google_auth_return_url')

          setTimeout(() => {
            if (returnUrl && returnUrl.includes('/auth/register')) {
              router.push("/user/chatbot")
            } else if (data.role === "admin") {
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
          setStatus("Authentication failed: " + (data.message || "Unknown error"))
          setTimeout(() => router.push('/auth/login'), 3000)
        }

      } catch (error) {
        console.error('Google auth callback error:', error)
        setStatus("Authentication failed: " + (error instanceof Error ? error.message : "Unknown error"))
        setTimeout(() => router.push('/auth/login'), 3000)
      }
    }

    handleGoogleCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  )
}

export default function GoogleCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  )
}