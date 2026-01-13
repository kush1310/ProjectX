import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useState } from 'react'

interface LogoProps {
  className?: string
  showTagline?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  animated?: boolean
  falling?: boolean
}

// Custom CharusatNeeds Icon
export const CharusatNeedsIcon = ({ size = 40, className = '' }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 40 40" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ filter: 'drop-shadow(0px 4px 6px rgba(239, 68, 68, 0.2))' }}
  >
    <path 
      d="M20 4C11.1634 4 4 11.1634 4 20C4 28.8366 11.1634 36 20 36C28.8366 36 36 28.8366 36 20C36 11.1634 28.8366 4 20 4ZM20 0C31.0457 0 40 8.9543 40 20C40 31.0457 31.0457 40 20 40C8.9543 40 0 31.0457 0 20C0 8.9543 8.9543 0 20 0Z" 
      fill="url(#brandGradient)" 
    />
    <path 
      d="M12 20C12 15.5817 15.5817 12 20 12C21.849 12 23.551 12.6256 24.909 13.682L27.252 11.339C25.295 9.871 22.793 9 20 9C13.925 9 9 13.925 9 20C9 26.075 13.925 31 20 31C22.793 31 25.295 30.129 27.252 28.661L24.909 26.318C23.551 27.3744 21.849 28 20 28C15.5817 28 12 24.4183 12 20Z" 
      fill="url(#brandGradient)" 
    />
    <defs>
      <linearGradient id="brandGradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ef4444" />
        <stop offset="1" stopColor="#dc2626" />
      </linearGradient>
    </defs>
  </svg>
)

export default function CharusatNeedsLogo({ 
  className = '', 
  showTagline = false,
  size = 'md',
  animated = false,
  falling = false
}: LogoProps) {
  
  const sizes = {
    sm: { text: 'text-lg md:text-xl', icon: 32 },
    md: { text: 'text-xl md:text-2xl', icon: 40 },
    lg: { text: 'text-2xl md:text-4xl', icon: 56 },
    xl: { text: 'text-3xl sm:text-4xl lg:text-6xl', icon: 64 }
  }

  const currentSize = sizes[size]
  const [rotation, setRotation] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!animated) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setRotation({ x: (y - 0.5) * 20, y: (x - 0.5) * 20 })
  }

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 })
  }

  // Falling Letter Animation Vars
  const letterContainer = {
    visible: {
      transition: {
        staggerChildren: 0.05, // Faster stagger for "buttery" feel
        delayChildren: 0.1
      }
    }
  }

  const fallingLetter = {
    hidden: { y: -80, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 120
      }
    }
  }

  const renderLogoText = () => {
    // If it's the falling specific instance, we use the motion variants.
    if (falling) {
      const text1 = "Charusat"
      const text2 = "Needs"
      
      return (
        <motion.div 
          className="flex flex-col items-center lg:items-start"
          variants={letterContainer}
          initial="hidden"
          animate="visible"
        >
          <div className="flex items-baseline leading-none">
            {/* Charusat - Dark Grey */}
            <div className="flex overflow-hidden relative z-20">
                {text1.split("").map((char, index) => (
                    <motion.span
                        key={`c1-${index}`}
                        variants={fallingLetter}
                        className={`font-logo font-bold tracking-tight ${currentSize.text} text-dark-900 inline-block`}
                        style={{ textShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    >
                        {char}
                    </motion.span>
                ))}
            </div>
            
            {/* Needs - Orange Gradient */}
            <div className="flex overflow-hidden relative z-20">
                {text2.split("").map((char, index) => (
                    <motion.span
                        key={`c2-${index}`}
                        variants={fallingLetter}
                        className={`font-logo font-bold tracking-tight ${currentSize.text} text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 inline-block`}
                        style={{ filter: 'drop-shadow(0 4px 4px rgba(239, 68, 68, 0.15))' }}
                    >
                        {char}
                    </motion.span>
                ))}
            </div>
          </div>
        </motion.div>
      )
    }

    // Static / Standard Layout
    return (
      <div className="flex items-baseline leading-none">
        <span className={`font-logo font-bold tracking-tight ${currentSize.text} text-dark-900`}>
          Charusat
        </span>
        <span className={`font-logo font-bold tracking-tight ${currentSize.text} text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600`}>
          Needs
        </span>
      </div>
    )
  }

  const Content = (
    <motion.div 
      className={`flex items-center gap-4 select-none ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: 1000, transformStyle: 'preserve-3d' }}
    >
        {/* Icon only animates on rotation if HOVER is active, unrelated to falling */}
        <motion.div
            initial={falling ? { scale: 0, rotate: -180, opacity: 0 } : {}}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", duration: 1.2, bounce: 0.4 }}
            style={{
                rotateX: animated ? -rotation.x : 0,
                rotateY: animated ? rotation.y : 0,
            }}
            className="transition-transform duration-200 ease-out"
        >
            <CharusatNeedsIcon size={currentSize.icon} />
        </motion.div>

        <div className="flex flex-col">
            {renderLogoText()}
            
            {showTagline && (
            <motion.span 
                initial={falling ? { opacity: 0, y: 10 } : {}}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="text-xs text-dark-400 uppercase tracking-[0.3em] font-bold mt-2 ml-1"
            >
                Campus Food Aggregator
            </motion.span>
            )}
        </div>
    </motion.div>
  )

  if (falling) return Content // No link if it's the hero animation

  return (
    <Link to="/" className="inline-block focus:outline-none">
      {Content}
    </Link>
  )
}
