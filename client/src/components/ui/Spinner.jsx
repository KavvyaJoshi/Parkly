import { Loader2 } from 'lucide-react';

export default function Spinner({ className = 'h-5 w-5', label }) {
  return (
    <>
      <Loader2 className={`animate-spin ${className}`} aria-hidden="true" />
      {label && <span className="sr-only">{label}</span>}
    </>
  );
}

export function PageSpinner({ label = 'Loading' }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-brand-600" role="status">
      <Spinner className="h-8 w-8" label={label} />
    </div>
  );
}
