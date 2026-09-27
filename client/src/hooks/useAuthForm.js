import { useState } from 'react';
import { ApiError } from '../services/api.js';

/**
 * Shared state for the login/signup forms: values, per-field errors,
 * a form-level error, and submission handling with server error mapping.
 */
export function useAuthForm(initialValues, validate, submit) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    // Clear a field's error as soon as the user starts correcting it.
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const focusFirstError = (form, fieldErrors) => {
    const first = Object.keys(fieldErrors).find((name) => fieldErrors[name]);
    form.elements.namedItem(first)?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const form = e.currentTarget;

    setFormError('');
    const clientErrors = validate(values);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) {
      focusFirstError(form, clientErrors);
      return;
    }

    setSubmitting(true);
    try {
      await submit(values);
      // On success the auth state changes and GuestRoute redirects; nothing else to do.
    } catch (err) {
      const fieldErrors = err instanceof ApiError ? err.fieldErrors : {};
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        focusFirstError(form, fieldErrors);
      } else {
        setFormError(err.message);
      }
      setSubmitting(false);
    }
  };

  return { values, errors, formError, submitting, handleChange, handleSubmit };
}
