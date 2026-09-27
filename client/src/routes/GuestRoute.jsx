import { Navigate, Outlet, useLocation } from 'react-router';

import { useAuth } from '../hooks/useAuth.js';
import { PageSpinner } from '../components/ui/Spinner.jsx';

/**
 * Wraps the login/signup pages. Once the user is logged in (including right after
 * submitting the form) they're sent to the page they were blocked from, or /account.
 */
export default function GuestRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <PageSpinner />;
  if (status === 'authenticated') {
    return <Navigate to={location.state?.from ?? '/account'} replace />;
  }
  return <Outlet />;
}
