/**
 * CharusatNeeds App Router with ToastProvider
 */

import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AuthCallback from './pages/AuthCallback'
import Dashboard from './Canteen/pages/Dashboard'
import CanteenMenuPage from './Canteen/pages/Menu'
import OrderHistory from './Canteen/pages/OrderHistory'
import { ToastProvider, ToastInitializer } from './utils/toast'

function App() {
  return (
    <ToastProvider>
      <ToastInitializer />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/canteen/menu" element={<CanteenMenuPage />} />
        <Route path="/order-history" element={<OrderHistory />} />
      </Routes>
    </ToastProvider>
  )
}

export default App
