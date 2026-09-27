import { NavLink, Outlet } from 'react-router';
import { Plus } from 'lucide-react';

import Button from '../components/ui/Button.jsx';
import Container from '../components/ui/Container.jsx';

const LINKS = [
  { to: '/host', label: 'Overview', end: true },
  { to: '/host/listings', label: 'Listings' },
  { to: '/host/bookings', label: 'Bookings' },
];

/** Shared header + sub-navigation for the host (space owner) dashboard. */
export default function HostLayout() {
  return (
    <div className="min-h-[70vh] bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <Container className="pt-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold tracking-wide text-brand-600 uppercase">Host dashboard</p>
              <p className="mt-1 text-slate-600">Manage your parking spaces, bookings and earnings.</p>
            </div>
            <Button to="/host/listings/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add a space
            </Button>
          </div>
          <nav aria-label="Host dashboard" className="mt-6">
            <ul className="-mb-px flex gap-6">
              {LINKS.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                      `inline-block border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
                        isActive ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </Container>
      </div>
      <Container className="py-8">
        <Outlet />
      </Container>
    </div>
  );
}
