/**
 * Auth Store - Client-Side Authentication Management
 * 
 * Features:
 * - Static test credentials for development
 * - Dynamic user registration (localStorage-based)
 * - Session management
 */

// Types
export interface User {
  email: string;
  password: string;
  fullName: string;
  mobile: string;
}

// Static test credentials
const STATIC_USER: User = {
  email: 'd25ce145@charusat.edu.in',
  password: 'kush',
  fullName: 'Test User',
  mobile: '9999999999'
};

// Storage keys
const USERS_KEY = 'charusatneeds_users';
const SESSION_KEY = 'charusatneeds_session';

/**
 * Get all registered users from localStorage
 */
export const getRegisteredUsers = (): User[] => {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/**
 * Register a new user (add to localStorage array)
 */
export const registerUser = (user: User): { success: boolean; message: string } => {
  const users = getRegisteredUsers();
  
  // Check if email already exists
  const exists = users.some(u => u.email.toLowerCase() === user.email.toLowerCase());
  if (exists) {
    return { success: false, message: 'An account with this email already exists.' };
  }
  
  // Check if it's the static user email
  if (user.email.toLowerCase() === STATIC_USER.email.toLowerCase()) {
    return { success: false, message: 'This email is reserved. Please use a different email.' };
  }
  
  // Add user
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  
  return { success: true, message: 'Account created successfully!' };
};

/**
 * Authenticate user (check static + dynamic users)
 */
export const authenticateUser = (email: string, password: string): { success: boolean; user?: User; message: string } => {
  // Check static user first
  if (email.toLowerCase() === STATIC_USER.email.toLowerCase() && password === STATIC_USER.password) {
    return { success: true, user: STATIC_USER, message: 'Login successful!' };
  }
  
  // Check dynamic users
  const users = getRegisteredUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  
  if (user) {
    return { success: true, user, message: 'Login successful!' };
  }
  
  // Check if email exists but password wrong
  const emailExists = users.some(u => u.email.toLowerCase() === email.toLowerCase()) || 
                      email.toLowerCase() === STATIC_USER.email.toLowerCase();
  
  if (emailExists) {
    return { success: false, message: 'Incorrect password. Please try again.' };
  }
  
  return { success: false, message: 'No account found with this email. Please sign up.' };
};

/**
 * Create session (store in localStorage)
 */
export const createSession = (user: User): void => {
  const session = {
    email: user.email,
    fullName: user.fullName,
    loggedInAt: new Date().toISOString()
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

/**
 * Get current session
 */
export const getSession = (): { email: string; fullName: string; loggedInAt: string } | null => {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return getSession() !== null;
};

/**
 * Logout - clear session
 */
export const logout = (): void => {
  localStorage.removeItem(SESSION_KEY);
};

/**
 * Validate email domain
 */
export const isValidDomain = (email: string): boolean => {
  return email.toLowerCase().endsWith('@charusat.edu.in');
};
