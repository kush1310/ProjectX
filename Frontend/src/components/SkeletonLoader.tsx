import { useState, useEffect, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

interface SkeletonLoaderProps {
  /** Duration in ms to show static skeleton before animating (default: 1000ms) */
  staticDuration?: number
  /** Whether the content is ready to show */
  isLoaded?: boolean
  /** The actual content to show after loading */
  children: ReactNode
  /** Skeleton layout variant */
  variant?: 'card' | 'text' | 'avatar' | 'button' | 'form' | 'custom'
  /** Custom skeleton content when variant is 'custom' */
  skeleton?: ReactNode
  /** Additional class names for the skeleton container */
  className?: string
  /** Number of skeleton items to show (for text variant) */
  count?: number
}

// Individual skeleton shapes
export function SkeletonLine({ 
  width = '100%', 
  height = '1rem',
  animated = false,
  className = ''
}: { 
  width?: string | number
  height?: string | number
  animated?: boolean
  className?: string
}) {
  return (
    <div 
      className={clsx(
        'rounded-md bg-gray-200',
        animated && 'skeleton',
        !animated && 'skeleton-static',
        className
      )}
      style={{ width, height }}
    />
  )
}

export function SkeletonCircle({ 
  size = 48,
  animated = false,
  className = ''
}: { 
  size?: number
  animated?: boolean
  className?: string
}) {
  return (
    <div 
      className={clsx(
        'rounded-full bg-gray-200',
        animated && 'skeleton',
        !animated && 'skeleton-static',
        className
      )}
      style={{ width: size, height: size }}
    />
  )
}

export function SkeletonRect({ 
  width = '100%',
  height = 100,
  rounded = 'lg',
  animated = false,
  className = ''
}: { 
  width?: string | number
  height?: string | number
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  animated?: boolean
  className?: string
}) {
  const roundedClass = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full'
  }[rounded]

  return (
    <div 
      className={clsx(
        'bg-gray-200',
        roundedClass,
        animated && 'skeleton',
        !animated && 'skeleton-static',
        className
      )}
      style={{ width, height }}
    />
  )
}

// Preset skeleton layouts
function CardSkeleton({ animated }: { animated: boolean }) {
  return (
    <div className="card space-y-4">
      <SkeletonRect height={160} rounded="xl" animated={animated} />
      <SkeletonLine width="75%" height="1.5rem" animated={animated} />
      <SkeletonLine width="100%" animated={animated} />
      <SkeletonLine width="60%" animated={animated} />
      <div className="flex gap-3 pt-2">
        <SkeletonRect width={100} height={40} rounded="xl" animated={animated} />
        <SkeletonRect width={100} height={40} rounded="xl" animated={animated} />
      </div>
    </div>
  )
}

function TextSkeleton({ count = 3, animated }: { count: number; animated: boolean }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonLine 
          key={i}
          width={i === count - 1 ? '60%' : '100%'} 
          animated={animated}
        />
      ))}
    </div>
  )
}

function AvatarSkeleton({ animated }: { animated: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <SkeletonCircle size={48} animated={animated} />
      <div className="space-y-2 flex-1">
        <SkeletonLine width="40%" height="1rem" animated={animated} />
        <SkeletonLine width="60%" height="0.875rem" animated={animated} />
      </div>
    </div>
  )
}

function ButtonSkeleton({ animated }: { animated: boolean }) {
  return <SkeletonRect width="100%" height={48} rounded="xl" animated={animated} />
}

function FormSkeleton({ animated }: { animated: boolean }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <SkeletonLine width="60%" height="2rem" animated={animated} className="mx-auto" />
        <SkeletonLine width="80%" height="1rem" animated={animated} className="mx-auto" />
      </div>
      
      {/* Form fields */}
      <div className="space-y-4">
        <SkeletonRect height={52} rounded="xl" animated={animated} />
        <SkeletonRect height={52} rounded="xl" animated={animated} />
      </div>
      
      {/* Checkbox & link */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <SkeletonRect width={20} height={20} rounded="md" animated={animated} />
          <SkeletonLine width={100} height="0.875rem" animated={animated} />
        </div>
        <SkeletonLine width={120} height="0.875rem" animated={animated} />
      </div>
      
      {/* Button */}
      <SkeletonRect height={52} rounded="xl" animated={animated} />
      
      {/* Divider */}
      <div className="flex items-center gap-4">
        <SkeletonLine height={1} animated={animated} className="flex-1" />
        <SkeletonLine width={40} height="0.875rem" animated={animated} />
        <SkeletonLine height={1} animated={animated} className="flex-1" />
      </div>
      
      {/* Social button */}
      <SkeletonRect height={52} rounded="xl" animated={animated} />
      
      {/* Footer link */}
      <SkeletonLine width="70%" height="0.875rem" animated={animated} className="mx-auto" />
    </div>
  )
}

export function SkeletonLoader({
  staticDuration = 1000,
  isLoaded = false,
  children,
  variant = 'custom',
  skeleton,
  className = '',
  count = 3
}: SkeletonLoaderProps) {
  const [isAnimated, setIsAnimated] = useState(false)
  const [showContent, setShowContent] = useState(false)

  // Start animation after static duration
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimated(true)
    }, staticDuration)

    return () => clearTimeout(timer)
  }, [staticDuration])

  // Show content when loaded
  useEffect(() => {
    if (isLoaded) {
      // Small delay for smooth transition
      const timer = setTimeout(() => {
        setShowContent(true)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isLoaded])

  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return <CardSkeleton animated={isAnimated} />
      case 'text':
        return <TextSkeleton count={count} animated={isAnimated} />
      case 'avatar':
        return <AvatarSkeleton animated={isAnimated} />
      case 'button':
        return <ButtonSkeleton animated={isAnimated} />
      case 'form':
        return <FormSkeleton animated={isAnimated} />
      case 'custom':
      default:
        return skeleton || <TextSkeleton count={count} animated={isAnimated} />
    }
  }

  return (
    <div className={clsx('relative', className)}>
      <AnimatePresence mode="wait">
        {!showContent ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderSkeleton()}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SkeletonLoader
