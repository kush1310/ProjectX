/**
 * Premium Signup Page
 * 
 * Features:
 * - ON-TYPE validation (validates immediately as you type)
 * - ElectroBorder effect
 * - Skeleton loading
 * - PasswordStrength indicator
 * - RED brand theme
 */

import { useState, ChangeEvent, FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import CharusatNeedsLogo from '@/components/Logo'
import ElectroBorder from '@/Canteen/components/ElectroBorder'
import PasswordStrength from '@/components/PasswordStrength'
import AuthSkeleton from '@/components/skeletons/AuthSkeleton'
import { useDynamicLoading } from '@/components/DynamicSkeleton'
import { initiateGoogleLogin } from '@/utils/googleAuth'
import { toast } from '@/utils/toast'
import { registerUser, createSession } from '@/utils/authStore'

interface SignupFormData {
  fullName: string;
  mobile: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

interface FormErrors {
  fullName?: string;
  mobile?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  agreeToTerms?: string;
  [key: string]: string | undefined;
}

export default function Signup() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<SignupFormData>({
    fullName: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Dynamic loading with 1.3s fixed minimum
  const isLoading = useDynamicLoading(1300);

  // ON-TYPE validation functions
  const validateEmail = (email: string): string | undefined => {
    if (!email) return undefined
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return 'Invalid email format'
    if (!email.toLowerCase().endsWith('@charusat.edu.in')) return 'Use @charusat.edu.in email'
    return undefined
  }

  const validateMobile = (mobile: string): string | undefined => {
    if (!mobile) return undefined
    if (!/^\d{10}$/.test(mobile)) return '10-digit number required'
    return undefined
  }

  const validateConfirmPassword = (confirm: string, password: string): string | undefined => {
    if (!confirm) return undefined
    if (confirm !== password) return 'Passwords do not match'
    return undefined
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    const newValue = type === 'checkbox' ? checked : value
    const newFormData = { ...formData, [name]: newValue }
    setFormData(newFormData)

    // ON-TYPE validation
    const newErrors = { ...errors }

    if (name === 'email') {
      newErrors.email = validateEmail(value)
    }
    if (name === 'mobile') {
      newErrors.mobile = validateMobile(value)
    }
    if (name === 'confirmPassword') {
      newErrors.confirmPassword = validateConfirmPassword(value, formData.password)
    }
    if (name === 'password' && formData.confirmPassword) {
      newErrors.confirmPassword = validateConfirmPassword(formData.confirmPassword, value)
    }
    if (name === 'fullName' && errors.fullName) {
      newErrors.fullName = undefined
    }

    setErrors(newErrors)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const validationErrors: FormErrors = {}

    if (!formData.fullName.trim()) {
      validationErrors.fullName = 'Name is required'
    }
    
    const mobileError = validateMobile(formData.mobile)
    if (!formData.mobile) {
      validationErrors.mobile = 'Mobile is required'
    } else if (mobileError) {
      validationErrors.mobile = mobileError
    }

    const emailError = validateEmail(formData.email)
    if (!formData.email) {
      validationErrors.email = 'Email is required'
    } else if (emailError) {
      validationErrors.email = emailError
    }

    if (!formData.password) {
      validationErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      validationErrors.password = 'Minimum 8 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      validationErrors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.agreeToTerms) {
      validationErrors.agreeToTerms = 'Accept terms to continue'
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      const firstError = Object.values(validationErrors).filter(Boolean)[0]
      if (firstError) toast.error(firstError)
      setIsSubmitting(false)
      return
    }

    await new Promise(resolve => setTimeout(resolve, 600))

    const registerResult = registerUser({
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
      mobile: formData.mobile
    })

    if (registerResult.success) {
      createSession({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        mobile: formData.mobile
      })
      toast.success("Account created successfully!")
      setTimeout(() => navigate('/dashboard'), 600)
    } else {
      toast.error(registerResult.message)
      setErrors({ email: registerResult.message })
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
      <div className="absolute top-[-15%] right-[-15%] w-[60vw] max-w-[500px] h-[40vh] max-h-[350px] rounded-full bg-brand-100/30 blur-[80px] sm:blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-15%] w-[60vw] max-w-[500px] h-[40vh] max-h-[350px] rounded-full bg-brand-200/30 blur-[80px] sm:blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row-reverse items-center justify-center 
                      p-3 xs:p-4 sm:p-6 lg:p-8 py-6 sm:py-8 lg:py-0 
                      relative z-10 gap-6 sm:gap-8 lg:gap-16 xl:gap-24 min-h-screen min-h-[100dvh]">

        {/* RIGHT (Desktop): Logo */}
        <div className="hidden lg:flex lg:w-1/2 flex-col items-center lg:items-end text-center lg:text-right">
          <div className="p-2 lg:p-4">
            <CharusatNeedsLogo size="xl" falling showTagline={false} animated />
          </div>
        </div>

        {/* LEFT: Signup Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
          className="w-full max-w-[min(420px,95vw)] sm:max-w-md lg:w-1/2"
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
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-4 xs:p-5 sm:p-6 lg:p-8 shadow-xl">
              {/* Mobile Logo */}
              <div className="lg:hidden flex justify-center mb-3 sm:mb-4">
                <CharusatNeedsLogo size="lg" falling animated />
              </div>

              <div className="text-center mb-4 sm:mb-5">
                <h3 className="text-xl sm:text-2xl font-bold text-dark-900">Create Account</h3>
                <p className="text-dark-500 mt-1 text-sm sm:text-base">Join with your university email</p>
              </div>

              {/* Google Button */}
              <button
                onClick={() => initiateGoogleLogin()}
                className="w-full flex items-center justify-center gap-2 sm:gap-3 bg-white hover:bg-gray-50 
                           text-dark-700 font-semibold py-2.5 sm:py-3 rounded-xl sm:rounded-2xl 
                           border border-gray-200 transition-all hover:shadow-md 
                           text-sm sm:text-base"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>Sign up with Google</span>
              </button>

              {/* Divider */}
              <div className="relative my-4 sm:my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-[10px] sm:text-xs uppercase tracking-widest text-dark-400">
                  <span className="bg-white px-3">Or register manually</span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3">
                {/* Name + Mobile Row */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="space-y-1">
                    <input
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      type="text"
                      placeholder="Full Name"
                      autoComplete="name"
                      className={`w-full px-3 py-2.5 sm:py-3 rounded-xl bg-gray-50/50 border-2 outline-none 
                                 transition-all text-sm sm:text-base
                                 ${errors.fullName ? 'border-red-300 bg-red-50/50' : 'border-gray-200 focus:border-brand-400'}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <input
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      type="tel"
                      placeholder="Mobile"
                      autoComplete="tel"
                      className={`w-full px-3 py-2.5 sm:py-3 rounded-xl bg-gray-50/50 border-2 outline-none 
                                 transition-all text-sm sm:text-base
                                 ${errors.mobile ? 'border-red-300 bg-red-50/50' : 'border-gray-200 focus:border-brand-400'}`}
                    />
                    {errors.mobile && <p className="text-[10px] text-red-500 ml-1">{errors.mobile}</p>}
                  </div>
                </div>

                {/* Email - ON-TYPE validation */}
                <div className="space-y-1">
                  <input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    type="email"
                    placeholder="student@charusat.edu.in"
                    autoComplete="email"
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-gray-50/50 border-2 outline-none 
                               transition-all text-sm sm:text-base
                               ${errors.email ? 'border-red-300 bg-red-50/50' : 'border-gray-200 focus:border-brand-400'}`}
                  />
                  {errors.email && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] sm:text-xs text-red-500 ml-1">
                      {errors.email}
                    </motion.p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <div className="relative">
                    <input
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      autoComplete="new-password"
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 rounded-xl bg-gray-50/50 border-2 
                                 outline-none transition-all text-sm sm:text-base
                                 ${errors.password ? 'border-red-300 bg-red-50/50' : 'border-gray-200 focus:border-brand-400'}`}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-brand-600 p-1"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </div>
                  <PasswordStrength password={formData.password} showRequirements={formData.password.length > 0} />
                </div>

                {/* Confirm Password - ON-TYPE validation */}
                <div className="space-y-1">
                  <div className="relative">
                    <input
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      autoComplete="new-password"
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 rounded-xl bg-gray-50/50 border-2 
                                 outline-none transition-all text-sm sm:text-base
                                 ${errors.confirmPassword ? 'border-red-300 bg-red-50/50' : 'border-gray-200 focus:border-brand-400'}`}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-brand-600 p-1"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-[10px] sm:text-xs text-red-500 ml-1">{errors.confirmPassword}</p>}
                </div>

                {/* Terms */}
                <div className="flex items-start gap-2 text-xs sm:text-sm text-dark-500 pt-1">
                  <input
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                    type="checkbox"
                    className="mt-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="leading-snug">
                    I agree to the <a href="#" className="text-brand-600 font-medium">Terms of Service</a> and{' '}
                    <a href="#" className="text-brand-600 font-medium">Privacy Policy</a>
                  </span>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold 
                             py-3 sm:py-3.5 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl 
                             hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 
                             transition-all mt-2 text-sm sm:text-base"
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>

              <p className="text-center mt-4 sm:mt-5 text-dark-500 text-xs sm:text-sm">
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-brand-600 hover:text-brand-700">
                  Sign In
                </Link>
              </p>
            </div>
          </ElectroBorder>
        </motion.div>
      </div>
    </motion.div>
  )
}
