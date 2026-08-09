/**
 * CharusatNeeds Premium Preloader
 * 
 * Features:
 * - MagicLoader particle swirl animation
 * - App name "CharusatNeeds"
 * - Animated progress bar
 * - TRANSPARENT background (uses app's default gradient)
 * - Fully responsive
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import MagicLoader from './MagicLoader';

interface PreloaderProps {
  minDuration?: number;
  onComplete?: () => void;
}

export default function Preloader({ minDuration = 3000, onComplete }: PreloaderProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const rawProgress = Math.min(elapsed / minDuration, 1);
      const easedProgress = 1 - Math.pow(1 - rawProgress, 3);
      setProgress(easedProgress * 100);

      if (rawProgress >= 1) {
        clearInterval(interval);
        setTimeout(() => {
          setIsVisible(false);
          onComplete?.();
        }, 300);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [minDuration, onComplete]);

  if (!isVisible) {
    return null;
  }
  

  return (
    <AnimatePresence>
      <motion.div
        key="preloader"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.02 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center px-4"
        style={{
          background: 'linear-gradient(135deg, #FFFDF7 0%, #FFFFFF 50%, #FFF9EB 100%)'
        }}
      >
        {/* Subtle background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                         w-[60vw] max-w-[450px] h-[60vw] max-h-[450px] 
                         bg-brand-100/20 rounded-full blur-[100px]" />
        </div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 flex flex-col items-center"
        >
          {/* MagicLoader */}
          <MagicLoader 
            size={typeof window !== 'undefined' && window.innerWidth < 480 ? 140 : 180}
            particleCount={2} 
            speed={0.9}
          />

          {/* App Name */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mt-5 sm:mt-6 flex items-center gap-0.5"
          >
            <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-dark-900 tracking-tight">
              Charusat
            </span>
            <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text 
                           bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 tracking-tight">
              Needs
            </span>
          </motion.div>

          {/* Progress Bar */}
          <motion.div 
            className="w-32 sm:w-40 lg:w-48 h-1 sm:h-1.5 bg-brand-100 rounded-full overflow-hidden mt-5 sm:mt-6"
            initial={{ opacity: 0, scaleX: 0.9 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </motion.div>

          {/* Loading percentage */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 0.4 }}
            className="mt-2 text-xs sm:text-sm text-dark-400 font-medium"
          >
            {Math.round(progress)}%
          </motion.span>
        </motion.div>

        {/* Bottom Copyright */}
        <motion.div
          className="absolute bottom-4 sm:bottom-6 text-dark-300 text-[10px] sm:text-xs 
                     font-medium tracking-wide uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 0.6 }}
        >
          © 2026 CHARUSAT University
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
