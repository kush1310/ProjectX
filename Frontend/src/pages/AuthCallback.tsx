import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { handleGoogleCallback } from '@/utils/googleAuth'
import { createSession, isValidDomain } from '@/utils/authStore'
import { toast } from '@/utils/toast'

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const hasProcessed = useRef(false) // Prevent duplicate processing

  useEffect(() => {
    // Prevent duplicate processing in StrictMode
    if (hasProcessed.current) return
    hasProcessed.current = true

    const code = searchParams.get('code')
    const errorParam = searchParams.get('error')

    // Handle OAuth errors
    if (errorParam) {
      setError('Authentication was cancelled or failed.')
      setStatus('error')
      toast.error('Authentication was cancelled.')
      setTimeout(() => navigate('/login'), 3000)
      return
    }

    // Handle successful OAuth code
    if (code) {
      setStatus('loading')
      
      handleGoogleCallback(code)
        .then((data) => {
          // CRITICAL: Validate email domain
          if (!isValidDomain(data.user.email)) {
            setError('Only @charusat.edu.in email addresses are allowed.')
            setStatus('error')
            toast.error('Only @charusat.edu.in email addresses are allowed. Please use your university email.')
            setTimeout(() => navigate('/login'), 3000)
            return
          }

          // Create session with full user object (id, role, mfaEnabled, etc.)
          const userData = data.user as any
          const fullData = data as any
          createSession({
            id: userData.id,
            email: userData.email,
            fullName: userData.fullName,
            mobile: userData.mobile || '',
            role: userData.role,
            mfaEnabled: userData.mfaEnabled,
          }, data.token, true)

          // Persist refreshToken if provided
          if (fullData.refreshToken) {
            localStorage.setItem('charusatneeds_refresh_token', fullData.refreshToken)
          }

          setStatus('success')
          toast.success('Welcome to CharusatNeeds!') // Single notification
          
          // Redirect based on role (use session.role pattern)
          const role = data.user.role
          setTimeout(() => {
            if (role === 'ADMIN') {
              navigate('/analytics', { replace: true })
            } else if (role === 'CANTEEN_OWNER') {
              navigate('/dashboard', { replace: true })
            } else {
              navigate('/customer/dashboard', { replace: true })
            }
          }, 1500)
        })
        .catch((err) => {
          console.error('Auth callback error:', err)
          const errorMsg = err.message || 'Authentication failed. Please try again.'
          setError(errorMsg)
          setStatus('error')
          toast.error(errorMsg)
          // Navigate immediately to Avoid hanging on Error UI if user prefers
          // Pass error in state to display on Login form
          setTimeout(() => navigate('/login', { state: { error: errorMsg } }), 2000)
        })
    } else {
      setError('No authorization code received.')
      setStatus('error')
      toast.error('No authorization code received.')
      setTimeout(() => navigate('/login'), 3000)
    }
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream-50 via-white to-cream-100 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl p-10 max-w-md w-full text-center shadow-3d-lg border border-white/50"
      >
        {status === 'loading' && (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 mx-auto mb-6"
            >
              <svg className="w-full h-full" viewBox="0 0 24 24">
                <circle 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="#ef4444" 
                  strokeWidth="4" 
                  fill="none"
                  strokeDasharray="60"
                  strokeDashoffset="20"
                  strokeLinecap="round"
                />
              </svg>
            </motion.div>
            <h2 className="text-2xl font-bold text-dark-900 mb-2">Authenticating...</h2>
            <p className="text-dark-600">Please wait while we verify your account</p>
            
            <motion.div
              className="mt-6 flex justify-center gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-brand-500 rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </motion.div>
          </>
        )}

        {status === 'success' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-dark-900 mb-2">Success!</h2>
            <p className="text-dark-600">Redirecting to your dashboard...</p>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-dark-900 mb-2">Authentication Failed</h2>
            <p className="text-dark-600 mb-4">{error}</p>
            <p className="text-sm text-dark-400">Redirecting to login page...</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
