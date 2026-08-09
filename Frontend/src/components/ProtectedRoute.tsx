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

  // 1. Check Authentication
  if (!isAuthenticated() || !session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Check Role (if allowedRoles is defined)
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = session.role || session.user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      if (userRole === 'ADMIN') {
        return <Navigate to="/analytics" replace />;
      } else if (userRole === 'CANTEEN_OWNER') {
        return <Navigate to="/dashboard" replace />;
      } else {
        return <Navigate to="/customer/dashboard" replace />;
      }
    }
  }

  return <>{children}</>;
}
