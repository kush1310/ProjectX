/**
 * CharusatNeeds - Main Entry Point
 * 
 * Features:
 * - MagicLoader Preloader on app start
 * - Lenis smooth scrolling
 */

import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import LenisProvider from './providers/LenisProvider'
import Preloader from './components/Preloader'

function Root() {
  const [showPreloader, setShowPreloader] = useState(true)
  const [showApp, setShowApp] = useState(false)

  return (
    <>
      {showPreloader && (
        <Preloader 
          minDuration={2500} 
          onComplete={() => {
            setShowPreloader(false)
            setShowApp(true)
          }} 
        />
      )}
      {showApp && (
        <LenisProvider>
          <App />
        </LenisProvider>
      )}
    </>
  )
}

import { ErrorBoundary } from './ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Root />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
