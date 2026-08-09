import api from './api';

// Types
export interface User {
  id?: number;
  email: string;
  fullName: string;
  mobile?: string;
  role?: string;
  mfaEnabled?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  refreshToken?: string;  // Stored in session for silent token refresh via /auth/refresh-token
  user?: User;
  lockedMinutes?: number;
  requireCaptcha?: boolean;
  mfaRequired?: boolean;
  email?: string;
}

// Storage keys
const SESSION_KEY = 'charusatneeds_session';
const COOKIE_NAME = 'charusatneeds_auth';
const COOKIE_DAYS = 30;

/**
 * Cookie utilities
 */
const setCookie = (name: string, value: string, days: number): void => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
};

const getCookie = (name: string): string | null => {
  const nameEQ = `${name}=`;
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }
  return null;
};

const deleteCookie = (name: string): void => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

/**
 * Register a new user
 */
export const registerUser = async (userData: any): Promise<AuthResponse> => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Registration failed'
    };
  }
};

/**
 * Authenticate user — forwards lockout data from 429 responses
 */
export const authenticateUser = async (email: string, password: string, captchaId?: string, captchaAnswer?: string, mfaCode?: string): Promise<AuthResponse> => {
  try {
    const response = await api.post('/auth/login', { email, password, captchaId, captchaAnswer, mfaCode });
    return response.data;
  } catch (error: any) {
    const data = error.response?.data;
    return {
      success: false,
      message: data?.message || data?.error || 'Login failed',
      lockedMinutes: data?.lockedMinutes,
      requireCaptcha: data?.requireCaptcha,
    };
  }
};

/**
 * createSession
 *
 * Persists the authenticated user's access token and refresh token into
 * localStorage (and optionally a cookie for Remember Me). Both tokens are
 * stored so the api.ts interceptor can silently refresh a 401/403 before
 * forcing a redirect to /login.
 *
 * @param user        {User}    - Authenticated user object from backend.
 * @param token       {string}  - Short-lived JWT access token (15 min).
 * @param rememberMe  {boolean} - If true, also persists to cookie (30 days).
 * @param refreshToken {string} - Long-lived refresh token (30 days). Optional
 *                                for backward compatibility but should always
 *                                be passed on fresh login/register flows.
 */
export const createSession = (user: User, token: string, rememberMe: boolean = false, refreshToken?: string): void => {
  const session = {
    ...user,
    token,
    refreshToken: refreshToken || null,
    loggedInAt: new Date().toISOString()
  };
  
  // Always store in localStorage
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  
  // Store in cookie if Remember Me
  if (rememberMe) {
    setCookie(COOKIE_NAME, JSON.stringify(session), COOKIE_DAYS);
  } else {
    deleteCookie(COOKIE_NAME);
  }
};

/**
 * Get current session
 */
export const getSession = (): any | null => {
  try {
    // Check localStorage first
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Check cookie
    const cookieSession = getCookie(COOKIE_NAME);
    if (cookieSession) {
      const session = JSON.parse(cookieSession);
      localStorage.setItem(SESSION_KEY, cookieSession);
      return session;
    }
    
    return null;
  } catch {
    return null;
  }
};

/**
 * Check if authenticated
 */
export const isAuthenticated = (): boolean => {
  return getSession() !== null;
};

/**
 * Logout
 */
export const logout = (): void => {
  localStorage.removeItem(SESSION_KEY);
  deleteCookie(COOKIE_NAME);
};

/**
 * Validate email domain
 */
export const isValidDomain = (email: string): boolean => {
  return email.toLowerCase().endsWith('@charusat.edu.in');
};
