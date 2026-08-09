import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { getSession, logout } from './authStore';
import { encryptPayload, decryptPayload } from './payloadCrypto';

const API_URL = 'http://localhost:8000/api';

/** Endpoints that skip payload encryption (public, no auth) */
const SKIP_ENCRYPT_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/google',
  '/auth/refresh-token',
  '/auth/verify-email',
  '/mfa/validate',
  '/captcha',
  '/password-reset',
  '/users/profile/image',  // multipart/form-data — must NOT be encrypted
  '/cart/apply-coupon',    // CartController reads raw Map<String,String> — must not be encrypted
  '/cart/remove-coupon',   // CartController reads raw request — must not be encrypted
  '/complaints',           // ComplaintController reads raw Map<String,Object> — must not be encrypted
];

function shouldSkipEncryption(url: string | undefined): boolean {
  if (!url) return true;
  return SKIP_ENCRYPT_PATHS.some((path) => url.includes(path));
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: add token + encrypt body
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const session = getSession();
    if (session && (session as any).token) {
      config.headers.set('Authorization', `Bearer ${(session as any).token}`);
    }

    // Encrypt request body for non-public endpoints.
    // Skip if: path is public, OR data is FormData (multipart — encryption would corrupt the boundary)
    if (config.data && !shouldSkipEncryption(config.url) && !(config.data instanceof FormData)) {
      try {
        const plaintext = typeof config.data === 'string'
          ? config.data
          : JSON.stringify(config.data);
        const encrypted = await encryptPayload(plaintext);
        config.data = { enc: encrypted };
      } catch (e) {
        console.warn('Payload encryption failed, sending unencrypted:', e);
      }
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

/**
 * Paths that legitimately return 401 for wrong credentials — these must NOT
 * trigger the global logout + page-redirect, otherwise the Login component
 * never gets a chance to display the inline "Invalid email or password" message.
 */
const AUTH_OWNED_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/google',
  '/auth/refresh-token',
  '/auth/verify-email',
  '/auth/resend-verification',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/validate-token',
  '/mfa/validate',
  '/captcha',
  '/password-reset',
];

function isAuthOwnedPath(url: string | undefined): boolean {
  if (!url) return false;
  return AUTH_OWNED_PATHS.some((path) => url.includes(path));
}

// Response interceptor: decrypt body + handle 401
api.interceptors.response.use(
  async (response: AxiosResponse) => {
    // Decrypt encrypted responses
    if (response.data && response.data.enc && typeof response.data.enc === 'string') {
      try {
        const decrypted = await decryptPayload(response.data.enc);
        response.data = JSON.parse(decrypted);
      } catch (e) {
        console.warn('Payload decryption failed, using raw response:', e);
      }
    }
    return response;
  },
  async (error: AxiosError) => {
    // Try to decrypt error response body first so the caller gets readable data
    if (error.response?.data && (error.response.data as any).enc) {
      try {
        const decrypted = await decryptPayload((error.response.data as any).enc);
        error.response.data = JSON.parse(decrypted);
      } catch {
        // Ignore decryption errors on error responses — pass raw data through
      }
    }

    // Only redirect to /login on 401/403 for protected endpoints.
    // Auth endpoints (/auth/login, /mfa/validate, etc.) legitimately return 401
    // for wrong credentials — redirecting here would reload the page and destroy
    // the inline error message the Login component is about to display.
    const requestUrl = (error.config as any)?.url;
    const isProtectedEndpoint = !isAuthOwnedPath(requestUrl);
    const statusCode = error.response?.status;

    // 401 = token missing/invalid, 403 = token expired (backend validateToken returns false → Spring 403)
    if ((statusCode === 401 || statusCode === 403) && isProtectedEndpoint) {
      // Attempt silent token refresh before giving up
      const session = getSession() as any;
      const refreshToken = session?.refreshToken;

      if (refreshToken && !(error.config as any)._retried) {
        try {
          const refreshRes = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
          const newToken = refreshRes.data?.accessToken || refreshRes.data?.token;
          if (newToken && session) {
            // Persist new access token into session
            const updatedSession = { ...session, token: newToken };
            localStorage.setItem('charusatneeds_session', JSON.stringify(updatedSession));

            // Retry the original request with the new token
            const retryConfig = { ...(error.config as any), _retried: true };
            retryConfig.headers = { ...(retryConfig.headers || {}), Authorization: `Bearer ${newToken}` };
            return api(retryConfig);
          }
        } catch {
          // Refresh failed — fall through to logout
        }
      }

      // No valid refresh token or refresh failed → send to login
      logout();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
