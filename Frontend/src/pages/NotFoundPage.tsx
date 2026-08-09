import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';

/**
 * NotFoundPage — Shown for any unrecognized / malicious URL.
 * Prevents URL injection, path traversal, and XSS via address bar.
 */
export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full text-center space-y-6"
      >
        {/* Shield Icon */}
        <motion.div
          initial={{ scale: 0.8, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-red-100 to-rose-50 flex items-center justify-center shadow-lg shadow-red-100/50"
        >
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </motion.div>

        {/* Error Text */}
        <div className="space-y-2">
          <h1 className="text-6xl font-black text-slate-800 tracking-tight">404</h1>
          <h2 className="text-xl font-bold text-slate-700">Page Not Found</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
            <br />
            <span className="text-red-500 font-medium">
              Unauthorized URL access is logged and monitored.
            </span>
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>

        {/* Security Note */}
        <p className="text-[11px] text-slate-400 pt-4 flex items-center justify-center gap-1">
          <ShieldAlert className="w-3 h-3" /> This application only allows access to authorized pages.
        </p>
      </motion.div>
    </div>
  );
}
