"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function GoogleSetup() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  const openGoogleConsole = () => {
    window.open(`https://console.cloud.google.com/apis/credentials/oauthclient/${clientId?.replace('.apps.googleusercontent.com', '')}`, '_blank')
  }

  const copySettings = () => {
    const settings = `Google Cloud Console Settings:

Authorized JavaScript origins:
http://localhost:3000

Authorized redirect URIs:
http://localhost:3000/auth/google-callback`

    navigator.clipboard.writeText(settings)
    alert('Settings copied to clipboard!')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-red-600">🚨 Fix redirect_uri_mismatch</CardTitle>
          <CardDescription>
            Add the redirect URI to Google Cloud Console
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <h3 className="font-semibold text-red-800 mb-2">Current Error:</h3>
            <code className="text-sm text-red-700 bg-red-100 p-2 rounded block">
              redirect_uri=http://localhost:3000/auth/google-callback
            </code>
            <p className="text-red-700 text-sm mt-2">
              This redirect URI is <strong>NOT REGISTERED</strong> in Google Cloud Console.
            </p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <h3 className="font-semibold text-blue-800 mb-2">Required Settings:</h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium text-blue-700">Client ID:</p>
                <code className="text-xs text-blue-600 bg-blue-100 p-1 rounded">{clientId}</code>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">Authorized JavaScript origins:</p>
                <code className="text-xs text-blue-600 bg-blue-100 p-1 rounded block">http://localhost:3000</code>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">Authorized redirect URIs:</p>
                <code className="text-xs text-blue-600 bg-blue-100 p-1 rounded block">http://localhost:3000/auth/google-callback</code>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button onClick={openGoogleConsole} className="w-full" size="lg">
              🔗 Open Google Cloud Console
            </Button>
            
            <Button onClick={copySettings} variant="outline" className="w-full">
              📋 Copy Settings to Clipboard
            </Button>
          </div>

          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <h3 className="font-semibold text-green-800 mb-2">Step-by-Step Fix:</h3>
            <ol className="list-decimal list-inside text-green-700 text-sm space-y-1">
              <li>Click &quot;Open Google Cloud Console&quot; above</li>
              <li>In the OAuth client settings, find &quot;Authorized redirect URIs&quot;</li>
              <li>Click &quot;+ ADD URI&quot;</li>
              <li>Add: <code className="bg-green-100 px-1">http://localhost:3000/auth/google-callback</code></li>
              <li>Click &quot;SAVE&quot;</li>
              <li>Wait 2-3 minutes for changes to take effect</li>
              <li>Test login again</li>
            </ol>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Important:</h3>
            <ul className="list-disc list-inside text-yellow-700 text-sm space-y-1">
              <li>Use <strong>http://</strong> (not https://)</li>
              <li>No trailing slash at the end</li>
              <li>Exact spelling: <code>/auth/google-callback</code></li>
              <li>Wait 2-3 minutes after saving before testing</li>
            </ul>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}