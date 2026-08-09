/**
 * Google OAuth Utility Functions
 * Domain: charusat.edu.in ONLY
 */

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || 'http://localhost:5173/auth/callback'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

/**
 * Initiates Google OAuth flow with CHARUSAT domain restriction
 */
export const initiateGoogleLogin = (): void => {
  if (!GOOGLE_CLIENT_ID) {
    console.error('Google Client ID not configured. Please set VITE_GOOGLE_CLIENT_ID in .env')
    alert('Google OAuth is not configured. Please contact administrator.')
    return
  }

  const scope = encodeURIComponent('email profile openid')
  
  // Build OAuth URL with CHARUSAT domain restriction
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `response_type=code&` +
    `scope=${scope}&` +
    `access_type=offline&` +
    `hd=charusat.edu.in&` + // CRITICAL: Restricts to CHARUSAT domain
    `prompt=select_account`
  
  window.location.href = authUrl
}

/**
 * Handles Google OAuth callback
 * Sends authorization code to backend for verification
 */
export const handleGoogleCallback = async (code: string): Promise<{
  token: string
  user: {
    email: string
    fullName: string
    profileImage?: string
    role: string
  }
}> => {
  try {
    const response = await fetch(`${API_URL}/auth/google/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Authentication failed')
    }

    const data = await response.json()
    
    // Validate email domain client-side as additional check
    if (!data.user.email.endsWith('@charusat.edu.in')) {
      throw new Error('Invalid email domain. Only CHARUSAT emails are allowed.')
    }

    // Store authentication data
    localStorage.setItem('charusatneeds_token', data.token)
    localStorage.setItem('charusatneeds_user', JSON.stringify(data.user))
    localStorage.setItem('charusatneeds_auth_method', 'google')

    return data
  } catch (error) {
    console.error('Google authentication error:', error)
    throw error
  }
}

/**
 * Logout function
 */
export const logout = (): void => {
  localStorage.removeItem('charusatneeds_token')
  localStorage.removeItem('charusatneeds_user')
  localStorage.removeItem('charusatneeds_auth_method')
  localStorage.removeItem('charusatneeds_remember')
  
  window.location.href = '/login'
}

/**
 * Get current user from localStorage
 */
export const getCurrentUser = (): {
  email: string
  fullName: string
  profileImage?: string
  role: string
} | null => {
  const userStr = localStorage.getItem('charusatneeds_user')
  if (!userStr) return null
  
  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('charusatneeds_token')
}

/**
 * Get auth token
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem('charusatneeds_token')
}
