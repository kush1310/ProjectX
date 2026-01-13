/**
 * CharusatNeeds Logo with Matrix Digital Rain Effect
 * 
 * Features:
 * - Numbers falling from top (0-9 in green)
 * - Transforms into "CharusatNeeds" text
 * - Executes once on page load
 * - Static after animation completes
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface MatrixLogoProps {
  onComplete?: () => void
  className?: string
}

export default function MatrixLogo({ onComplete, className = '' }: MatrixLogoProps) {
  const [showMatrix, setShowMatrix] = useState(true)
  const [showLogo, setShowLogo] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !showMatrix) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const width = 800
    const height = 200
    canvas.width = width
    canvas.height = height

    // Matrix rain settings
    const fontSize = 14
    const columns = Math.floor(width / fontSize)
    const drops: number[] = []
    
    // Initialize drops
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100
    }

    const characters = '0123456789'
    let frameCount = 0
    const maxFrames = 120 // 2 seconds at 60fps

    const draw = () => {
      // Fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, width, height)

      ctx.fillStyle = '#00ff41' // Matrix green
      ctx.font = `${fontSize}px 'Courier New', monospace`

      for (let i = 0; i < drops.length; i++) {
        const text = characters[Math.floor(Math.random() * characters.length)]
        const x = i * fontSize
        const y = drops[i] * fontSize

        ctx.fillText(text, x, y)

        // Reset drop to top randomly
        if (y > height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }

      frameCount++

      if (frameCount < maxFrames) {
        requestAnimationFrame(draw)
      } else {
        // Animation complete
        setShowMatrix(false)
        setTimeout(() => {
          setShowLogo(true)
          onComplete?.()
        }, 300)
      }
    }

    draw()
  }, [showMatrix, onComplete])

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence mode="wait">
        {showMatrix && (
          <motion.div
            key="matrix"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            <canvas
              ref={canvasRef}
              className="w-full h-auto rounded-2xl"
              style={{ maxWidth: '800px', height: '200px' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{
                  opacity: [0.3, 0.7, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
                className="text-2xl font-mono text-green-400"
              >
                INITIALIZING...
              </motion.div>
            </div>
          </motion.div>
        )}

        {showLogo && (
          <motion.div
            key="logo"
            initial={{ opacity: 0, scale: 0.8, rotateX: -90 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            transition={{ 
              duration: 0.8, 
              type: 'spring',
              stiffness: 200 
            }}
            className="preserve-3d"
          >
            <h1 className="text-6xl md:text-7xl font-bold text-center">
              <span className="text-dark-900">Charusat</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600">
                Needs
              </span>
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center text-dark-500 uppercase tracking-[0.3em] text-sm mt-3"
            >
              Campus Food Aggregator
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Compact version for preloader
export function MatrixLogoCompact({ onComplete }: { onComplete?: () => void }) {
  const [showMatrix, setShowMatrix] = useState(true)
  const [showText, setShowText] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !showMatrix) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = 300
    const height = 80
    canvas.width = width
    canvas.height = height

    const fontSize = 10
    const columns = Math.floor(width / fontSize)
    const drops: number[] = []
    
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -50
    }

    const characters = '01234567890'
    let frameCount = 0
    const maxFrames = 90

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, width, height)

      ctx.fillStyle = '#00ff41'
      ctx.font = `${fontSize}px 'Courier New', monospace`

      for (let i = 0; i < drops.length; i++) {
        const text = characters[Math.floor(Math.random() * characters.length)]
        ctx.fillText(text, i * fontSize, drops[i] * fontSize)

        if (drops[i] * fontSize > height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }

      frameCount++

      if (frameCount < maxFrames) {
        requestAnimationFrame(draw)
      } else {
        setShowMatrix(false)
        setTimeout(() => {
          setShowText(true)
          onComplete?.()
        }, 200)
      }
    }

    draw()
  }, [showMatrix, onComplete])

  return (
    <div className="relative w-full">
      <AnimatePresence mode="wait">
        {showMatrix && (
          <motion.canvas
            key="matrix"
            ref={canvasRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full mx-auto"
            style={{ height: '80px' }}
          />
        )}

        {showText && (
          <motion.div
            key="text"
            initial={{ opacity: 0, scale: 0.5, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold">
              <span className="text-dark-900">Charusat</span>
              <span className="text-brand-500">Needs</span>
            </h1>
            <p className="text-xs text-dark-400 uppercase tracking-widest mt-1">
              Campus Food Aggregator
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
