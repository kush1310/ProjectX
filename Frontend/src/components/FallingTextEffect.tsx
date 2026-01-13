/**
 * Falling "CharusatNeeds" Text Effect
 * 
 * Features:
 * - Matrix-style falling rain
 * - Uses ONLY characters from "CharusatNeeds"
 * - Red/White gradient coloring
 * - High-performance canvas rendering
 */

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

export default function FallingTextEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to full parent container
    const resize = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.clientWidth
        canvas.height = parent.clientHeight
      }
    }
    window.addEventListener('resize', resize)
    resize()

    // Config
    const fontSize = 16
    const letterSet = "CharusatNeeds" // Only these characters
    const columns = Math.ceil(canvas.width / fontSize)
    const drops: number[] = []

    // Initialize drops with random starting positions (some above screen)
    for (let i = 0; i < columns; i++) {
        drops[i] = Math.random() * -100
    }

    let frameId: number

    const draw = () => {
      // Semi-transparent black for trail effect
      // Using a very dark red/black tint for thematic consistency
      ctx.fillStyle = 'rgba(10, 5, 5, 0.1)' 
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.font = `bold ${fontSize}px 'JetBrains Mono', monospace`
      
      for (let i = 0; i < drops.length; i++) {
        // Pick random char from "CharusatNeeds"
        const text = letterSet[Math.floor(Math.random() * letterSet.length)]
        
        // Dynamic Red/White Gradient Logic
        // Calculate a "glitch" or "highlight" chance
        const isHighlight = Math.random() > 0.95
        
        if (isHighlight) {
            ctx.fillStyle = '#ffffff' // Pure White Highlight
            ctx.shadowBlur = 10
            ctx.shadowColor = '#ffffff'
        } else {
            // Gradient of Reds
            // Deeper red at the top of the trail, brighter at bottom? 
            // Actually Matrix is usually brightest at the head.
            // Let's just vary the redness.
            const redness = Math.floor(Math.random() * 55) + 200 // 200-255
            ctx.fillStyle = `rgb(${redness}, 20, 50)`
            ctx.shadowBlur = 0
        }

        const x = i * fontSize
        const y = drops[i] * fontSize

        ctx.fillText(text, x, y)

        // Reset drop
        if (y > canvas.height && Math.random() > 0.98) {
          drops[i] = 0
        }
        
        drops[i]++
      }
      
      frameId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(frameId)
    }
  }, [])

  return (
    <motion.canvas
      ref={canvasRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="absolute inset-0 w-full h-full object-cover"
      style={{ filter: 'contrast(1.2)' }}
    />
  )
}
