import { Link } from 'react-router';

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-60';

const variants = {
  primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700',
  secondary: 'bg-white text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50',
  ghost: 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
  light: 'bg-white text-brand-700 shadow-sm hover:bg-brand-50',
  outlineLight: 'text-white ring-1 ring-inset ring-white/40 hover:bg-white/10',
};

const sizes = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
};

/**
 * Renders a router <Link> when `to` is given, an external <a> (new tab) for `href`,
 * otherwise a native <button>.
 */
export default function Button({
  to,
  href,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  children,
  ...props
}) {
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
