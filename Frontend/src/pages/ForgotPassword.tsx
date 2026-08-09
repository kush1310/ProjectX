/**
 * Forgot Password Page
 * 
 * Features:
 * - Auto-fetches email from Login page state
 * - Strict Charusat Email Validation
 * - Professional "Check your email" success state
 * - LightweightBorder for consistent theme
 */

import { useState, FormEvent, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import CharusatNeedsLogo from '@/components/Logo'
import LightweightBorder from '@/components/LightweightBorder'
import { toast } from 'react-hot-toast'
import { validateEmailStrict } from '@/utils/validation'

export default function ForgotPassword() {
  const location = useLocation()
  
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSent, setIsSent] = useState(false)

  // Auto-fill from navigation state
  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email)
    }
  }, [location.state])

  const getEmailHint = (email: string): string | undefined => {
    if (!email || !email.includes('@')) return undefined;
    if (!email.toLowerCase().endsWith('@charusat.edu.in')) {
      return 'Use @charusat.edu.in domain';
    }
    return undefined;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    
    const hint = getEmailHint(val);
    if (hint) {
        setError(hint);
    } else {
        if (error === 'Use @charusat.edu.in domain') {
            setError(undefined);
        }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email) return

    const strictError = validateEmailStrict(email);
    if (strictError) {
        setError(strictError);
        return;
    }
    
    const hint = getEmailHint(email);
    if (hint) {
        setError(hint);
        return;
    }

    setError(undefined);
    setIsSubmitting(true)
    
    try {
      const response = await fetch('http://localhost:8000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsSent(true);
        toast.success('Reset link sent!');
      } else {
        // Detect Google OAuth accounts — they have no local password and cannot reset via email
        const msg: string = data.message || 'Failed to send reset email';
        const isGoogleAccount = /google|oauth|social|sign.?in.?with/i.test(msg);
        if (isGoogleAccount) {
          setError('This account uses Google Sign-In. Password reset is not available — please sign in with Google instead.');
        } else {
          setError(msg);
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    
    setIsSubmitting(false)
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream-50 via-white to-cream-100 p-4 relative overflow-hidden"
    >
      {/* Background Ambience */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] max-w-[400px] h-[40vh] max-h-[300px] rounded-full bg-brand-100/30 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] max-w-[400px] h-[40vh] max-h-[300px] rounded-full bg-brand-200/30 blur-[80px] pointer-events-none" />

      <div className="w-full max-w-[440px] relative z-10 px-4">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <CharusatNeedsLogo size="lg" animated />
        </div>

        <LightweightBorder borderColor="#ef4444" radius="1.5rem" animated>
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl">
            {!isSent ? (
              <>
                <div className="text-center mb-8">
                  <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-4 border border-gray-100 shadow-inner">
                    <svg className="w-7 h-7 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-dark-900 mb-2">Forgot password?</h3>
                  <p className="text-dark-500 text-sm">
                    No worries, we'll send you reset instructions.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-dark-700 ml-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={handleEmailChange}
                      placeholder="Enter your email"
                      className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all font-medium
                        ${error ? 'border-red-300 bg-red-50 text-gray-900' : 'bg-gray-50 border-gray-200 focus:bg-white focus:border-brand-500 shadow-sm'}`}
                      required
                    />
                    
                    {error === 'Use @charusat.edu.in domain' ? (
                       <p className="text-xs font-bold text-orange-600 ml-1 mt-1">{error}</p>
                    ) : error && (
                       <p className="text-xs text-red-500 font-bold ml-1 mt-1">{error}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-brand-600 text-white font-bold 
                               py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:bg-brand-700
                               hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed
                               transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : 'Reset password'}
                  </button>

                  <div className="flex justify-center mt-6">
                    <Link to="/login" className="flex items-center gap-2 text-dark-500 hover:text-dark-900 font-medium transition-colors text-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to log in
                    </Link>
                  </div>
                </form>
              </>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-2"
              >
                <div className="w-16 h-16 bg-brand-50 rounded-xl flex items-center justify-center mx-auto mb-6 border border-brand-100 shadow-sm">
                  <svg className="w-8 h-8 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-dark-900 mb-2">Check your email</h3>
                <p className="text-dark-500 text-sm mb-8">
                  We sent a password reset link to<br/><span className="font-semibold text-dark-800">{email}</span>
                </p>

                <button
                    onClick={() => window.location.href = `mailto:`}
                    className="w-full bg-brand-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-brand-700 transition-all mb-6"
                >
                    Open email app
                </button>

                <p className="text-sm text-dark-500">
                  Didn't receive the email?{' '}
                  <button onClick={() => handleSubmit({ preventDefault: () => {} } as any)} className="text-brand-600 font-bold hover:underline">
                    Click to resend
                  </button>
                </p>

                <div className="flex justify-center mt-8">
                    <Link to="/login" className="flex items-center gap-2 text-dark-500 hover:text-dark-900 font-medium transition-colors text-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to log in
                    </Link>
                </div>
              </motion.div>
            )}
          </div>
        </LightweightBorder>
      </div>
    </motion.div>
  )
}
