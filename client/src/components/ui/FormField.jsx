import { forwardRef, useId } from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Labelled input with optional hint and error text, wired up with aria attributes.
 * Pass `as` to render a custom input component (e.g. PasswordInput).
 */
const FormField = forwardRef(function FormField(
  { label, hint, error, optional = false, as: Input = 'input', className = '', ...inputProps },
  ref,
) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="form-label">
        {label}
        {optional && <span className="ml-1 font-normal text-slate-400">(optional)</span>}
      </label>
      <Input
        ref={ref}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
        className={`form-input ${error ? 'border-red-500 hover:border-red-500 focus:border-red-500 focus:ring-red-500/30' : ''}`}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="mt-1.5 flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-sm text-slate-500">
          {hint}
        </p>
      )}
    </div>
  );
});

export default FormField;
