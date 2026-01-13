/**
 * LogoutConfirmModal Component
 * 
 * Premium centered modal for logout confirmation
 * Uses flex centering for perfect alignment
 */

import { motion, AnimatePresence } from 'framer-motion';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function LogoutConfirmModal({ isOpen, onConfirm, onCancel }: LogoutConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onWheel={(e) => e.stopPropagation()}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal - Centered with flex */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl 
                       shadow-gray-900/20 border border-gray-100 overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 text-center">
              {/* Warning Icon */}
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-50 to-red-100 
                              rounded-full flex items-center justify-center mb-5
                              ring-4 ring-red-50">
                <svg 
                  className="w-8 h-8 text-red-500" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  strokeWidth={2}
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                  />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Logout
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Are you sure you want to logout from your account?
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-5 pt-0">
              <button
                onClick={onCancel}
                className="flex-1 py-3 text-sm font-semibold text-gray-700 
                           bg-gray-100 hover:bg-gray-200 rounded-xl
                           transition-all duration-200 active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-3 text-sm font-bold text-white 
                           bg-gradient-to-r from-red-500 to-red-600 
                           hover:from-red-600 hover:to-red-700 rounded-xl
                           shadow-lg shadow-red-500/25
                           transition-all duration-200 active:scale-[0.98]"
              >
                Logout
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
