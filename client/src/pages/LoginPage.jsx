import { Link, useLocation } from 'react-router';

import AuthShell from '../components/auth/AuthShell.jsx';
import Alert from '../components/ui/Alert.jsx';
import Button from '../components/ui/Button.jsx';
import FormField from '../components/ui/FormField.jsx';
import PasswordInput from '../components/ui/PasswordInput.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useAuthForm } from '../hooks/useAuthForm.js';
import { validateLogin } from '../utils/validation.js';

export default function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const redirectedFrom = location.state?.from?.pathname;
  const sessionExpired = location.state?.reason === 'expired';

  const { values, errors, formError, submitting, handleChange, handleSubmit } = useAuthForm(
    { email: '', password: '' },
    validateLogin,
    (v) => login({ email: v.email.trim(), password: v.password }),
  );

  return (
    <AuthShell title="Welcome back" subtitle="Log in to book parking and manage your spaces.">
      {redirectedFrom && !formError && (
        <Alert tone="info" className="mb-6">
          {sessionExpired ? 'Your session has expired. Please log in again.' : 'Please log in to continue.'}
        </Alert>
      )}
      {formError && (
        <Alert tone="error" className="mb-6">
          {formError}
        </Alert>
      )}

      <form noValidate onSubmit={handleSubmit} className="space-y-5">
        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
          required
        />
        <FormField
          as={PasswordInput}
          label="Password"
          name="password"
          autoComplete="current-password"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
          required
        />

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting && <Spinner />}
          {submitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-600">
        New to Parkly?{' '}
        <Link to="/signup" state={location.state} className="font-semibold text-brand-600 hover:text-brand-700">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
