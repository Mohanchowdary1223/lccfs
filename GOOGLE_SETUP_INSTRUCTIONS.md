# 🚨 URGENT: Fix redirect_uri_mismatch Error

## The Exact Problem
```
Error: redirect_uri=http://localhost:3000/auth/google-callback
```

This redirect URI is **NOT REGISTERED** in your Google Cloud Console.

## 🎯 EXACT FIX NEEDED

### Your Client ID:
`101114300306-sipgq0aa5g19fk01mbnt483nda826brh.apps.googleusercontent.com`

### Direct Link to Fix:
https://console.cloud.google.com/apis/credentials/oauthclient/101114300306-sipgq0aa5g19fk01mbnt483nda826brh

## 📋 STEP-BY-STEP INSTRUCTIONS

### Step 1: Open Google Cloud Console
Click the link above or go to:
- https://console.cloud.google.com/apis/credentials
- Find OAuth 2.0 Client ID: `101114300306-sipgq0aa5g19fk01mbnt483nda826brh`
- Click on it

### Step 2: Add Redirect URI
In the OAuth client settings:
1. Find "Authorized redirect URIs" section
2. Click "+ ADD URI"
3. Enter EXACTLY: `http://localhost:3000/auth/google-callback`
4. Click "SAVE"

### Step 3: Verify Settings
Make sure you have both:
- **Authorized JavaScript origins**: `http://localhost:3000`
- **Authorized redirect URIs**: `http://localhost:3000/auth/google-callback`

### Step 4: Wait and Test
1. Wait 2-3 minutes for Google to update
2. Clear browser cache (Ctrl+Shift+R)
3. Test login at: http://localhost:3000/auth/login

## ✅ Success Check
After adding the redirect URI, when you click "Continue with Google":
- Should redirect to Google login page (no error)
- Complete authentication
- Redirect back to your app
- Automatic login

## 🔧 Setup Tool
Visit: http://localhost:3000/google-setup
- Shows exact settings needed
- Direct link to Google Console
- Copy/paste ready settings

## ❌ Common Mistakes
- Using `https://` instead of `http://`
- Missing the redirect URI entirely
- Adding extra slashes or characters
- Not waiting for changes to propagate

The fix is simple: **Add the exact redirect URI to Google Cloud Console**!