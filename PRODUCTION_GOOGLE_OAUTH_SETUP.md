# 🚀 PRODUCTION DEPLOYMENT - Google OAuth Setup

## 🎯 Problem
- ✅ Works on `http://localhost:3000`
- ❌ Doesn't work on `https://lccfs.vercel.app`

## 🔧 COMPLETE SOLUTION

### Step 1: Google Cloud Console Settings

**Go to**: https://console.cloud.google.com/apis/credentials (find your OAuth 2.0 Client ID)

**Add BOTH localhost AND production URLs:**

#### Authorized JavaScript origins:
```
http://localhost:3000
https://lccfs.vercel.app
```

#### Authorized redirect URIs:
```
http://localhost:3000/auth/google-callback
https://lccfs.vercel.app/auth/google-callback
```

### Step 2: Vercel Environment Variables

**Go to**: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

**Add these variables:**

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `your_google_client_id_here` |
| `GOOGLE_CLIENT_SECRET` | `your_google_client_secret_here` |
| `MONGODB_URI` | `your_mongodb_connection_string_here` |
| `JWT_SECRET` | `your_jwt_secret_here` |
| `API_KEY` | `your_google_api_key_here` |

**Note**: Use the same values from your `.env.local` file

### Step 3: Deploy Changes

After updating Google Cloud Console and Vercel environment variables:

1. **Save changes** in Google Cloud Console
2. **Save environment variables** in Vercel
3. **Redeploy** your app (or it will auto-deploy)
4. **Wait 2-3 minutes** for Google changes to propagate

### Step 4: Test Both Environments

#### Local Testing:
- http://localhost:3000/auth/login ✅ Should work

#### Production Testing:
- https://lccfs.vercel.app/auth/login ✅ Should work after setup

## 🎯 Key Points

### URLs That Will Work:
- `http://localhost:3000/auth/google-callback` (development)
- `https://lccfs.vercel.app/auth/google-callback` (production)

### Code Changes Made:
- ✅ Dynamic redirect URI based on current domain
- ✅ Works automatically for any domain
- ✅ Added debug logging

## 🚨 Troubleshooting

### If still not working:
1. **Double-check** Google Cloud Console has BOTH URLs
2. **Verify** Vercel environment variables are set
3. **Wait 5 minutes** for changes to propagate
4. **Check browser console** for any errors
5. **Try incognito/private** browser window

### Common Issues:
- ❌ Forgot to add production URL to Google Console
- ❌ Missing environment variables in Vercel
- ❌ Using HTTP instead of HTTPS for production
- ❌ Not waiting for Google changes to propagate

## ✅ Success Indicators

When working correctly:
- Local: `http://localhost:3000` → Google OAuth → Success
- Production: `https://lccfs.vercel.app` → Google OAuth → Success
- No redirect_uri_mismatch errors
- Smooth authentication flow

## 🔄 Quick Checklist

- [ ] Added `https://lccfs.vercel.app` to Google Console JavaScript origins
- [ ] Added `https://lccfs.vercel.app/auth/google-callback` to Google Console redirect URIs
- [ ] Added all environment variables to Vercel
- [ ] Redeployed the application
- [ ] Waited 2-3 minutes for changes
- [ ] Tested production URL