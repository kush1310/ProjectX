/**
 * Reset Password Page - Secure Token-Based
 * 
 * Flow:
 * 1. Page loads with ?token=XXX from email link
 * 2. Validates token on load
 * 3. If invalid -> redirects to login
 * 4. If valid -> shows password reset form
 * 5. On submit -> calls API with token + new password
 */

import { useState, useEffect, FormEvent, ClipboardEvent } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import CharusatNeedsLogo from '@/components/Logo'
import ElectroBorder from '@/components/ElectroBorder'
import PasswordStrength from '@/components/PasswordStrength'
import { toast } from 'react-hot-toast'
import { validatePasswordStrict } from '@/utils/validation'
import ConfirmationModal from '@/components/ConfirmationModal'
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
  
  // Token validation state
  const [isValidating, setIsValidating] = useState(true)
  const [isTokenValid, setIsTokenValid] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  
  // Form state
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string; api?: string }>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // Validate token on page load
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
          setIsTokenValid(true)
          setUserEmail(data.email || '')
        } else {
          toast.error(data.message || 'Invalid or expired reset link')
          navigate('/login', { replace: true })
        }
      } catch (err) {
        toast.error('Failed to validate reset link')
        navigate('/login', { replace: true })
      }
      
      setIsValidating(false)
    }
    
    validateToken()
  }, [token, navigate])

  // Prevent copy/paste
  const handleCopyPaste = (e: ClipboardEvent) => {
    e.preventDefault()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (name === 'password') {
      const strictError = validatePasswordStrict(value);
      setErrors(prev => ({ ...prev, password: strictError, api: undefined }));
    }
    if (name === 'confirmPassword') {
       if (value === formData.password) {
           setErrors(prev => ({ ...prev, confirmPassword: undefined }))
       }
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    // Validation
    const newErrors: typeof errors = {}
    
    const passwordError = validatePasswordStrict(formData.password);
    if (passwordError) {
        newErrors.password = passwordError;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

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
        setTimeout(() => navigate('/login'), 2000)
      } else {
        setErrors({ api: data.message || 'Failed to reset password' })
      }
    } catch (err) {
      setErrors({ api: 'Network error. Please try again.' })
    }

    setIsSubmitting(false)
  }

  // Loading state while validating token
  if (isValidating) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center bg-gray-50 p-4"
      >
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <CharusatNeedsLogo size="lg" animated />
          </div>
          <div className="bg-white rounded-3xl p-10 shadow-xl text-center">
            <Skeleton circle width={80} height={80} className="mx-auto mb-6" />
            <Skeleton height={32} width={200} className="mx-auto mb-4" />
            <Skeleton height={16} count={2} className="mx-auto" />
          </div>
        </div>
      </motion.div>
    )
  }

  // Success state
  if (isSuccess) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center bg-gray-50 p-4"
      >
        <ElectroBorder color="green" intensity="high" radius="2rem">
          <div className="bg-white rounded-[2rem] p-10 shadow-2xl text-center max-w-sm w-full">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
              className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">All Set!</h2>
            <p className="text-gray-500 mb-8">Your password has been reset securely.</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg"
            >
              Continue to Login
            </button>
          </div>
        </ElectroBorder>
      </motion.div>
    )
  }

  const handleCancelClick = () => {
    setShowConfirmModal(true)
  }

  const handleConfirmCancel = () => {
    navigate('/login')
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative overflow-hidden"
    >
      <ConfirmationModal
        isOpen={showConfirmModal}
        title="Cancel Reset?"
        message="Are you sure you want to cancel the password reset process? Any information entered will be lost."
        confirmText="Yes, Cancel"
        cancelText="No, Stay"
        type="warning"
        onConfirm={handleConfirmCancel}
        onClose={() => setShowConfirmModal(false)}
      />

      {/* Cancel Button - Top Left */}
      <div className="absolute top-6 left-6 z-20">
        <button 
            onClick={handleCancelClick}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold transition-colors text-sm group bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm border border-gray-100 hover:border-gray-200"
        >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Cancel & Return to Login
        </button>
      </div>

      {/* Background Ambience */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] max-w-[500px] h-[50vh] rounded-full bg-orange-100/40 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] max-w-[500px] h-[50vh] rounded-full bg-red-100/40 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-center mb-8">
          <CharusatNeedsLogo size="lg" animated />
        </div>

        <ElectroBorder color="orange" intensity="medium" radius="1.5rem">
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Reset Password</h3>
              <p className="text-gray-500 mt-1 text-sm">
                {userEmail ? `For ${userEmail}` : 'Create a strong new password'}
              </p>
            </div>

            {errors.api && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
                {errors.api}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 ml-1 uppercase tracking-wider">New Password</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    onCopy={handleCopyPaste}
                    onCut={handleCopyPaste}
                    placeholder="8+ characters"
                    className={`w-full px-5 py-3.5 pr-12 rounded-xl bg-gray-50 border-2 outline-none font-medium transition-all
                               ${errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-orange-400'}`}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-600 transition-colors"
                  >
                    <EyeIcon show={showPassword} />
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 font-bold ml-1">{errors.password}</p>}
                <div className="mt-2">
                  <PasswordStrength password={formData.password} showRequirements={formData.password.length > 0} />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 ml-1 uppercase tracking-wider">Confirm Password</label>
                <div className="relative">
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onPaste={handleCopyPaste}
                    placeholder="Re-enter password"
                    className={`w-full px-5 py-3.5 pr-12 rounded-xl bg-gray-50 border-2 outline-none font-medium transition-all
                               ${errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-orange-400'}`}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-600 transition-colors"
                  >
                    <EyeIcon show={showConfirmPassword} />
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-500 font-bold ml-1">{errors.confirmPassword}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold 
                           py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-red-700
                           hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed
                           transition-all mt-4 uppercase tracking-wider text-sm"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Updating Password...
                  </span>
                ) : 'Reset Password'}
              </button>
            </form>
          </div>
        </ElectroBorder>
      </div>
    </motion.div>
  )
}
