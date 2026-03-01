/**
 * Signup Page - Enhanced with Strict Validation
 * 
 * Features:
 * - Full-width name field (alphabets only)
 * - Mobile with +91 India country code (numbers only, error after 8+ chars)
 * - Password copy disabled
 * - Professional eye icons
 * - Terms popup modal
 * - Strict input sanitization
 */

import { useState, ChangeEvent, FormEvent, useEffect, ClipboardEvent } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import CharusatNeedsLogo from '@/components/Logo'
import LightweightBorder from '@/components/LightweightBorder'
import PasswordStrength from '@/components/PasswordStrength'
import TermsModal from '@/components/TermsModal'
import { initiateGoogleLogin } from '@/utils/googleAuth'
import { toast } from '@/utils/toast'
import { registerUser, createSession, isAuthenticated } from '@/utils/authStore'
import { validatePasswordStrict, validateMobileStrict } from '@/utils/validation'

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
  general?: string;
}

// Professional Eye Icon Component
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
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [_turnstileToken, setTurnstileToken] = useState<string | null>(null)

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  // Email hint after @
  const getEmailHint = (email: string): string | undefined => {
    if (!email || !email.includes('@')) return undefined;
    if (!email.toLowerCase().endsWith('@charusat.edu.in')) {
      return 'Use @charusat.edu.in domain';
    }
    return undefined;
  };



  const validateConfirmPassword = (confirm: string, password: string): string | undefined => {
    if (!confirm) return undefined;
    if (confirm !== password) return 'Passwords do not match';
    return undefined;
  };

  // Sanitize name input - only alphabets and spaces
  const sanitizeName = (value: string): string => {
    return value.replace(/[^a-zA-Z\s]/g, '');
  };

  // Sanitize mobile input - only numbers
  const sanitizeMobile = (value: string): string => {
    return value.replace(/[^0-9]/g, '').slice(0, 10);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    let sanitizedValue = value;

    // Apply sanitization based on field
    if (name === 'fullName') {
      sanitizedValue = sanitizeName(value);
    }
    if (name === 'mobile') {
      sanitizedValue = sanitizeMobile(value);
    }

    const newValue = type === 'checkbox' ? checked : sanitizedValue;
    setFormData(prev => ({ ...prev, [name]: newValue }))

    const newErrors = { ...errors, general: undefined }

    if (name === 'email') {
      newErrors.email = getEmailHint(sanitizedValue)
    }
    if (name === 'mobile') {
      newErrors.mobile = validateMobileStrict(sanitizedValue)
    }
    if (name === 'confirmPassword') {
      newErrors.confirmPassword = validateConfirmPassword(sanitizedValue, formData.password)
    }


// ... (inside component)

    if (name === 'password') {
      const passwordError = validatePasswordStrict(sanitizedValue);
      newErrors.password = passwordError;
      
      // Clear confirm mismatch if password changes
      if (formData.confirmPassword) {
        newErrors.confirmPassword = validateConfirmPassword(formData.confirmPassword, sanitizedValue);
      }
    }
    if (name === 'fullName' && errors.fullName) {
      newErrors.fullName = undefined
    }

    setErrors(newErrors)
  }

  // Disable copy from password field
  const handlePasswordCopy = (e: ClipboardEvent) => {
    e.preventDefault();
  };

  // Handle terms checkbox click
  const handleTermsClick = () => {
    if (!formData.agreeToTerms) {
      setShowTermsModal(true);
    } else {
      setFormData(prev => ({ ...prev, agreeToTerms: false }));
    }
  };

  // Accept terms from modal
  const handleAcceptTerms = () => {
    setFormData(prev => ({ ...prev, agreeToTerms: true }));
    setShowTermsModal(false);
    setErrors(prev => ({ ...prev, agreeToTerms: undefined }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const validationErrors: FormErrors = {}

    if (!formData.fullName.trim()) {
      validationErrors.fullName = 'Name is required'
    }
    
    if (!formData.mobile) {
      validationErrors.mobile = 'Mobile is required'
    } else if (formData.mobile.length !== 10) {
      validationErrors.mobile = 'Mobile number must have 10 digits'
    }

    if (!formData.email) {
      validationErrors.email = 'Email is required'
    } else if (!formData.email.toLowerCase().endsWith('@charusat.edu.in')) {
      validationErrors.email = 'Use @charusat.edu.in email'
    }

    if (!formData.password) {
      validationErrors.password = 'Password is required'
    } else if (formData.password.length < 8 || formData.password.length > 15) {
      validationErrors.password = 'Password must be 8-15 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      validationErrors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.agreeToTerms) {
      validationErrors.agreeToTerms = 'required'
      setShowTermsModal(true)
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setIsSubmitting(false)
      return
    }

    // Updated to async API call
    const registerResult = await registerUser({
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
      mobile: formData.mobile
    })

    if (registerResult.success) {
      if (registerResult.token) {
        // Auto-login (Legacy/Dev)
        createSession(registerResult.user!, registerResult.token, true)
        toast.success("Account created successfully!")
        setTimeout(() => navigate('/dashboard', { replace: true }), 600)
      } else {
        // Verification Required Flow
        toast.success(registerResult.message || "Registration successful! Please check your email.")
        setTimeout(() => navigate('/login'), 2000)
      }
    } else {
      setErrors({ general: registerResult.message })
    }

    setIsSubmitting(false)
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-cream-50 via-white to-cream-100 overflow-x-hidden relative p-4 py-8"
    >
      {/* Background */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] max-w-[400px] h-[40vh] max-h-[300px] rounded-full bg-brand-100/30 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] max-w-[400px] h-[40vh] max-h-[300px] rounded-full bg-brand-200/30 blur-[80px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.3 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <CharusatNeedsLogo size="lg" animated />
        </div>

        {/* Signup Card */}
        <LightweightBorder borderColor="#ef4444" radius="1.5rem" animated>
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="text-center mb-5">
              <h3 className="text-2xl font-bold text-dark-900">Create Account</h3>
              <p className="text-dark-500 mt-1">Join with your university email</p>
            </div>

            {/* General Error */}
            {errors.general && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 text-center font-medium"
              >
                {errors.general}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Full Name - Full Width */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-dark-700 ml-1">Full Name</label>
                <input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  type="text"
                  placeholder="Enter your full name"
                  autoComplete="name"
                  className={`w-full px-4 py-3 rounded-xl bg-gray-50 border-2 outline-none transition-all
                             ${errors.fullName ? 'border-red-300 bg-red-50/50' : 'border-gray-200 focus:border-brand-400'}`}
                />
                {errors.fullName && <p className="text-xs text-red-500 ml-1">{errors.fullName}</p>}
              </div>

              {/* Mobile with +91 - Entire field highlights on error */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-dark-700 ml-1">Mobile Number</label>
                <div className={`flex rounded-xl overflow-hidden border-2 transition-all
                               ${errors.mobile ? 'border-red-300 bg-red-50/50' : 'border-gray-200'}`}>
                  {/* India Country Code - Highlights with field */}
                  <div className={`flex items-center gap-1.5 px-3 py-3 font-medium shrink-0
                                ${errors.mobile ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-dark-600'}`}>
                    <img src="/images/IndianFlag.svg" alt="India" className="w-5 h-4 object-contain" />
                    <span>+91</span>
                  </div>
                  <input
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    type="tel"
                    placeholder="10 digit number"
                    autoComplete="tel"
                    inputMode="numeric"
                    maxLength={10}
                    className={`flex-1 px-4 py-3 outline-none transition-all
                               ${errors.mobile ? 'bg-red-50/50' : 'bg-gray-50 focus:bg-white'}`}
                  />
                </div>
                {errors.mobile && <p className="text-xs text-red-500 ml-1">{errors.mobile}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-dark-700 ml-1">Email</label>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  type="email"
                  placeholder="student@charusat.edu.in"
                  autoComplete="email"
                  className={`w-full px-4 py-3 rounded-xl bg-gray-50 border-2 outline-none transition-all
                             ${errors.email ? 'border-amber-300 bg-amber-50/50' : 'border-gray-200 focus:border-brand-400'}`}
                />
                {errors.email && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-amber-600 ml-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    {errors.email}
                  </motion.p>
                )}
              </div>

              {/* Password - Copy Disabled */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-dark-700 ml-1">Password</label>
                <div className="relative">
                  <input
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onCopy={handlePasswordCopy}
                    onCut={handlePasswordCopy}
                    type={showPassword ? "text" : "password"}
                    placeholder="8-15 characters"
                    autoComplete="new-password"
                    maxLength={15}
                    className={`w-full px-4 py-3 pr-12 rounded-xl bg-gray-50 border-2 outline-none transition-all
                               ${errors.password ? 'border-red-300 bg-red-50/50' : 'border-gray-200 focus:border-brand-400'}`}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-dark-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                  >
                    <EyeIcon show={showPassword} />
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 ml-1">{errors.password}</p>}
                <PasswordStrength password={formData.password} showRequirements={formData.password.length > 0} />
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-dark-700 ml-1">Confirm Password</label>
                <div className="relative">
                  <input
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    maxLength={15}
                    className={`w-full px-4 py-3 pr-12 rounded-xl bg-gray-50 border-2 outline-none transition-all
                               ${errors.confirmPassword ? 'border-red-300 bg-red-50/50' : 'border-gray-200 focus:border-brand-400'}`}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-dark-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                  >
                    <EyeIcon show={showConfirmPassword} />
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-500 ml-1">{errors.confirmPassword}</p>}
              </div>

              {/* Cloudflare Placeholder */}
              <div className="py-2">
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">Cloudflare Security Check</p>
                  <button 
                    type="button" 
                    onClick={() => setTurnstileToken('demo-token')}
                    className="mt-1 text-xs text-brand-600 hover:text-brand-700"
                  >
                    [Dev: Verify]
                  </button>
                </div>
              </div>

              {/* Terms - Clickable to open modal */}
              <div className="flex items-center gap-3 text-sm text-dark-500 pt-1">
                <button
                  type="button"
                  onClick={handleTermsClick}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                             ${formData.agreeToTerms 
                               ? 'bg-brand-500 border-brand-500' 
                               : errors.agreeToTerms ? 'border-red-400' : 'border-gray-300 hover:border-brand-400'}`}
                >
                  {formData.agreeToTerms && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                <span className="leading-snug">
                  I agree to the <button type="button" onClick={() => setShowTermsModal(true)} className="text-brand-600 font-medium hover:underline">Terms</button> and{' '}
                  <button type="button" onClick={() => setShowTermsModal(true)} className="text-brand-600 font-medium hover:underline">Privacy Policy</button>
                </span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold 
                           py-3.5 rounded-xl shadow-lg hover:shadow-xl 
                           hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 transition-all mt-2"
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest text-dark-400">
                <span className="bg-white px-3">Or</span>
              </div>
            </div>

            {/* Google */}
            <button
              onClick={() => initiateGoogleLogin()}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 
                         text-dark-700 font-semibold py-3 rounded-xl 
                         border-2 border-gray-200 transition-all hover:shadow-md hover:border-gray-300"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              <span>Sign up with Google</span>
            </button>

            <p className="text-center mt-5 text-dark-500 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-brand-600 hover:text-brand-700">Sign In</Link>
            </p>
          </div>
        </LightweightBorder>
      </motion.div>

      {/* Terms Modal */}
      <TermsModal 
        isOpen={showTermsModal} 
        onClose={() => setShowTermsModal(false)} 
        onAccept={handleAcceptTerms}
      />
    </motion.div>
  )
}
