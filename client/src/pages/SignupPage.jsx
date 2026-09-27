import { Link, useLocation } from 'react-router';

import AuthShell from '../components/auth/AuthShell.jsx';
import Alert from '../components/ui/Alert.jsx';
import Button from '../components/ui/Button.jsx';
import FormField from '../components/ui/FormField.jsx';
import PasswordInput from '../components/ui/PasswordInput.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useAuthForm } from '../hooks/useAuthForm.js';
import { normalizePhone, validateSignup } from '../utils/validation.js';

export default function SignupPage() {
  const { register } = useAuth();
  const location = useLocation();

  const { values, errors, formError, submitting, handleChange, handleSubmit } = useAuthForm(
    { name: '', email: '', phone: '', password: '' },
    validateSignup,
    (v) =>
      register({
        name: v.name.trim(),
        email: v.email.trim(),
        password: v.password,
        ...(v.phone.trim() ? { phone: normalizePhone(v.phone) } : {}),
      }),
  );

  return (
    <AuthShell
      title="Create your account"
      subtitle="One account to book parking and to list your own space."
    >
      {formError && (
        <Alert tone="error" className="mb-6">
          {formError}
        </Alert>
      )}

      <form noValidate onSubmit={handleSubmit} className="space-y-5">
        <FormField
          label="Full name"
          name="name"
          autoComplete="name"
          value={values.name}
          onChange={handleChange}
          error={errors.name}
          required
        />
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
          label="Mobile number"
          name="phone"
          type="tel"
          autoComplete="tel-national"
          inputMode="tel"
          placeholder="98765 43210"
          optional
          hint="Space owners can reach you about your booking."
          value={values.phone}
          onChange={handleChange}
          error={errors.phone}
        />
        <FormField
          as={PasswordInput}
          label="Password"
          name="password"
          autoComplete="new-password"
          hint="At least 8 characters, with a letter and a number."
          value={values.password}
          onChange={handleChange}
          error={errors.password}
          required
        />

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting && <Spinner />}
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link to="/login" state={location.state} className="font-semibold text-brand-600 hover:text-brand-700">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
