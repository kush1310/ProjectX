/**
 * ConfettiButton Component
 * 
 * Triggers confetti animation on click (for order acceptance)
 * Uses canvas-confetti library loaded dynamically
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

// Confetti type
type ConfettiOptions = {
  particleCount?: number;
  spread?: number;
  startVelocity?: number;
  decay?: number;
  gravity?: number;
  origin?: { x?: number; y?: number };
  colors?: string[];
  scalar?: number;
};

declare global {
  interface Window {
    confetti?: (options?: ConfettiOptions) => void;
  }
}

interface ConfettiButtonProps {
  variant?: 'primary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  confettiOptions?: ConfettiOptions;
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}

const variantStyles = {
  primary: 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-200',
  success: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200',
  danger: 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs font-semibold rounded-lg',
  md: 'px-4 py-2 text-sm font-bold rounded-xl',
  lg: 'px-6 py-3 text-base font-bold rounded-xl',
};

export default function ConfettiButton({
  children,
  variant = 'success',
  size = 'md',
  confettiOptions = {
    particleCount: 80,
    spread: 60,
    colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5']
  },
  loading = false,
  icon,
  className = '',
  disabled = false,
  onClick,
}: ConfettiButtonProps) {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Load confetti script dynamically
  useEffect(() => {
    if (window.confetti) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.4.0/dist/confetti.browser.min.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  const triggerConfetti = () => {
    if (scriptLoaded && window.confetti && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      window.confetti({
        ...confettiOptions,
        origin: { x, y },
      });
    }
  };

  const handleClick = () => {
    triggerConfetti();
    onClick?.();
  };

  return (
    <motion.button
      ref={buttonRef}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`inline-flex items-center justify-center gap-2 transition-all duration-200 
                  disabled:opacity-50 disabled:cursor-not-allowed 
                  ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      onClick={handleClick}
      disabled={loading || disabled}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon}
      {children}
    </motion.button>
  );
}

