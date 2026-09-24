/**
 * LogoutConfirmModal — Glassmorphic Neumorphic Design
 * Clean text-link actions with animated "Securely logging out" loader
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { API_URL } from '@/utils/api';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/* ═══════ Custom Logout Loader ═══════ */
function LogoutLoader() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) { clearInterval(timer); return 100; }
        // Fast, smooth transition for snappy 650ms feedback
        const increment = Math.max(3, (100 - prev) * 0.16);
        return Math.min(100, prev + increment);
      });
    }, 20);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 sm:p-8 text-center"
    >
      {/* Shield icon with pulse */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
        className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-5 relative"
        style={{
          background: 'linear-gradient(145deg, #fef2f2, #fce4e4)',
          boxShadow: `
            6px 6px 16px rgba(226, 55, 68, 0.08),
            -6px -6px 16px rgba(255, 255, 255, 0.9),
            inset 0 1px 0 rgba(255, 255, 255, 0.8)
          `,
        }}
      >
        <motion.div
          animate={{ x: [0, 4, 0, 4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <LogOut className="w-7 h-7 text-[#e23744]" />
        </motion.div>
        {/* Pulsing ring */}
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-[#e23744]/20"
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* Text */}
      <motion.h3
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-base font-extrabold text-neutral-900 mb-1"
      >
        Securely logging you out
      </motion.h3>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="text-[11px] text-neutral-400 mb-5"
      >
        Clearing your session data...
      </motion.p>

      {/* Progress Bar */}
      <div className="relative w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #e23744, #ff6b6b, #e23744)',
            backgroundSize: '200% 100%',
          }}
          animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Dots animation */}
      <div className="flex items-center justify-center gap-1 mt-4">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#e23744]/40"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default function LogoutConfirmModal({ isOpen, onConfirm, onCancel }: LogoutConfirmModalProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) setIsLoggingOut(false);
  }, [isOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    // Call backend to revoke all sessions
    try {
      const session = JSON.parse(localStorage.getItem('charusatneeds_session') || '{}');
      const token = session?.token;
      if (token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ allDevices: true }),
        });
      }
    } catch {
      // Continue with local logout even if API fails
    }

    // Snappy, professional 650ms transition
    setTimeout(() => {
      onConfirm();
    }, 650);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onWheel={(e) => e.stopPropagation()}
        >
          {/* Backdrop — glassmorphic blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isLoggingOut ? undefined : onCancel}
            className="absolute inset-0 bg-black/30 backdrop-blur-md"
          />

          {/* Modal — Neumorphic glass card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="relative w-full max-w-xs overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.88)',
              backdropFilter: 'blur(24px)',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              boxShadow: `
                0 8px 32px rgba(0, 0, 0, 0.08),
                0 1px 3px rgba(0, 0, 0, 0.04),
                inset 0 1px 0 rgba(255, 255, 255, 0.8),
                inset 0 -1px 0 rgba(0, 0, 0, 0.02)
              `,
            }}
          >
            <AnimatePresence mode="wait">
              {isLoggingOut ? (
                <motion.div
                  key="loader"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <LogoutLoader />
                </motion.div>
              ) : (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Content */}
                  <div className="p-6 text-center">
                    {/* Neumorphic icon */}
                    <div
                      className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                      style={{
                        background: 'linear-gradient(145deg, #fff5f5, #ffe0e0)',
                        boxShadow: `
                          4px 4px 10px rgba(226, 55, 68, 0.08),
                          -4px -4px 10px rgba(255, 255, 255, 0.9),
                          inset 0 1px 0 rgba(255, 255, 255, 0.6)
                        `,
                      }}
                    >
                      <LogOut className="w-6 h-6 text-[#e23744]" />
                    </div>

                    <h3 className="text-lg font-extrabold text-neutral-900 mb-1.5">
                      Sign out?
                    </h3>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      You'll need to sign in again to access your account
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-neutral-100/80" />

                  {/* Text link actions — no buttons */}
                  <div className="flex divide-x divide-neutral-100/80">
                    <button
                      onClick={onCancel}
                      className="flex-1 py-3.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800 hover:bg-white/60 transition-all active:scale-[0.98]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex-1 py-3.5 text-sm font-bold text-[#e23744] hover:text-red-700 hover:bg-rose-50/60 transition-all active:scale-[0.98]"
                    >
                      Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
