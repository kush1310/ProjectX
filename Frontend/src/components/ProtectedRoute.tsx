import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getSession } from '@/utils/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

/**
 * ProtectedRoute Component
 * Prevents access to protected pages when not authenticated.
 * Enforces Role-Based Access Control (RBAC).
 */
export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const session = getSession();
  
  console.log('[ProtectedRoute] Checking access for:', location.pathname);
  console.log('[ProtectedRoute] Session:', session);
  console.log('[ProtectedRoute] Allowed Roles:', allowedRoles);
  
  // 1. Check Authentication
  if (!isAuthenticated() || !session) {
    console.log('[ProtectedRoute] Not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Check Role (if allowedRoles is defined)
  if (allowedRoles && allowedRoles.length > 0) {
    // FIX: Access role directly from session object (it's flattened)
    const userRole = session.role || session.user?.role;
    console.log('[ProtectedRoute] Resolved User Role:', userRole);
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      console.log('[ProtectedRoute] Role mismatch/unauthorized. Redirecting...');
      // Unauthorized Access - Redirect to appropriate dashboard based on ACTUAL role
      if (userRole === 'ADMIN') {
        return <Navigate to="/analytics" replace />;
      } else if (userRole === 'CANTEEN_OWNER') {
        return <Navigate to="/dashboard" replace />;
      } else {
        // Default to Customer Dashboard for USER or others
        return <Navigate to="/customer/dashboard" replace />;
      }
    }
  }
  
  console.log('[ProtectedRoute] Access granted');
  return <>{children}</>;
}
