import api from './api';

// Types
export interface User {
  id?: number;
  email: string;
  fullName: string;
  mobile?: string;
  role?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
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
 * Authenticate user
 */
export const authenticateUser = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Login failed'
    };
  }
};

/**
 * Create session
 */
export const createSession = (user: User, token: string, rememberMe: boolean = false): void => {
  const session = {
    ...user,
    token,
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
