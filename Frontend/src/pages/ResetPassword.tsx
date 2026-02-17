/**
 * Reset Password Page - Secure Token-Based
 * 
 * Flow:
 * 1. Validates token on load
 * 2. If valid -> shows "Set new password" form with Strength Meter
 * 3. On submit -> calls API
 * 4. Shows "Password reset" success state with "Continue" button
 */

import { useState, useEffect, FormEvent, ClipboardEvent } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import CharusatNeedsLogo from '@/components/Logo'
import LightweightBorder from '@/components/LightweightBorder'
import PasswordStrength from '@/components/PasswordStrength'
import { toast } from 'react-hot-toast'
import { validatePasswordStrict } from '@/utils/validation'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

// Eye Icon
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

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  
  // States
  const [isValidating, setIsValidating] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string; api?: string }>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Validate token on load
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        toast.error('No reset token provided')
        navigate('/login', { replace: true })
        return
      }
      
      try {
        const response = await fetch(`http://localhost:8080/api/auth/validate-token?token=${token}`)
        const data = await response.json()
        
        if (data.valid) {
          setUserEmail(data.email || '')
          setIsValidating(false)
        } else {
          toast.error(data.message || 'Invalid or expired reset link')
          navigate('/login', { replace: true })
        }
      } catch (error) {
        toast.error('Invalid or expired token')
        navigate('/login', { replace: true })
      }
    }
    
    validateToken()
  }, [token, navigate])

  const handleCopyPaste = (e: ClipboardEvent) => e.preventDefault()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (name === 'password') {
      setErrors(prev => ({ ...prev, password: validatePasswordStrict(value), api: undefined }))
    }
    if (name === 'confirmPassword' && value === formData.password) {
       setErrors(prev => ({ ...prev, confirmPassword: undefined }))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    const newErrors: typeof errors = {}
    const passwordError = validatePasswordStrict(formData.password);
    if (passwordError) newErrors.password = passwordError;
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('http://localhost:8080/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: formData.password })
      })
      const data = await response.json()
      
      if (data.success) {
        setIsSuccess(true)
        toast.success('Password reset successfully!')
      } else {
        setErrors({ api: data.message || 'Failed to reset password' })
      }
    } catch (err) {
      setErrors({ api: 'Network error. Please try again.' })
    }
    setIsSubmitting(false)
  }

  // 1. Loading State
  if (isValidating) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center bg-gray-50 p-4"
      >
        <div className="w-full max-w-md">
           <div className="flex justify-center mb-8"><CharusatNeedsLogo size="lg" animated /></div>
           <LightweightBorder borderColor="#e5e7eb" radius="1.5rem">
             <div className="bg-white rounded-3xl p-10 shadow-xl text-center">
               <Skeleton circle width={60} height={60} className="mx-auto mb-6" />
               <Skeleton height={24} width={150} className="mx-auto mb-4" />
               <Skeleton height={40} className="mx-auto mt-6" />
             </div>
           </LightweightBorder>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream-50 via-white to-cream-100 p-4 relative overflow-hidden"
    >
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] max-w-[400px] h-[40vh] max-h-[300px] rounded-full bg-brand-100/30 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] max-w-[400px] h-[40vh] max-h-[300px] rounded-full bg-brand-200/30 blur-[80px] pointer-events-none" />

      <div className="w-full max-w-[440px] relative z-10 px-4">
        <div className="flex justify-center mb-8"><CharusatNeedsLogo size="lg" animated /></div>

        <LightweightBorder borderColor="#ef4444" radius="1.5rem" animated>
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl">
            
            {/* 2. Success State */}
            {isSuccess ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                <div className="w-16 h-16 bg-brand-50 rounded-xl flex items-center justify-center mx-auto mb-6 border border-brand-100 shadow-sm">
                  <svg className="w-8 h-8 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-dark-900 mb-2">Password reset</h3>
                <p className="text-dark-500 text-sm mb-8">
                  Your password has been successfully reset.<br/>Click below to log in magically.
                </p>
                
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-brand-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-brand-700 transition-all mb-6"
                >
                  Continue
                </button>

                <div className="flex justify-center">
                    <Link to="/login" className="flex items-center gap-2 text-dark-500 hover:text-dark-900 font-medium transition-colors text-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to log in
                    </Link>
                </div>
              </motion.div>
            ) : (
              /* 3. Reset Form State */
              <>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-4 border border-gray-100 shadow-inner">
                    <svg className="w-7 h-7 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-dark-900 mb-2">Set new password</h3>
                  <p className="text-dark-500 text-sm">
                     Create a strong password for <br/><span className="font-semibold">{userEmail}</span>
                  </p>
                </div>

                {errors.api && (
                   <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-bold text-center">
                     {errors.api}
                   </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-dark-700 ml-1">Password</label>
                    <div className="relative">
                      <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleChange}
                        onCopy={handleCopyPaste}
                        onCut={handleCopyPaste}
                        placeholder="••••••••"
                        className={`w-full px-4 py-3 pr-12 rounded-xl border-2 outline-none font-medium transition-all
                                   ${errors.password ? 'border-red-300 bg-red-50' : 'bg-gray-50 border-gray-200 focus:bg-white focus:border-brand-500 shadow-sm'}`}
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-600 transition-colors"
                      >
                        <EyeIcon show={showPassword} />
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-red-500 font-bold ml-1 mt-1">{errors.password}</p>}
                    <div className="mt-2 text-xs">
                        <PasswordStrength password={formData.password} showRequirements={true} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-dark-700 ml-1">Confirm password</label>
                    <div className="relative">
                      <input
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        onPaste={handleCopyPaste}
                        placeholder="••••••••"
                        className={`w-full px-4 py-3 pr-12 rounded-xl border-2 outline-none font-medium transition-all
                                   ${errors.confirmPassword ? 'border-red-300 bg-red-50' : 'bg-gray-50 border-gray-200 focus:bg-white focus:border-brand-500 shadow-sm'}`}
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-600 transition-colors"
                      >
                        <EyeIcon show={showConfirmPassword} />
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-red-500 font-bold ml-1 mt-1">{errors.confirmPassword}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-brand-600 text-white font-bold 
                               py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:bg-brand-700
                               hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed
                               transition-all flex items-center justify-center gap-2 mt-4"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        Resetting...
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
            )}
          </div>
        </LightweightBorder>
      </div>
    </motion.div>
  )
}
