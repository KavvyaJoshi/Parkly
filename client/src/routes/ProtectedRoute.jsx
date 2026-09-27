import { Navigate, Outlet, useLocation } from 'react-router';

import { useAuth } from '../hooks/useAuth.js';
import { PageSpinner } from '../components/ui/Spinner.jsx';

/**
 * Only renders child routes for logged-in users. Others are sent to /login and
 * returned here afterwards — except users who just chose to log out, who go home.
 */
export default function ProtectedRoute() {
  const { status, endReason } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <PageSpinner label="Checking your session" />;
  if (status === 'unauthenticated') {
    if (endReason === 'logout') return <Navigate to="/" replace />;
    return <Navigate to="/login" replace state={{ from: location, reason: endReason }} />;
  }
  return <Outlet />;
}
