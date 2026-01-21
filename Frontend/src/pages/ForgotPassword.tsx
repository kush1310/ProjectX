/**
 * Forgot Password Page
 * 
 * Flow:
 * 1. User enters email
 * 2. System simulates sending OTP/Link
 * 3. Shows success message
 * 4. Provides demo button to navigate to reset password (simulating email click)
 */

import { useState, FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import CharusatNeedsLogo from '@/components/Logo'
import ElectroBorder from '@/components/ElectroBorder'
import { toast } from 'react-hot-toast'
import { validateEmailStrict } from '@/utils/validation'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSent, setIsSent] = useState(false)

  // Email hint after @
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
    
    // Real-time hint check
    const hint = getEmailHint(val);
    if (hint) {
        setError(hint);
    } else {
        // Only clear if it was a domain error, or just clear generally
        if (error === 'Use @charusat.edu.in domain') {
            setError(undefined);
        }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email) return

    // Final strict check on submit
    const strictError = validateEmailStrict(email);
    if (strictError) {
        setError(strictError);
        return;
    }
    
    // Also check logical hint
    const hint = getEmailHint(email);
    if (hint) {
        setError(hint);
        return;
    }

    setError(undefined);

    setIsSubmitting(true)
    
    // Call real backend API
    try {
      const response = await fetch('http://localhost:8080/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsSent(true);
        toast.success('Reset link sent to your email!');
      } else {
        setError(data.message || 'Failed to send reset email');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    
    setIsSubmitting(false)
  }

  // Demo function to simulate clicking link from email
  const handleSimulateEmailClick = () => {
    navigate('/reset-password')
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative overflow-hidden"
    >
      {/* Back to Login - Top Left */}
      <div className="absolute top-6 left-6 z-20">
        <Link 
            to="/login" 
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold transition-colors text-sm group bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm border border-gray-100 hover:border-gray-200"
        >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Login
        </Link>
      </div>

      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] max-w-[500px] h-[50vh] rounded-full bg-emerald-100/40 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] max-w-[500px] h-[50vh] rounded-full bg-blue-100/40 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[440px] relative z-10 px-4">
        <div className="flex justify-center mb-8">
          <CharusatNeedsLogo size="lg" animated />
        </div>

        <ElectroBorder color="emerald" intensity="medium" radius="1.5rem">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl">
            {!isSent ? (
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                    <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h3>
                  <p className="text-gray-500 text-sm">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700 ml-1 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={handleEmailChange}
                      placeholder="student@charusat.edu.in"
                      className={`w-full px-5 py-3.5 rounded-xl border-2 outline-none transition-all font-medium
                        ${error ? 'border-red-300 bg-red-50 focus:border-red-400 text-gray-900' : 'bg-gray-50 border-gray-200 focus:bg-white focus:border-emerald-500'}`}
                      required
                    />
                    
                    {error === 'Use @charusat.edu.in domain' ? (
                       <div className="flex items-center gap-1.5 mt-1.5">
                         <svg className="w-4 h-4 text-orange-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                           <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                         </svg>
                         <p className="text-xs font-bold text-orange-600">{error}</p>
                       </div>
                    ) : error && (
                       <p className="text-xs text-red-500 font-bold ml-1">{error}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold 
                               py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:from-emerald-600 hover:to-emerald-700
                               hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed
                               transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : 'Send Reset Link'}
                  </button>
                </form>
              </>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-green-100">
                  <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Check your mail</h3>
                <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
                  We have sent a password reset instruction to <span className="font-bold text-gray-800">{email}</span>
                </p>

                {/* Simulated Email Button */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-3 font-bold">Developer Demo Only</p>
                  <button
                    onClick={handleSimulateEmailClick}
                    className="w-full py-2.5 bg-white border border-gray-300 rounded-lg text-emerald-600 font-bold hover:bg-emerald-50 transition-colors text-sm shadow-sm"
                  >
                    Simulate Clicking Email Link
                  </button>
                </div>

                <button
                  onClick={() => setIsSent(false)}
                  className="text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
                >
                  Resend Email
                </button>
              </motion.div>
            )}
          </div>
        </ElectroBorder>
      </div>
    </motion.div>
  )
}
