// Client-side checks mirror the API's rules so users get instant feedback.
// The server remains the source of truth and validates everything again.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizePhone(value) {
  return value.replace(/[\s-]/g, '').replace(/^(\+91|0)/, '');
}

export function validateLogin({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = 'Enter your email address';
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address';
  if (!password) errors.password = 'Enter your password';
  return errors;
}

export function validateSignup({ name, email, phone, password }) {
  const errors = {};

  if (name.trim().length < 2) errors.name = 'Enter your full name';
  else if (name.trim().length > 60) errors.name = 'Name must be at most 60 characters';

  if (!email.trim()) errors.email = 'Enter your email address';
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address';

  if (phone.trim() && !/^[6-9]\d{9}$/.test(normalizePhone(phone))) {
    errors.phone = 'Enter a valid 10-digit Indian mobile number';
  }

  if (password.length < 8) errors.password = 'Password must be at least 8 characters';
  else if (password.length > 72) errors.password = 'Password must be at most 72 characters';
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    errors.password = 'Password must include at least one letter and one number';
  }

  return errors;
}
