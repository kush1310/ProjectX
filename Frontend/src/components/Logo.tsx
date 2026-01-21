import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useState } from 'react'

interface LogoProps {
  className?: string
  showTagline?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  animated?: boolean
}

// CharusatNeeds Text-Only Logo (No Icon)
export default function CharusatNeedsLogo({ 
  className = '', 
  showTagline = false,
  size = 'md',
  animated = false
}: LogoProps) {
  
  const sizes = {
    sm: { text: 'text-lg md:text-xl' },
    md: { text: 'text-xl md:text-2xl' },
    lg: { text: 'text-2xl md:text-4xl' },
    xl: { text: 'text-3xl sm:text-4xl lg:text-6xl' }
  }

  const currentSize = sizes[size]
  const [rotation, setRotation] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!animated) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setRotation({ x: (y - 0.5) * 10, y: (x - 0.5) * 10 })
  }

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 })
  }

  const Content = (
    <motion.div 
      className={`flex items-center gap-2 select-none ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: 1000, transformStyle: 'preserve-3d' }}
    >
      <motion.div
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", duration: 0.8, bounce: 0.3 }}
        style={{
          rotateX: animated ? -rotation.x : 0,
          rotateY: animated ? rotation.y : 0,
        }}
        className="transition-transform duration-200 ease-out"
      >
        <div className="flex flex-col">
          {/* Logo Text Only - No C Icon */}
          <div className="flex items-baseline leading-none">
            <span className={`font-logo font-bold tracking-tight ${currentSize.text} text-dark-900`}>
              Charusat
            </span>
            <span className={`font-logo font-bold tracking-tight ${currentSize.text} text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600`}>
              Needs
            </span>
          </div>
          
          {showTagline && (
            <motion.span 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-xs text-dark-400 uppercase tracking-[0.3em] font-bold mt-2 ml-1"
            >
              Campus Food Aggregator
            </motion.span>
          )}
        </div>
      </motion.div>
    </motion.div>
  )

  return (
    <Link to="/" className="inline-block focus:outline-none">
      {Content}
    </Link>
  )
}
