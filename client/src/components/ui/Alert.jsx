import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

const styles = {
  error: { box: 'bg-red-50 text-red-800 ring-red-200', icon: AlertCircle },
  success: { box: 'bg-emerald-50 text-emerald-800 ring-emerald-200', icon: CheckCircle2 },
  info: { box: 'bg-brand-50 text-brand-800 ring-brand-200', icon: Info },
};

export default function Alert({ tone = 'info', children, className = '' }) {
  const { box, icon: Icon } = styles[tone];

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex gap-3 rounded-xl p-4 text-sm ring-1 ring-inset ${box} ${className}`}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
