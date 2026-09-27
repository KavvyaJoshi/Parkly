import { Link, useSearchParams } from 'react-router';
import { CalendarX } from 'lucide-react';

import Alert from '../components/ui/Alert.jsx';
import Button from '../components/ui/Button.jsx';
import Container from '../components/ui/Container.jsx';
import BookingCard from '../components/booking/BookingCard.jsx';
import ResultsSkeleton from '../components/search/ResultsSkeleton.jsx';
import { useApiQuery } from '../hooks/useApiQuery.js';
import { bookingsService } from '../services/bookings.service.js';

const TABS = [
  { key: 'upcoming', label: 'Upcoming', empty: 'No upcoming bookings', hint: 'Find a spot for your next trip.' },
  { key: 'past', label: 'Past', empty: 'No past bookings yet', hint: 'Completed bookings will appear here.' },
  { key: 'cancelled', label: 'Cancelled', empty: 'No cancelled bookings', hint: 'Bookings you cancel will appear here.' },
];

export default function MyBookingsPage() {
  const [params] = useSearchParams();
  const tab = TABS.find((t) => t.key === params.get('tab')) ?? TABS[0];
  const { data, error, isLoading, retry } = useApiQuery(tab.key, () => bookingsService.mine(tab.key));

  // Previous tab's data stays around while the next loads; only show it if it matches.
  const current = data?.type === tab.key ? data : null;
  const counts = data?.counts;

  return (
    <Container className="py-10 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">My bookings</h1>
            <p className="mt-1 text-slate-600">Your parking reservations as a driver.</p>
          </div>
          <Button to="/search">Find parking</Button>
        </div>

        <nav aria-label="Booking filters" className="mt-8 border-b border-slate-200">
          <ul className="-mb-px flex gap-6">
            {TABS.map((t) => {
              const active = t.key === tab.key;
              return (
                <li key={t.key}>
                  <Link
                    to={t.key === 'upcoming' ? '/bookings' : `/bookings?tab=${t.key}`}
                    aria-current={active ? 'page' : undefined}
                    className={`inline-flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
                      active ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {t.label}{' '}
                    {counts && (
                      <span className={`rounded-full px-2 py-0.5 text-xs ${active ? 'bg-brand-100' : 'bg-slate-100'}`}>
                        {counts[t.key]}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-6" aria-busy={isLoading}>
          {error && (
            <Alert tone="error">
              <p>{error.message}</p>
              <button type="button" onClick={retry} className="mt-2 font-semibold underline">
                Try again
              </button>
            </Alert>
          )}

          {!error && !current && <ResultsSkeleton count={2} />}

          {!error && current && current.bookings.length === 0 && (
            <div className="rounded-2xl bg-white px-6 py-16 text-center ring-1 ring-slate-200">
              <CalendarX className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" />
              <h2 className="mt-4 text-lg font-semibold text-slate-900">{tab.empty}</h2>
              <p className="mt-1 text-slate-600">{tab.hint}</p>
              {tab.key === 'upcoming' && (
                <Button to="/search" className="mt-6">
                  Find parking
                </Button>
              )}
            </div>
          )}

          {!error && current && current.bookings.length > 0 && (
            <ul className="space-y-4">
              {current.bookings.map((booking) => (
                <li key={booking.id}>
                  <BookingCard booking={booking} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Container>
  );
}
