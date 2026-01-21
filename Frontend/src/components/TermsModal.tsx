import { motion, AnimatePresence } from 'framer-motion';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

/**
 * Terms Modal - Popup for accepting terms and conditions
 */
export default function TermsModal({ isOpen, onClose, onAccept }: TermsModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-dark-900">Terms & Conditions</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Warning Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <h4 className="text-lg font-semibold text-dark-800 mb-2">Please Accept Terms</h4>
            <p className="text-dark-500 text-sm leading-relaxed">
              You must accept our Terms of Service and Privacy Policy to create an account on CharusatNeeds.
            </p>
          </div>

          {/* Terms Summary */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm text-dark-600 space-y-2">
            <p className="flex items-start gap-2">
              <svg className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>I agree to use this platform for legitimate campus services only.</span>
            </p>
            <p className="flex items-start gap-2">
              <svg className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>I consent to the collection and use of my data as per the Privacy Policy.</span>
            </p>
            <p className="flex items-start gap-2">
              <svg className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>I am a current CHARUSAT student or staff member.</span>
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border-2 border-gray-200 rounded-xl font-medium text-dark-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onAccept}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
            >
              I Accept
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
