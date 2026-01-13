/**
 * Premium Login Page
 * 
 * Features:
 * - ON-TYPE validation (validates as you type, not on blur)
 * - ElectroBorder effect
 * - Skeleton loading
 * - RED brand theme
 */

import { useState, FormEvent, ChangeEvent } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import CharusatNeedsLogo from '@/components/Logo'
import ElectroBorder from '@/Canteen/components/ElectroBorder'
import AuthSkeleton from '@/components/skeletons/AuthSkeleton'
import { useDynamicLoading } from '@/components/DynamicSkeleton'
import { initiateGoogleLogin } from '@/utils/googleAuth'
import { toast } from '@/utils/toast'
import { authenticateUser, createSession } from '@/utils/authStore'

interface LoginFormData { 
  email: string; 
  password: string; 
  rememberMe: boolean 
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function Login() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<LoginFormData>({ email: '', password: '', rememberMe: false })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // Dynamic loading with 1.3s fixed minimum + network delay
  const isLoading = useDynamicLoading(1300);

  // ON-TYPE email validation - validates immediately as user types
  const validateEmail = (email: string): string | undefined => {
    if (!email) return undefined
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return 'Invalid email format'
    }
    if (!email.toLowerCase().endsWith('@charusat.edu.in')) {
      return 'Use @charusat.edu.in email'
    }
    return undefined
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    const newValue = type === 'checkbox' ? checked : value
    setFormData(prev => ({ ...prev, [name]: newValue }))

    // ON-TYPE validation for email
    if (name === 'email') {
      const emailError = validateEmail(value)
      setErrors(prev => ({ ...prev, email: emailError }))
    }

    // Clear password error on type
    if (name === 'password' && errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    // Validate email
    const emailError = validateEmail(formData.email)
    if (emailError || !formData.email) {
      setErrors({ email: emailError || 'Email is required' })
      toast.error(emailError || 'Email is required')
      setIsSubmitting(false)
      return
    }

    if (!formData.password) {
      setErrors({ password: 'Password is required' })
      toast.error('Password is required')
      setIsSubmitting(false)
      return
    }

    await new Promise(resolve => setTimeout(resolve, 500))

    const authResult = authenticateUser(formData.email, formData.password)

    if (authResult.success && authResult.user) {
      createSession(authResult.user)
      toast.success("Welcome back!")
      setTimeout(() => navigate('/dashboard'), 400)
    } else {
      // Show specific error message
      toast.error(authResult.message)
      setErrors({ general: authResult.message })
    }

    setIsSubmitting(false)
  }

  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-cream-50 via-white to-cream-100">
        <AuthSkeleton />
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="min-h-screen min-h-[100dvh] flex bg-gradient-to-br from-cream-50 via-white to-cream-100 overflow-x-hidden relative"
    >
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-20%] w-[70vw] max-w-[600px] h-[50vh] max-h-[400px] rounded-full bg-brand-100/30 blur-[80px] sm:blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-20%] w-[70vw] max-w-[600px] h-[50vh] max-h-[400px] rounded-full bg-brand-200/30 blur-[80px] sm:blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center 
                      p-3 xs:p-4 sm:p-6 lg:p-8 py-6 sm:py-8 lg:py-0 
                      relative z-10 gap-6 sm:gap-8 lg:gap-16 xl:gap-24 min-h-screen min-h-[100dvh]">

        {/* LEFT: Logo */}
        <div className="hidden lg:flex lg:w-1/2 flex-col items-center lg:items-start text-center lg:text-left">
          <div className="p-2 lg:p-4">
            <CharusatNeedsLogo size="xl" falling showTagline={false} animated />
          </div>
        </div>

        {/* RIGHT: Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
          className="w-full max-w-[min(400px,95vw)] sm:max-w-md lg:w-1/2"
        >
          <ElectroBorder 
            borderColor="#ef4444" 
            borderWidth={2.5} 
            distortion={0.2} 
            animationSpeed={0.3}
            radius="1.5rem"
            glow={false}
            aura={false}
            glowBlur={8}
          >
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-4 xs:p-5 sm:p-6 lg:p-8 xl:p-10 shadow-xl">
              {/* Mobile Logo */}
              <div className="lg:hidden flex justify-center mb-4 sm:mb-6">
                <CharusatNeedsLogo size="lg" falling animated />
              </div>

              <div className="text-center mb-5 sm:mb-6 lg:mb-8">
                <h3 className="text-xl sm:text-2xl font-bold text-dark-900">Welcome Back</h3>
                <p className="text-dark-500 mt-1 text-sm sm:text-base">Sign in to your account</p>
              </div>

              {/* Google Button */}
              <button
                onClick={() => initiateGoogleLogin()}
                className="w-full flex items-center justify-center gap-2 sm:gap-3 bg-white hover:bg-gray-50 
                           text-dark-700 font-semibold py-2.5 sm:py-3 lg:py-3.5 rounded-xl sm:rounded-2xl 
                           border border-gray-200 transition-all hover:shadow-md 
                           text-sm sm:text-base"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="relative my-4 sm:my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-[10px] sm:text-xs uppercase tracking-widest text-dark-400">
                  <span className="bg-white px-3">Or with email</span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                {/* Email - ON-TYPE validation */}
                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-medium text-dark-700 ml-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="student@charusat.edu.in"
                    autoComplete="email"
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-gray-50/50 
                               border-2 outline-none transition-all text-sm sm:text-base
                               ${errors.email 
                                 ? 'border-red-300 bg-red-50/50 focus:border-red-400' 
                                 : 'border-gray-200 focus:border-brand-400 focus:bg-white'}`}
                  />
                  {errors.email && (
                    <motion.p 
                      initial={{ opacity: 0, y: -4 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[11px] sm:text-xs text-red-600 font-medium ml-1"
                    >
                      {errors.email}
                    </motion.p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-medium text-dark-700 ml-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 rounded-xl sm:rounded-2xl 
                                 bg-gray-50/50 border-2 outline-none transition-all text-sm sm:text-base
                                 ${errors.password 
                                   ? 'border-red-300 bg-red-50/50 focus:border-red-400' 
                                   : 'border-gray-200 focus:border-brand-400 focus:bg-white'}`}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-brand-600 transition-colors p-1"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <label className="flex items-center gap-2 cursor-pointer text-dark-600 hover:text-dark-900">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span>Remember me</span>
                  </label>
                  <a href="#" className="font-medium text-brand-600 hover:text-brand-700">Forgot Password?</a>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold 
                             py-3 sm:py-3.5 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl 
                             hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:scale-100 
                             transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </>
                  ) : 'Sign In'}
                </button>
              </form>

              <p className="text-center mt-5 sm:mt-6 text-dark-500 text-xs sm:text-sm">
                New to CharusatNeeds?{' '}
                <Link to="/signup" className="font-bold text-brand-600 hover:text-brand-700">
                  Create Account
                </Link>
              </p>
            </div>
          </ElectroBorder>
        </motion.div>
      </div>
    </motion.div>
  )
}
