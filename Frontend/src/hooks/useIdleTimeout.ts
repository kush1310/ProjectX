import { useEffect, useRef, useCallback } from 'react';
import { logout as clearAuthSession } from '@/utils/authStore';

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'] as const;

/**
 * useIdleTimeout — Auto-logout after 15 minutes of inactivity.
 * 
 * Security: OWASP ASVS session idle timeout.
 * Listens for user interactions and resets the timer on each event.
 * When the timeout fires, clears the session and redirects to /login.
 */
export function useIdleTimeout(enabled = true) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleIdle = useCallback(() => {
    clearAuthSession();
    window.location.href = '/login?reason=idle';
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(handleIdle, IDLE_TIMEOUT_MS);
  }, [handleIdle]);

  useEffect(() => {
    if (!enabled) return;

    // Initial timer
    resetTimer();

    // Attach listeners
    const handler = () => resetTimer();
    ACTIVITY_EVENTS.forEach(event => window.addEventListener(event, handler, { passive: true }));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach(event => window.removeEventListener(event, handler));
    };
  }, [enabled, resetTimer]);
}

export default useIdleTimeout;
