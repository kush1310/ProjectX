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

import api from './utils/api'
import { createSession } from './utils/authStore'

if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
  (window as any).__api = api;
  (window as any).__createSession = createSession;
}

function Root() {
  const isFirstVisit = typeof window !== 'undefined' ? !sessionStorage.getItem('charusatneeds_preloaded') : false;
  const [showPreloader, setShowPreloader] = useState(isFirstVisit)
  const [showApp, setShowApp] = useState(!isFirstVisit)

  return (
    <>
      {showPreloader && (
        <Preloader 
          minDuration={800} 
          onComplete={() => {
            sessionStorage.setItem('charusatneeds_preloaded', 'true');
            setShowPreloader(false);
            setShowApp(true);
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
