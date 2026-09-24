/**
 * CharusatNeeds App Router with Protected Routes
 *
 * Uses React.lazy() for route-level code splitting.
 * Each page is loaded on-demand, not all at once.
 */

import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastProvider, ToastInitializer } from "./utils/toast";
import { isAuthenticated, getSession } from "./utils/authStore";
import Preloader from "./components/Preloader";

// Statically imported LandingPage (part of initial bundle)
import LandingPage from "./pages/LandingPage";

// ─── Lazy-loaded Pages ───────────────────────────────────────────
// Public
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));

// Customer
const StudentDashboard = lazy(() => import("./Canteen/pages/StudentDashboard"));
const CustomerProfile = lazy(() => import("./Canteen/pages/CustomerProfile"));
const CustomerMenuPage = lazy(() => import("./Canteen/pages/CustomerMenu"));
const CustomerOrderHistory = lazy(
  () => import("./Canteen/pages/CustomerOrderHistory"),
);
const CartPage = lazy(() => import("./Canteen/pages/CartPage"));
const CustomerOffers = lazy(() => import("./Canteen/pages/CustomerOffers"));

// Vendor
const Dashboard = lazy(() => import("./Canteen/pages/Dashboard"));
const MenuManagement = lazy(() => import("./Canteen/pages/MenuManagement"));
const OrderHistory = lazy(() => import("./Canteen/pages/OrderHistory"));
const VendorProfile = lazy(() => import("./Canteen/pages/VendorProfile"));
const CouponApp = lazy(() => import("./Canteen/coupon-app/src/App"));
const PaymentDashboard = lazy(() => import("./Canteen/pages/PaymentDashboard"));
const VendorReporting  = lazy(() => import("./Canteen/pages/VendorReporting"));
const VendorPayout     = lazy(() => import("./Canteen/pages/VendorPayout"));
const HelpPage         = lazy(() => import('./pages/HelpPage'));
const VendorReviews    = lazy(() => import('./Canteen/pages/VendorReviews'));
const VendorComplaints = lazy(() => import('./Canteen/pages/VendorComplaints'));

// Admin
const AnalyticsDashboard = lazy(() => import("./Canteen/pages/AdminDashboard"));

// Settings
const MfaSetupPage = lazy(() => import("./pages/MfaSetupPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

// Layouts (kept eager — they're lightweight wrappers)
import VendorLayout from "./Canteen/components/VendorLayout";
import ClientLayout from "./Canteen/components/ClientLayout";

// Smart Root Redirect based on Role
const RootRedirect = () => {
  if (!isAuthenticated()) {
    return <LandingPage />;
  }

  const session = getSession();
  const role = session?.role || session?.user?.role;

  if (role === "ADMIN") return <Navigate to="/analytics" replace />;
  if (role === "CANTEEN_OWNER") return <Navigate to="/dashboard" replace />;
  return <Navigate to="/customer/dashboard" replace />;
};

function App() {
  return (
    <ToastProvider>
      <ToastInitializer />
      <Suspense fallback={<Preloader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* Customer Routes */}
          <Route
            path="/customer/dashboard"
            element={
              <ProtectedRoute allowedRoles={["USER"]}>
                <ClientLayout>
                  <StudentDashboard />
                </ClientLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/profile"
            element={
              <ProtectedRoute allowedRoles={["USER"]}>
                <ClientLayout>
                  <CustomerProfile />
                </ClientLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/canteen/:id/menu"
            element={
              <ClientLayout>
                <CustomerMenuPage />
              </ClientLayout>
            }
          />
          <Route
            path="/customer/history"
            element={
              <ProtectedRoute allowedRoles={["USER"]}>
                <ClientLayout>
                  <CustomerOrderHistory />
                </ClientLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/offers"
            element={
              <ClientLayout>
                <CustomerOffers />
              </ClientLayout>
            }
          />
          {/* Redirect old /customer/orders to /customer/history */}
          <Route
            path="/customer/orders"
            element={<Navigate to="/customer/history" replace />}
          />

          {/* Legacy Redirect */}
          <Route
            path="/customer/menu"
            element={<Navigate to="/customer/dashboard" replace />}
          />

          <Route
            path="/cart"
            element={
              <ClientLayout>
                <CartPage />
              </ClientLayout>
            }
          />
          {/* /checkout now redirects to /cart — checkout logic is embedded in CartPage */}
          <Route
            path="/checkout"
            element={<Navigate to="/cart" replace />}
          />

          {/* MFA Setup (Customer) */}
          <Route
            path="/customer/security"
            element={
              <ProtectedRoute allowedRoles={["USER"]}>
                <ClientLayout>
                  <MfaSetupPage />
                </ClientLayout>
              </ProtectedRoute>
            }
          />

          {/* Vendor Routes (Strictly for Vendor/Admin) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["CANTEEN_OWNER", "ADMIN"]}>
                <VendorLayout>
                  <Dashboard />
                </VendorLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/canteen/menu"
            element={
              <ProtectedRoute allowedRoles={["CANTEEN_OWNER", "ADMIN"]}>
                <VendorLayout>
                  <MenuManagement />
                </VendorLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-history"
            element={
              <ProtectedRoute allowedRoles={["CANTEEN_OWNER", "ADMIN"]}>
                <VendorLayout>
                  <OrderHistory />
                </VendorLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "CANTEEN_OWNER"]}>
                <VendorLayout>
                  <AnalyticsDashboard />
                </VendorLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/coupons"
            element={
              <ProtectedRoute allowedRoles={["CANTEEN_OWNER", "ADMIN"]}>
                <VendorLayout>
                  <CouponApp />
                </VendorLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/profile"
            element={
              <ProtectedRoute allowedRoles={["CANTEEN_OWNER", "ADMIN"]}>
                <VendorLayout>
                  <VendorProfile />
                </VendorLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/reports"
            element={
              <ProtectedRoute allowedRoles={["CANTEEN_OWNER", "ADMIN"]}>
                <VendorLayout>
                  <VendorReporting />
                </VendorLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <ProtectedRoute allowedRoles={["CANTEEN_OWNER", "ADMIN"]}>
                <VendorLayout>
                  <PaymentDashboard />
                </VendorLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/payout"
            element={
              <ProtectedRoute allowedRoles={["CANTEEN_OWNER", "ADMIN"]}>
                <VendorLayout>
                  <VendorPayout />
                </VendorLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/help"
            element={
              <ProtectedRoute allowedRoles={["CANTEEN_OWNER", "ADMIN"]}>
                <VendorLayout>
                  <HelpPage />
                </VendorLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/reviews"
            element={
              <ProtectedRoute allowedRoles={['CANTEEN_OWNER', 'ADMIN']}>
                <VendorLayout>
                  <VendorReviews />
                </VendorLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/complaints"
            element={
              <ProtectedRoute allowedRoles={['CANTEEN_OWNER', 'ADMIN']}>
                <VendorLayout>
                  <VendorComplaints />
                </VendorLayout>
              </ProtectedRoute>
            }
          />
          {/* MFA Setup (Vendor/Admin) */}
          <Route
            path="/vendor/security"
            element={
              <ProtectedRoute allowedRoles={["CANTEEN_OWNER", "ADMIN"]}>
                <VendorLayout>
                  <MfaSetupPage />
                </VendorLayout>
              </ProtectedRoute>
            }
          />
          {/* Catch-all: block any undefined/malicious URL */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </ToastProvider>
  );
}

export default App;
