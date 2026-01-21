import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '@/utils/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute Component
 * Prevents access to protected pages when not authenticated.
 * Also prevents back navigation to protected pages after logout.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  
  if (!isAuthenticated()) {
    // Redirect to login with replace to prevent back navigation
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
}
