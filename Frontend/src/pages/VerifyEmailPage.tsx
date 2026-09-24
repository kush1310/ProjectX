import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react';
import { API_URL } from '../utils/api';

/**
 * VerifyEmailPage — Handles the email verification link click.
 * Calls backend GET /api/auth/verify-email?token=... and shows result.
 * Includes "Resend Verification Email" on failure.
 */
export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token. Please check your email link.');
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  async function verifyEmail(token: string) {
    try {
      const response = await fetch(
        `${API_URL}/auth/verify-email?token=${encodeURIComponent(token)}`,
        {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        }
      );

      // Try to parse JSON regardless of status code
      let data;
      try {
        data = await response.json();
      } catch {
        // If JSON parse fails, create a default error
        data = { success: false, message: 'Unexpected server response.' };
      }

      if (response.ok && data.success) {
        setStatus('success');
        setMessage(data.message || 'Your email has been verified successfully!');
      } else {
        setStatus('error');
        setMessage(data.message || 'Verification failed. The link may have expired or already been used.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Unable to connect to the server. Please try again later.');
    }
  }

  async function handleResend() {
    if (!resendEmail.trim()) return;
    setResending(true);
    try {
      const response = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail.trim() }),
      });
      const data = await response.json();
      if (data.success) {
        setResent(true);
      } else {
        setMessage(data.message || 'Failed to resend. Please try again.');
      }
    } catch {
      setMessage('Unable to connect to the server.');
    }
    setResending(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-10">
          {/* Logo */}
          <div className="mb-8">
            <span className="text-2xl font-extrabold tracking-tight">
              <span className="text-slate-900">Charusat</span>
              <span className="bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">Needs</span>
            </span>
          </div>

          {/* Loading */}
          {status === 'loading' && (
            <div className="space-y-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center"
              >
                <Loader2 className="w-8 h-8 text-blue-500" />
              </motion.div>
              <h2 className="text-xl font-bold text-slate-800">Verifying your email...</h2>
              <p className="text-sm text-slate-500">Please wait while we confirm your email address.</p>
            </div>
          )}

          {/* Success */}
          {status === 'success' && (
            <div className="space-y-5">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="mx-auto w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center"
              >
                <CheckCircle className="w-9 h-9 text-emerald-500" />
              </motion.div>
              <h2 className="text-xl font-bold text-slate-800">Email Verified!</h2>
              <p className="text-sm text-slate-500">{message}</p>

              <div className="pt-2 space-y-3">
                <div className="flex items-center gap-2 justify-center text-xs text-emerald-600 bg-emerald-50 rounded-lg py-2 px-4">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Your account is now active and secured</span>
                </div>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Continue to Login
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="space-y-5">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center"
              >
                <XCircle className="w-9 h-9 text-red-500" />
              </motion.div>
              <h2 className="text-xl font-bold text-slate-800">Verification Failed</h2>
              <p className="text-sm text-slate-500">{message}</p>

              {/* Resend Verification */}
              {!resent ? (
                <div className="pt-3 space-y-3">
                  <p className="text-xs text-slate-500">Enter your email to receive a new verification link:</p>
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="your.id@charusat.edu.in"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
                  />
                  <button
                    onClick={handleResend}
                    disabled={resending || !resendEmail.trim()}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {resending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Resend Verification Email
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="pt-3 space-y-3">
                  <div className="flex items-center gap-2 justify-center text-xs text-emerald-600 bg-emerald-50 rounded-lg py-2 px-4">
                    <CheckCircle className="w-4 h-4" />
                    <span>Verification email sent! Check your inbox.</span>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <Link
                  to="/login"
                  className="text-sm text-slate-400 hover:text-red-500 transition-colors"
                >
                  Back to Login
                </Link>
              </div>

              <p className="text-xs text-slate-400">
                Need help? Contact <a href="mailto:support@charusat.edu.in" className="text-red-500 hover:underline">support@charusat.edu.in</a>
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
