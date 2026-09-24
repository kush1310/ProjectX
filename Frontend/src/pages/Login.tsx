/**
 * Login Page - Enhanced with Both Fields Highlighted on Error
 * 
 * Features:
 * - Both email & password highlighted on invalid credentials
 * - 6-character captcha with error messages
 * - Professional eye icons
 * - Remember Me controls cookie persistence
 */

import { useState, FormEvent, ChangeEvent, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Shield, Clock, Bell, ArrowLeft } from 'lucide-react'
import CharusatNeedsLogo from '@/components/Logo'
import LightweightBorder from '@/components/LightweightBorder'
import { initiateGoogleLogin } from '@/utils/googleAuth'
import { authenticateUser, createSession } from '@/utils/authStore'
import api from '@/utils/api'
import { toast } from '@/utils/toast'

const LOCKOUT_KEY = 'charusatneeds_lockout_until';


interface LoginFormData { 
  email: string; 
  password: string; 
  captcha: string;
  rememberMe: boolean 
}

interface FormErrors {
  email?: string;
  captcha?: string;
  credentials?: string;
}

// Professional Eye Icon
const EyeIcon = ({ show }: { show: boolean }) => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {show ? (
      <>
        <path d="M2 12C2 12 5.636 5 12 5C18.364 5 22 12 22 12C22 12 18.364 19 12 19C5.636 19 2 12 2 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
      </>
    ) : (
      <>
        <path d="M2 12C2 12 5.636 5 12 5C18.364 5 22 12 22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M12 15C10.343 15 9 13.657 9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M3 21L21 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </>
    )}
  </svg>
);

/* ═══════ Lockout Timer Overlay ═══════ */
function LockoutOverlay({ secondsLeft, onTryAgain }: { secondsLeft: number; onTryAgain: () => void }) {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = Math.max(0, 1 - secondsLeft / 120); // 120s = 2 min
  const isExpired = secondsLeft <= 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-lg" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-sm overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(24px)',
          borderRadius: '28px',
          border: '1px solid rgba(255,255,255,0.6)',
          boxShadow: '0 12px 48px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.8)',
        }}
      >
        <div className="p-7 text-center">
          {/* Shield icon */}
          <div
            className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{
              background: 'linear-gradient(145deg, #fef2f2, #fce4e4)',
              boxShadow: '6px 6px 16px rgba(226,55,68,0.08), -6px -6px 16px rgba(255,255,255,0.9)',
            }}
          >
            <Shield className="w-7 h-7 text-[#e23744]" />
          </div>

          <h3 className="text-lg font-extrabold text-neutral-900 mb-1">
            {isExpired ? 'You can try again!' : 'Too many attempts'}
          </h3>
          <p className="text-xs text-neutral-400 mb-5">
            {isExpired
              ? 'Your lockout period has expired.'
              : 'Please try again after the timer expires'}
          </p>

          {/* Timer circle */}
          {!isExpired && (
            <div className="relative w-24 h-24 mx-auto mb-5">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" stroke="#f5f5f5" strokeWidth="6" />
                <motion.circle
                  cx="50" cy="50" r="44" fill="none" stroke="#e23744" strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={276.46}
                  strokeDashoffset={276.46 * (1 - progress)}
                  transition={{ duration: 0.5 }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="flex items-center gap-0.5">
                    <Clock className="w-3 h-3 text-[#e23744]" />
                    <span className="text-lg font-mono font-extrabold text-neutral-900">
                      {minutes}:{seconds.toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Progress bar for mobile */}
          {!isExpired && (
            <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden mb-5">
              <motion.div
                className="h-full rounded-full"
                style={{
                  width: `${progress * 100}%`,
                  background: 'linear-gradient(90deg, #e23744, #ff6b6b)',
                }}
                transition={{ duration: 0.5 }}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-neutral-100/80">
          <div className="flex divide-x divide-neutral-100/80">
            {!isExpired && (
              <button
                onClick={() => toast.info('We\'ll remind you when the lockout expires!')}
                className="flex-1 py-3.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50/60 transition-all flex items-center justify-center gap-1.5"
              >
                <Bell className="w-3.5 h-3.5" />
                Remind me
              </button>
            )}
            <button
              onClick={onTryAgain}
              className={`flex-1 py-3.5 text-sm font-bold transition-all ${
                isExpired
                  ? 'text-[#e23744] hover:text-red-700 hover:bg-rose-50/60'
                  : 'text-neutral-300 cursor-not-allowed'
              }`}
            >
              Try again
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [formData, setFormData] = useState<LoginFormData>({ 
    email: '', 
    password: '', 
    captcha: '',
    rememberMe: false
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [captchaImage, setCaptchaImage] = useState<string | null>(null)
  const [captchaId, setCaptchaId] = useState<string | null>(null)
  const [captchaLoading, setCaptchaLoading] = useState(false)
  const [lockoutSecondsLeft, setLockoutSecondsLeft] = useState(0)
  const [isLockedOut, setIsLockedOut] = useState(false)

  // MFA challenge state
  const [mfaRequired, setMfaRequired] = useState(false)
  const [mfaCode, setMfaCode] = useState('')

  // MFA setup prompt (shown after login if MFA not enabled)
  const [showMfaPrompt, setShowMfaPrompt] = useState(false)
  const [pendingRedirect, setPendingRedirect] = useState<string>('')
  const [pendingUserRole, setPendingUserRole] = useState<string>('')

  const fetchCaptcha = async () => {
    try {
      setCaptchaLoading(true)
      setCaptchaImage(null) // Show loading state
      const response = await api.get('/auth/captcha')
      const data = response.data
      if (data && (data.image || data.captchaImage)) {
        setCaptchaImage(data.image || data.captchaImage)
        setCaptchaId(data.captchaId || data.id)
        setErrors(prev => ({ ...prev, captcha: undefined }))
      } else {
        throw new Error('Empty captcha payload received')
      }
    } catch (error) {
      console.error('Failed to fetch captcha:', error)
      setErrors(prev => ({ ...prev, captcha: 'Failed to load security code. Click refresh to retry.' }))
    } finally {
      setCaptchaLoading(false)
    }
  }

  const refreshCaptcha = () => {
    fetchCaptcha();
  };

  useEffect(() => {
    fetchCaptcha()
    // Check for persisted lockout on mount (survives browser reopen)
    checkPersistedLockout();
  }, [])

  // Lockout timer countdown
  useEffect(() => {
    if (!isLockedOut) return;
    const timer = setInterval(() => {
      const stored = localStorage.getItem(LOCKOUT_KEY);
      if (!stored) { setIsLockedOut(false); setLockoutSecondsLeft(0); clearInterval(timer); return; }
      const remaining = Math.ceil((parseInt(stored) - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockoutSecondsLeft(0);
        // Don't remove lockout yet — user must click "Try Again"
      } else {
        setLockoutSecondsLeft(remaining);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isLockedOut]);

  const checkPersistedLockout = useCallback(() => {
    const stored = localStorage.getItem(LOCKOUT_KEY);
    if (stored) {
      const remaining = Math.ceil((parseInt(stored) - Date.now()) / 1000);
      if (remaining > 0) {
        setIsLockedOut(true);
        setLockoutSecondsLeft(remaining);
      } else {
        // Timer expired but key exists — show expired overlay so user clicks "Try Again"
        setIsLockedOut(true);
        setLockoutSecondsLeft(0);
      }
    }
  }, []);

  const activateLockout = (minutes: number) => {
    const ms = Math.max(minutes, 2) * 60 * 1000;
    const until = Date.now() + ms;
    localStorage.setItem(LOCKOUT_KEY, until.toString());
    setIsLockedOut(true);
    setLockoutSecondsLeft(Math.ceil(ms / 1000));
  };

  const handleTryAgain = () => {
    const stored = localStorage.getItem(LOCKOUT_KEY);
    if (stored && Date.now() < parseInt(stored)) {
      // Timer not expired — restart it as anti-bypass
      activateLockout(2);
      toast.error('Please wait for the timer to expire');
    } else {
      // Timer expired — allow retry
      localStorage.removeItem(LOCKOUT_KEY);
      setIsLockedOut(false);
      setLockoutSecondsLeft(0);
      refreshCaptcha();
    }
  };

  useEffect(() => {
    if (location.state?.error) {
       setErrors(prev => ({ ...prev, credentials: location.state.error }))
       window.history.replaceState({}, '')
    }
  }, [location]);

  const getEmailHint = (email: string): string | undefined => {
    if (!email || !email.includes('@')) return undefined;
    if (!email.toLowerCase().endsWith('@charusat.edu.in')) return 'Use @charusat.edu.in domain';
    return undefined;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    const newValue = type === 'checkbox' ? checked : value
    setFormData(prev => ({ ...prev, [name]: newValue }))

    if (name === 'email') {
      setErrors(prev => ({ ...prev, email: getEmailHint(value), credentials: undefined }))
    }
    if (name === 'captcha') {
      setErrors(prev => ({ ...prev, captcha: undefined }))
    }
    if (name === 'password') {
      setErrors(prev => ({ ...prev, credentials: undefined }))
    }
  }


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    // ── MFA Code Submission (Step 2) ──
    if (mfaRequired && mfaCode.length === 6) {
      try {
        const authResult = await authenticateUser(formData.email, formData.password, captchaId || undefined, formData.captcha, mfaCode)
        if (authResult.success && authResult.user && authResult.token) {
          createSession(authResult.user, authResult.token, formData.rememberMe, authResult.refreshToken)
          toast.success(`Welcome back, ${authResult.user.fullName}!`)
          setMfaRequired(false)
          setMfaCode('')
          const role = authResult.user.role
          if (role === 'ADMIN') navigate('/analytics', { replace: true })
          else if (role === 'CANTEEN_OWNER') navigate('/dashboard', { replace: true })
          else navigate('/customer/menu', { replace: true })
        } else {
          const msg = authResult.message || 'Invalid MFA code'
          setErrors({ credentials: msg })
          toast.error(msg)
          setMfaCode('')
        }
      } catch {
        toast.error('Verification failed. Try again.')
        setMfaCode('')
      }
      setIsSubmitting(false)
      return
    }

    if (!formData.email || !formData.password) {
      const msg = 'Please enter your credentials';
      setErrors({ credentials: msg })
      toast.error(msg);
      setIsSubmitting(false)
      return
    }

    if (!formData.captcha.trim()) {
      const msg = 'Please enter the security code';
      setErrors({ captcha: msg })
      toast.error(msg);
      setIsSubmitting(false)
      return
    }

    try {
      const authResult = await authenticateUser(formData.email, formData.password, captchaId || undefined, formData.captcha)

      // ── MFA Challenge Response ──
      if (authResult.mfaRequired) {
        setMfaRequired(true)
        setMfaCode('')
        setIsSubmitting(false)
        return
      }

      if (authResult.success && authResult.user && authResult.token) {
        createSession(authResult.user, authResult.token, formData.rememberMe, authResult.refreshToken)
        toast.success(`Welcome back, ${authResult.user.fullName}!`);
        const role = authResult.user.role;
        const targetRoute = role === 'ADMIN' ? '/analytics' : role === 'CANTEEN_OWNER' ? '/dashboard' : '/customer/menu';

        // Show MFA setup prompt if MFA is not enabled (skip for admin)
        if (!authResult.user.mfaEnabled && role !== 'ADMIN') {
          setPendingRedirect(targetRoute)
          setPendingUserRole(role || '')
          setShowMfaPrompt(true)
          setIsSubmitting(false)
          return
        }

        navigate(targetRoute, { replace: true });
      } else {
        // Check if locked out
        if (authResult.lockedMinutes && authResult.lockedMinutes > 0) {
          activateLockout(authResult.lockedMinutes);
          toast.error('Account locked. Please wait.');
        } else {
          const msg = authResult.message || 'Invalid credentials';
          setErrors({ credentials: msg })
          toast.error(msg);
        }
        // Keep form data (credentials preserved for user to verify)
        setFormData(prev => ({ ...prev, captcha: '' }));
        refreshCaptcha()
      }
    } catch (error) {
      console.error('Login error:', error)
      const msg = 'Unable to connect. Please try again.';
      setErrors({ credentials: msg })
      toast.error(msg);
      refreshCaptcha()
    }

    setIsSubmitting(false)
  }

  // Check if credentials error exists (to highlight both fields)
  const hasCredentialsError = !!errors.credentials;

  return (
    <>
    {/* Lockout Timer Overlay */}
    <AnimatePresence>
      {isLockedOut && (
        <LockoutOverlay secondsLeft={lockoutSecondsLeft} onTryAgain={handleTryAgain} />
      )}
    </AnimatePresence>

    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-cream-50 via-white to-cream-100 overflow-x-hidden overflow-y-auto scroll-smooth relative p-4 py-8 gpu-accelerate"
    >
      {/* Top Left Floating Back to Home Button */}
      <Link 
        to="/" 
        className="fixed top-5 left-5 z-30 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-md rounded-2xl text-dark-700 hover:text-brand-600 hover:bg-white shadow-md border border-gray-200/80 transition-all active:scale-95 text-sm font-bold group"
        title="Back to Landing Page"
      >
        <ArrowLeft className="w-4 h-4 text-brand-600 transition-transform group-hover:-translate-x-1" />
        <span>Back to Home</span>
      </Link>

      <div className="absolute top-[-10%] left-[-10%] w-[50vw] max-w-[400px] h-[40vh] max-h-[300px] rounded-full bg-brand-100/20 blur-[50px] pointer-events-none transform-gpu" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] max-w-[400px] h-[40vh] max-h-[300px] rounded-full bg-brand-200/20 blur-[50px] pointer-events-none transform-gpu" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.25 }}
        className="w-full max-w-md relative z-10 transform-gpu"
      >
        <div className="flex justify-center mb-8">
          <CharusatNeedsLogo size="lg" animated />
        </div>

        <LightweightBorder borderColor="#ef4444" radius="1.5rem" animated>
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-dark-900">Welcome Back</h3>
              <p className="text-dark-500 mt-1">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email - Highlighted on credentials error */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-dark-700 ml-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="student@charusat.edu.in"
                  autoComplete="email"
                  className={`w-full px-4 py-3 rounded-xl bg-gray-50 border-2 outline-none transition-all
                             ${hasCredentialsError || errors.email 
                               ? 'border-red-300 bg-red-50/50' 
                               : 'border-gray-200 focus:border-brand-400 focus:bg-white'}`}
                />
                {errors.email && !hasCredentialsError && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-amber-600 font-medium ml-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    {errors.email}
                  </motion.p>
                )}
              </div>

              {/* Password - Highlighted on credentials error */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-dark-700 ml-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={`w-full px-4 py-3 pr-12 rounded-xl bg-gray-50 border-2 outline-none transition-all
                               ${hasCredentialsError 
                                 ? 'border-red-300 bg-red-50/50' 
                                 : 'border-gray-200 focus:border-brand-400 focus:bg-white'}`}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-dark-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                  >
                    <EyeIcon show={showPassword} />
                  </button>
                </div>
                {/* Invalid credentials error - below password field */}
                {errors.credentials && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-600 font-medium ml-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {errors.credentials}
                  </motion.p>
                )}
              </div>

              {/* Captcha */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-dark-700 ml-1">Security Code</label>
                <div className="flex items-center gap-3">
                  {captchaImage ? (
                    <img 
                      src={captchaImage} 
                      alt="Security Code" 
                      className="h-[50px] w-[180px] rounded-xl object-contain bg-gray-50 border-2 border-gray-200 select-none shadow-inner" 
                      onError={() => {
                        console.warn('Captcha image failed to render, refreshing...');
                        fetchCaptcha();
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={refreshCaptcha}
                      className="h-[50px] w-[180px] rounded-xl bg-gray-100 border-2 border-gray-200 flex items-center justify-center text-xs text-gray-500 font-medium hover:bg-gray-200 transition-colors"
                      title="Click to reload security code"
                    >
                      {captchaLoading ? (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 animate-spin text-gray-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                          </svg>
                          <span>Loading code...</span>
                        </div>
                      ) : (
                        <span>Click to load code</span>
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    disabled={captchaLoading}
                    className="p-2.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors border-2 border-gray-200 hover:border-brand-200 disabled:opacity-50"
                    title="Get new security code"
                  >
                    <svg className={`w-5 h-5 ${captchaLoading ? 'animate-spin text-brand-500' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                  </button>
                </div>
                <input
                  type="text"
                  name="captcha"
                  value={formData.captcha}
                  onChange={handleChange}
                  placeholder="Enter code"
                  autoComplete="off"
                  maxLength={6}
                  className={`w-full px-4 py-3 rounded-xl bg-gray-50 border-2 outline-none transition-all tracking-widest font-mono uppercase
                             ${errors.captcha ? 'border-red-300 bg-red-50/50' : 'border-gray-200 focus:border-brand-400 focus:bg-white'}`}
                />
                {errors.captcha && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-600 font-medium ml-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {errors.captcha}
                  </motion.p>
                )}
              </div>

              {/* ── MFA Code Input (shown when MFA challenge received) ── */}
              {mfaRequired && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                    <span className="text-sm font-bold text-blue-900">Two-Factor Verification</span>
                  </div>
                  <p className="text-xs text-blue-700">Enter the 6-digit code from your authenticator app</p>
                  <input
                    type="text"
                    value={mfaCode}
                    onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    maxLength={6}
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl bg-white border-2 border-blue-200 text-center text-2xl font-mono tracking-[0.4em] outline-none focus:border-blue-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => { setMfaRequired(false); setMfaCode(''); }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    ← Cancel and try different credentials
                  </button>
                </motion.div>
              )}

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer text-dark-600 hover:text-dark-900">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span>Remember me</span>
                </label>
                <Link 
                  to="/forgot-password" 
                  state={{ email: formData.email }}
                  className="font-medium text-brand-600 hover:text-brand-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || (mfaRequired && mfaCode.length !== 6)}
                className="w-full bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold 
                           py-3.5 rounded-xl shadow-lg hover:shadow-xl 
                           hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 
                           transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    {mfaRequired ? 'Verifying...' : 'Signing in...'}
                  </>
                ) : mfaRequired ? 'Verify Code' : 'Sign In'}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest text-dark-400">
                <span className="bg-white px-3">Or</span>
              </div>
            </div>

            <button
              onClick={() => initiateGoogleLogin()}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 
                         text-dark-700 font-semibold py-3 rounded-xl 
                         border-2 border-gray-200 transition-all hover:shadow-md hover:border-gray-300"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 text-sm">
              <p className="text-dark-500">
                New to CharusatNeeds?{' '}
                <Link to="/signup" className="font-bold text-brand-600 hover:text-brand-700">Create Account</Link>
              </p>
              <Link to="/" className="inline-flex items-center gap-1.5 font-bold text-dark-500 hover:text-brand-600 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span>Home</span>
              </Link>
            </div>
          </div>
        </LightweightBorder>
      </motion.div>
    </motion.div>

      {/* MFA Setup Prompt Modal */}
      {showMfaPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="max-w-md w-full p-8 rounded-3xl"
            style={{
              background: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              boxShadow: '0 16px 48px rgba(0, 0, 0, 0.15), 0 0 80px rgba(16, 185, 129, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
            }}
          >
            <div className="text-center space-y-5">
              {/* Shield icon with emerald gradient background */}
              <div className="relative mx-auto w-16 h-16">
                <div
                  className="absolute inset-0 rounded-2xl animate-pulse"
                  style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(6, 78, 59, 0.12))',
                    filter: 'blur(12px)',
                  }}
                />
                <div
                  className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                  }}
                >
                  <svg className="w-8 h-8 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">Secure Your Account</h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Enable Two-Factor Authentication (MFA) to add an extra layer of security.
                  Use Google Authenticator or Microsoft Authenticator to protect your account.
                </p>
              </div>

              {/* Clickable text links instead of buttons */}
              <div className="flex flex-col items-center gap-4 pt-3">
                <span
                  onClick={() => {
                    setShowMfaPrompt(false)
                    const securityRoute = pendingUserRole === 'CANTEEN_OWNER' ? '/vendor/security' : '/customer/security'
                    navigate(securityRoute, { replace: true })
                  }}
                  className="cursor-pointer text-base font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent hover:from-emerald-500 hover:to-teal-500 transition-all underline underline-offset-4 decoration-emerald-500/60 hover:decoration-emerald-400"
                >
                  Set up now →
                </span>
                <span
                  onClick={() => {
                    setShowMfaPrompt(false)
                    navigate(pendingRedirect, { replace: true })
                  }}
                  className="cursor-pointer text-sm text-slate-500 hover:text-slate-700 transition-colors font-medium"
                >
                  I'll do this later
                </span>
              </div>

              <p className="text-[11px] text-slate-500">
                You can always enable MFA later from Settings → Security
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}
