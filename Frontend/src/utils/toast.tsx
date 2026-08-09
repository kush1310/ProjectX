/**
 * Toast Notification System — Premium Glassmorphic Design
 * 
 * Features:
 * - Glassmorphic backdrop-blur cards with gradient accents
 * - Auto-dismiss progress bar animation
 * - Lucide icons for consistency
 * - Swipe-to-dismiss on mobile
 * - Stacked with smooth entrance/exit
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

// Types
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string) => void;
}

// Config per type
const toastConfig: Record<ToastType, {
  icon: typeof CheckCircle2;
  gradient: string;
  accent: string;
  bg: string;
  border: string;
  text: string;
  progressColor: string;
}> = {
  success: {
    icon: CheckCircle2,
    gradient: 'from-emerald-500/10 to-emerald-500/5',
    accent: 'bg-emerald-500',
    bg: 'bg-white/80',
    border: 'border-emerald-200/60',
    text: 'text-emerald-800',
    progressColor: '#10b981',
  },
  error: {
    icon: AlertCircle,
    gradient: 'from-red-500/10 to-red-500/5',
    accent: 'bg-red-500',
    bg: 'bg-white/80',
    border: 'border-red-200/60',
    text: 'text-red-800',
    progressColor: '#ef4444',
  },
  warning: {
    icon: AlertTriangle,
    gradient: 'from-amber-500/10 to-amber-500/5',
    accent: 'bg-amber-500',
    bg: 'bg-white/80',
    border: 'border-amber-200/60',
    text: 'text-amber-800',
    progressColor: '#f59e0b',
  },
  info: {
    icon: Info,
    gradient: 'from-blue-500/10 to-blue-500/5',
    accent: 'bg-blue-500',
    bg: 'bg-white/80',
    border: 'border-blue-200/60',
    text: 'text-blue-800',
    progressColor: '#3b82f6',
  },
};

const TOAST_DURATION = 4000;

// Context
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Provider
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, TOAST_DURATION);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {typeof document !== 'undefined' && createPortal(
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] flex flex-col gap-2.5 w-full max-w-md px-4">
          <AnimatePresence mode="sync">
            {toasts.map(toast => {
              const config = toastConfig[toast.type];
              const Icon = config.icon;

              return (
                <motion.div
                  key={toast.id}
                  initial={{ opacity: 0, y: -24, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.92, transition: { duration: 0.2 } }}
                  transition={{ type: 'spring', damping: 26, stiffness: 350 }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={(_, info) => {
                    if (Math.abs(info.offset.x) > 80) removeToast(toast.id);
                  }}
                  className={`relative overflow-hidden ${config.bg} backdrop-blur-xl border ${config.border} rounded-2xl shadow-lg shadow-black/5 cursor-grab active:cursor-grabbing`}
                  style={{
                    boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)',
                  }}
                >
                  {/* Left accent bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.accent} rounded-l-2xl`} />

                  {/* Content */}
                  <div className={`flex items-center gap-3 px-4 pl-5 py-3.5 bg-gradient-to-r ${config.gradient}`}>
                    <div className={`flex-shrink-0 ${config.text}`}>
                      <Icon className="w-5 h-5" strokeWidth={2.2} />
                    </div>
                    <p className={`flex-1 text-sm font-semibold ${config.text} leading-snug`}>
                      {toast.message}
                    </p>
                    <button
                      className={`flex-shrink-0 ${config.text} opacity-40 hover:opacity-80 transition-opacity p-0.5 rounded-lg hover:bg-black/5`}
                      onClick={() => removeToast(toast.id)}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Auto-dismiss progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black/5">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: config.progressColor }}
                      initial={{ width: '100%' }}
                      animate={{ width: '0%' }}
                      transition={{ duration: TOAST_DURATION / 1000, ease: 'linear' }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

// Hook
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

// Simple toast API for direct usage
let toastRef: ToastContextType | null = null;

export const setToastRef = (ref: ToastContextType) => {
  toastRef = ref;
};

export const toast = {
  success: (message: string) => {
    if (toastRef) toastRef.showToast('success', message);
    else console.log('Toast success:', message);
  },
  error: (message: string) => {
    if (toastRef) toastRef.showToast('error', message);
    else console.error('Toast error:', message);
  },
  warning: (message: string) => {
    if (toastRef) toastRef.showToast('warning', message);
    else console.warn('Toast warning:', message);
  },
  info: (message: string) => {
    if (toastRef) toastRef.showToast('info', message);
    else console.info('Toast info:', message);
  }
};

// ToastInitializer component - place inside ToastProvider
export function ToastInitializer() {
  const toastContext = useToast();
  React.useEffect(() => {
    setToastRef(toastContext);
  }, [toastContext]);
  return null;
}
