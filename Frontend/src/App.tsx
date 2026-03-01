/**
 * CharusatNeeds App Router with Protected Routes
 */

import { Routes, Route, Navigate } from 'react-router-dom'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AuthCallback from './pages/AuthCallback'
import StudentDashboard from './Canteen/pages/StudentDashboard'
import CustomerProfile from './Canteen/pages/CustomerProfile'
import Dashboard from './Canteen/pages/Dashboard'
import MenuManagement from './Canteen/pages/MenuManagement'
import CustomerMenuPage from './Canteen/pages/CustomerMenu'
import OrderHistory from './Canteen/pages/OrderHistory'
import CouponApp from './Canteen/coupon-app/src/App'
import VendorProfile from './Canteen/pages/VendorProfile'
import AnalyticsDashboard from './Canteen/pages/AdminDashboard'
import CartPage from './Canteen/pages/CartPage'
import CheckoutPage from './Canteen/pages/CheckoutPage'
import ProtectedRoute from './components/ProtectedRoute'
import VendorLayout from './Canteen/components/VendorLayout'
import { ToastProvider, ToastInitializer } from './utils/toast'
import { isAuthenticated, getSession } from './utils/authStore'

// Smart Root Redirect based on Role
const RootRedirect = () => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  const session = getSession();
  const role = session?.role || session?.user?.role;
  
  if (role === 'ADMIN') return <Navigate to="/analytics" replace />;
  if (role === 'CANTEEN_OWNER') return <Navigate to="/dashboard" replace />;
  return <Navigate to="/customer/dashboard" replace />;
};

function App() {
  return (
    <ToastProvider>
      <ToastInitializer />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* Customer Routes */}
        <Route path="/customer/dashboard" element={
          <ProtectedRoute allowedRoles={['USER']}><StudentDashboard /></ProtectedRoute>
        } />
        <Route path="/customer/profile" element={
          <ProtectedRoute allowedRoles={['USER']}><CustomerProfile /></ProtectedRoute>
        } />
        <Route path="/canteen/:id/menu" element={
          <ProtectedRoute allowedRoles={['USER', 'ADMIN', 'CANTEEN_OWNER']}><CustomerMenuPage /></ProtectedRoute>
        } />

        {/* Legacy Redirect */}
        <Route path="/customer/menu" element={<Navigate to="/customer/dashboard" replace />} />
        
        <Route path="/cart" element={
          <ProtectedRoute allowedRoles={['USER']}><CartPage /></ProtectedRoute>
        } />
        <Route path="/checkout" element={
          <ProtectedRoute allowedRoles={['USER']}><CheckoutPage /></ProtectedRoute>
        } />
        
        {/* Vendor Routes (Strictly for Vendor/Admin) */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['CANTEEN_OWNER', 'ADMIN']}><VendorLayout><Dashboard /></VendorLayout></ProtectedRoute>
        } />
        <Route path="/canteen/menu" element={
          <ProtectedRoute allowedRoles={['CANTEEN_OWNER', 'ADMIN']}><VendorLayout><MenuManagement /></VendorLayout></ProtectedRoute>
        } />
        
        {/* Helper route for previewing customer menu as admin/vendor if needed, or strictly separate */}
        <Route path="/canteen/:id/menu" element={
          <ProtectedRoute allowedRoles={['USER', 'ADMIN', 'CANTEEN_OWNER']}><CustomerMenuPage /></ProtectedRoute>
        } />
        
        <Route path="/order-history" element={
          <ProtectedRoute allowedRoles={['CANTEEN_OWNER', 'ADMIN']}><VendorLayout><OrderHistory /></VendorLayout></ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'CANTEEN_OWNER']}><VendorLayout><AnalyticsDashboard /></VendorLayout></ProtectedRoute>
        } />
        <Route path="/vendor/coupons" element={
          <ProtectedRoute allowedRoles={['CANTEEN_OWNER', 'ADMIN']}><VendorLayout><CouponApp /></VendorLayout></ProtectedRoute>
        } />
        <Route path="/vendor/profile" element={
          <ProtectedRoute allowedRoles={['CANTEEN_OWNER', 'ADMIN']}><VendorLayout><VendorProfile /></VendorLayout></ProtectedRoute>
        } />
        <Route path="/vendor/payout" element={
          <ProtectedRoute allowedRoles={['CANTEEN_OWNER', 'ADMIN']}><VendorLayout><div className="p-6"><h1 className="text-2xl font-bold">Payout</h1><p className="text-slate-500 mt-2">Coming soon...</p></div></VendorLayout></ProtectedRoute>
        } />
        <Route path="/help" element={
          <ProtectedRoute allowedRoles={['CANTEEN_OWNER', 'ADMIN']}><VendorLayout><div className="p-6"><h1 className="text-2xl font-bold">Help Centre</h1><p className="text-slate-500 mt-2">Contact support@charusat.edu.in</p></div></VendorLayout></ProtectedRoute>
        } />
      </Routes>
    </ToastProvider>
  )
}

export default App

