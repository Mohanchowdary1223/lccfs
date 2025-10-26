export interface GoogleUser {
  name: string;
  email: string;
  picture?: string;
}

// Simple direct redirect method - no popups, no complex callbacks
export const signInWithGoogle = () => {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('Google Client ID not configured');
  }

  // Store the current page URL so we can redirect back after auth
  const returnUrl = window.location.href;
  sessionStorage.setItem('google_auth_return_url', returnUrl);

  // Create OAuth URL for direct redirect
  const redirectUri = `${window.location.origin}/auth/google-callback`;
  const scope = 'openid email profile';
  const state = Math.random().toString(36).substring(2, 15);
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(clientId)}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(scope)}&` +
    `response_type=code&` +
    `state=${state}&` +
    `prompt=select_account&` +
    `access_type=online`;

  // Direct redirect to Google OAuth
  window.location.href = authUrl;
};