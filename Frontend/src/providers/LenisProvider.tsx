/**
 * Lenis Smooth Scroll Provider
 * 
 * Features:
 * - Buttery smooth scrolling
 * - Touch device support
 * - Optimized performance
 * - Premium feel with custom easing
 */

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import Lenis from 'lenis'

interface LenisContextType {
  lenis: Lenis | null
}

const LenisContext = createContext<LenisContextType>({ lenis: null })

export const useLenis = () => useContext(LenisContext)

interface LenisProviderProps {
  children: ReactNode
}

export default function LenisProvider({ children }: LenisProviderProps) {
  const lenisRef = useRef<Lenis | null>(null)
  const [, setReady] = useState(false)

  useEffect(() => {
    // Initialize Lenis with premium settings
    const lenis = new Lenis({
      duration: 1.8, // Increased for buttery smoothness
      easing: (t: number) => {
        // Custom cubic-bezier easing for ultra-smooth feel
        return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
      },
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.2, // Slightly increased for responsiveness
      touchMultiplier: 2.5, // Better touch support
      infinite: false,
      autoResize: true,
    })

    lenisRef.current = lenis
    setReady(true)

    // Animation loop
    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    // Handle resize
    const handleResize = () => {
      lenis.resize()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      lenis.destroy()
    }
  }, [])

  return (
    <LenisContext.Provider value={{ lenis: lenisRef.current }}>
      {children}
    </LenisContext.Provider>
  )
}
