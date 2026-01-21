/**
 * CharusatNeeds App Router with Protected Routes
 */

import { Routes, Route, Navigate } from 'react-router-dom'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AuthCallback from './pages/AuthCallback'
import Dashboard from './Canteen/pages/Dashboard'
import CanteenMenuPage from './Canteen/pages/Menu'
import CustomerMenuPage from './Canteen/pages/CustomerMenu'
import OrderHistory from './Canteen/pages/OrderHistory'
import CouponApp from './vendor_side/coupon-app/src/App'
import ProtectedRoute from './components/ProtectedRoute'
import { ToastProvider, ToastInitializer } from './utils/toast'

function App() {
  return (
    <ToastProvider>
      <ToastInitializer />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* Protected Routes - Require Authentication */}
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/canteen/menu" element={
          <ProtectedRoute><CanteenMenuPage /></ProtectedRoute>
        } />
        <Route path="/canteen/:id/menu" element={
          <ProtectedRoute><CustomerMenuPage /></ProtectedRoute>
        } />
        <Route path="/order-history" element={
          <ProtectedRoute><OrderHistory /></ProtectedRoute>
        } />
        <Route path="/vendor/coupons" element={
          <ProtectedRoute><CouponApp /></ProtectedRoute>
        } />
      </Routes>
    </ToastProvider>
  )
}

export default App
