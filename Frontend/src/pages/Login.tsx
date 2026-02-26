/**
 * Login Page - Enhanced with Both Fields Highlighted on Error
 * 
 * Features:
 * - Both email & password highlighted on invalid credentials
 * - 6-character captcha with error messages
 * - Professional eye icons
 * - Remember Me controls cookie persistence
 */

import { useState, FormEvent, ChangeEvent, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import CharusatNeedsLogo from '@/components/Logo'
import LightweightBorder from '@/components/LightweightBorder'
import { initiateGoogleLogin } from '@/utils/googleAuth'
import { authenticateUser, createSession } from '@/utils/authStore'
import api from '@/utils/api'
import { toast } from '@/utils/toast'

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

  const fetchCaptcha = async () => {
    try {
      setCaptchaImage(null) // Show loading state
      const response = await api.get('/auth/captcha')
      setCaptchaImage(response.data.image)
      setCaptchaId(response.data.id)
    } catch (error) {
      console.error('Failed to fetch captcha:', error)
      setErrors(prev => ({ ...prev, captcha: 'Failed to load security code.' }))
    }
  }

  const refreshCaptcha = () => {
    fetchCaptcha();
  };

  useEffect(() => {
    fetchCaptcha()
  }, [])

  useEffect(() => {
    if (location.state?.error) {
       setErrors(prev => ({ ...prev, credentials: location.state.error }))
       // Clear state to prevent persistence on refresh
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

    // Validate Captcha locally (basic)
    // Server validation is primary now

    try {
      // Pass captchaId and Answer
      const authResult = await authenticateUser(formData.email, formData.password, captchaId || undefined, formData.captcha)

      if (authResult.success && authResult.user && authResult.token) {
        createSession(authResult.user, authResult.token, formData.rememberMe)
        
        toast.success(`Welcome back, ${authResult.user.fullName}!`);
        
        // Role-Based Redirect
        const role = authResult.user.role;
        if (role === 'ADMIN') {
           navigate('/analytics', { replace: true });
        } else if (role === 'CANTEEN_OWNER') {
           navigate('/dashboard', { replace: true });
        } else {
           navigate('/customer/menu', { replace: true });
        }
        
      } else {
        // Set credentials error - this will highlight BOTH email and password fields
        const msg = authResult.message || 'Invalid credentials';
        setErrors({ credentials: msg })
        toast.error(msg);
        refreshCaptcha()
      }
    } catch (error) {
      // Network or unexpected error - show error message instead of refreshing
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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-cream-50 via-white to-cream-100 overflow-x-hidden relative p-4"
    >
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] max-w-[400px] h-[40vh] max-h-[300px] rounded-full bg-brand-100/30 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] max-w-[400px] h-[40vh] max-h-[300px] rounded-full bg-brand-200/30 blur-[80px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.3 }}
        className="w-full max-w-md relative z-10"
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
                      alt="Captcha" 
                      className="h-[50px] w-[180px] rounded-xl object-cover border-2 border-gray-200" 
                    />
                  ) : (
                    <div className="h-[50px] w-[180px] rounded-xl bg-gray-100 animate-pulse border-2 border-gray-200" />
                  )}
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    className="p-2.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors border-2 border-gray-200 hover:border-brand-200"
                    title="Get new code"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
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
                disabled={isSubmitting}
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
                    Signing in...
                  </>
                ) : 'Sign In'}
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

            <p className="text-center mt-6 text-dark-500 text-sm">
              New to CharusatNeeds?{' '}
              <Link to="/signup" className="font-bold text-brand-600 hover:text-brand-700">Create Account</Link>
            </p>
          </div>
        </LightweightBorder>
      </motion.div>
    </motion.div>
  )
}
