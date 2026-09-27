import { CalendarDays, LogOut, Mail, Phone, SquareParking } from 'lucide-react';

import Button from '../components/ui/Button.jsx';
import Container from '../components/ui/Container.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { getInitials } from '../utils/format.js';

const memberSince = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

export default function AccountPage() {
  const { user, logout } = useAuth();

  const details = [
    { icon: Mail, label: 'Email', value: user.email },
    { icon: Phone, label: 'Mobile', value: user.phone ? `+91 ${user.phone}` : 'Not added' },
    { icon: CalendarDays, label: 'Member since', value: memberSince(user.createdAt) },
  ];

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-xl font-bold text-white">
              {getInitials(user.name)}
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{user.name}</h1>
              <p className="text-slate-600">Your Parkly account</p>
            </div>
          </div>
          <Button variant="secondary" onClick={logout}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Log out
          </Button>
        </div>

        <dl className="mt-10 divide-y divide-slate-200 rounded-2xl bg-white ring-1 ring-slate-200">
          {details.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-4 px-5 py-4">
              <Icon className="h-5 w-5 text-slate-400" aria-hidden="true" />
              <dt className="w-32 text-sm text-slate-500">{label}</dt>
              <dd className="font-medium text-slate-900">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-6 ring-1 ring-slate-200">
            <h2 className="font-semibold text-slate-900">Your bookings</h2>
            <p className="mt-1 text-sm text-slate-600">See upcoming and past parking, or cancel a booking.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button to="/bookings">My bookings</Button>
              <Button to="/search" variant="secondary">
                Find parking
              </Button>
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-6 ring-1 ring-slate-200">
            <h2 className="flex items-center gap-2 font-semibold text-slate-900">
              <SquareParking className="h-5 w-5 text-brand-600" aria-hidden="true" />
              Have a spare space?
            </h2>
            <p className="mt-1 text-sm text-slate-600">List it for free and earn by the hour.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button to="/host">Host dashboard</Button>
              <Button to="/host/listings/new" variant="secondary">
                List a space
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
