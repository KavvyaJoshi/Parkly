import { Link } from 'react-router';

import Logo from '../ui/Logo.jsx';
import Container from '../ui/Container.jsx';
import { useAuth } from '../../hooks/useAuth.js';

const FOOTER_COLUMNS = [
  {
    title: 'Drivers',
    links: [
      { label: 'Find parking', to: '/search' },
      { label: 'How it works', to: '/#how-it-works' },
      { label: 'Popular areas', to: '/#popular-areas' },
    ],
  },
  {
    title: 'Space owners',
    links: [
      { label: 'List your space', to: '/list-your-space' },
      { label: 'Why list with Parkly', to: '/#list-your-space' },
    ],
  },
];

const GUEST_ACCOUNT_LINKS = [
  { label: 'Log in', to: '/login' },
  { label: 'Sign up', to: '/signup' },
];

const MEMBER_ACCOUNT_LINKS = [
  { label: 'My bookings', to: '/bookings' },
  { label: 'Host dashboard', to: '/host' },
  { label: 'My account', to: '/account' },
];

export default function Footer() {
  const { isAuthenticated } = useAuth();
  const columns = [
    ...FOOTER_COLUMNS,
    { title: 'Account', links: isAuthenticated ? MEMBER_ACCOUNT_LINKS : GUEST_ACCOUNT_LINKS },
  ];

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <Container className="py-12">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-slate-600">
              Hourly parking in private spaces. Starting in Pune, one driveway at a time.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h2 className="text-sm font-semibold text-slate-900">{column.title}</h2>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-slate-600 hover:text-slate-900">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-slate-200 pt-6 text-sm text-slate-500 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Parkly. All rights reserved.</p>
          <p>Early-stage product. Listings shown are demo data.</p>
        </div>
      </Container>
    </footer>
  );
}
