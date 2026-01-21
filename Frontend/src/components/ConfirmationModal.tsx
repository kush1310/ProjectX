import { motion, AnimatePresence } from 'framer-motion'

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmationModal({ 
  isOpen, 
  title, 
  message, 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  onConfirm, 
  onClose 
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const colors = {
    danger: { bg: 'bg-red-50', text: 'text-red-600', icon: 'text-red-600', button: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' },
    warning: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'text-amber-600', button: 'from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700' },
    info: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'text-blue-600', button: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' }
  }[type];

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
          className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
          onClick={e => e.stopPropagation()}
        >
          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className={`w-16 h-16 ${colors.bg} rounded-full flex items-center justify-center`}>
              <svg className={`w-8 h-8 ${colors.icon}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                {type === 'danger' && <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />}
                {type === 'warning' && <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />}
                {type === 'info' && <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />}
              </svg>
            </div>
          </div>

          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              {message}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border-2 border-gray-100 rounded-xl font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-3 px-4 bg-gradient-to-r ${colors.button} text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
