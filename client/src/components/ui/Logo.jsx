import { Link } from 'react-router';

export function LogoMark({ className = 'h-8 w-8' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-brand-600" />
      <path
        d="M11 24V8h6.5a5 5 0 0 1 0 10H11"
        fill="none"
        stroke="#fff"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Logo({ tone = 'dark', onClick }) {
  return (
    <Link
      to="/"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg"
      aria-label="Parkly home"
    >
      <LogoMark />
      <span
        className={`text-xl font-bold tracking-tight ${tone === 'light' ? 'text-white' : 'text-slate-900'}`}
      >
        Parkly
      </span>
    </Link>
  );
}
