import { Link } from 'react-router';
import { CalendarClock, IndianRupee, SquareParking, TrendingUp } from 'lucide-react';

import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import BookingCard from '../../components/booking/BookingCard.jsx';
import StatTile from '../../components/host/StatTile.jsx';
import { useApiQuery } from '../../hooks/useApiQuery.js';
import { ownerService } from '../../services/owner.service.js';
import { formatINR } from '../../utils/format.js';

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function GetStarted() {
  return (
    <div className="rounded-3xl bg-white px-6 py-16 text-center ring-1 ring-slate-200">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <SquareParking className="h-7 w-7" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-2xl font-bold text-slate-900">List your first parking space</h1>
      <p className="mx-auto mt-2 max-w-md text-slate-600">
        Add your driveway, society slot or garage, set an hourly price and the hours it’s free. It takes a few
        minutes and it’s free to list.
      </p>
      <Button to="/host/listings/new" size="lg" className="mt-8">
        List your space
      </Button>
    </div>
  );
}

export default function HostOverviewPage() {
  const summaryQuery = useApiQuery('owner-summary', ownerService.summary);
  const upcomingQuery = useApiQuery('owner-upcoming', () => ownerService.bookings('upcoming'));

  if (summaryQuery.error) return <Alert tone="error">{summaryQuery.error.message}</Alert>;
  if (!summaryQuery.data) return <PageSpinner label="Loading dashboard" />;

  const { summary, listings } = summaryQuery.data;
  if (summary.listings === 0) return <GetStarted />;

  const upcoming = upcomingQuery.data?.bookings.slice(0, 3) ?? [];

  return (
    <div className="space-y-10">
      <section aria-labelledby="stats-heading">
        <h1 id="stats-heading" className="sr-only">
          Overview
        </h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Total earned"
            icon={IndianRupee}
            value={formatINR(summary.earned)}
            detail={`From ${plural(summary.completedBookings, 'completed booking')}`}
          />
          <StatTile label="Earned this month" icon={TrendingUp} value={formatINR(summary.earnedThisMonth)} />
          <StatTile
            label="Upcoming bookings"
            icon={CalendarClock}
            value={summary.upcomingBookings}
            detail={`${formatINR(summary.upcomingValue)} booked`}
          />
          <StatTile
            label="Live listings"
            icon={SquareParking}
            value={summary.publishedListings}
            detail={`of ${plural(summary.listings, 'listing')}`}
          />
        </div>
        <p className="mt-3 text-sm text-slate-500">
          Earnings show the value of completed bookings. Online payments and payouts aren’t live yet.
        </p>
      </section>

      <section aria-labelledby="upcoming-heading">
        <div className="flex items-center justify-between">
          <h2 id="upcoming-heading" className="text-lg font-semibold text-slate-900">
            Next bookings
          </h2>
          <Link to="/host/bookings" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            View all
          </Link>
        </div>
        <div className="mt-4">
          {upcomingQuery.error && <Alert tone="error">{upcomingQuery.error.message}</Alert>}
          {upcomingQuery.data && upcoming.length === 0 && (
            <p className="rounded-2xl bg-white p-6 text-slate-600 ring-1 ring-slate-200">
              No upcoming bookings yet. Published spaces appear in search for drivers across Pune.
            </p>
          )}
          {upcoming.length > 0 && (
            <ul className="space-y-4">
              {upcoming.map((booking) => (
                <li key={booking.id}>
                  <BookingCard booking={booking} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section aria-labelledby="performance-heading">
        <h2 id="performance-heading" className="text-lg font-semibold text-slate-900">
          Your listings
        </h2>
        <div className="mt-4 overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">Listing</th>
                <th scope="col" className="px-5 py-3 font-medium">Status</th>
                <th scope="col" className="px-5 py-3 text-right font-medium">Price / hr</th>
                <th scope="col" className="px-5 py-3 text-right font-medium">Upcoming</th>
                <th scope="col" className="px-5 py-3 text-right font-medium">Completed</th>
                <th scope="col" className="px-5 py-3 text-right font-medium">Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 tabular-nums">
              {listings.map((listing) => (
                <tr key={listing.id}>
                  <th scope="row" className="px-5 py-4 font-medium text-slate-900">
                    <Link to={`/host/listings/${listing.id}/edit`} className="hover:text-brand-700">
                      {listing.title}
                    </Link>
                    <span className="block text-xs font-normal text-slate-500">{listing.area}</span>
                  </th>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        listing.isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {listing.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right text-slate-700">{formatINR(listing.pricePerHour)}</td>
                  <td className="px-5 py-4 text-right text-slate-700">{listing.upcomingBookings}</td>
                  <td className="px-5 py-4 text-right text-slate-700">{listing.completedBookings}</td>
                  <td className="px-5 py-4 text-right font-semibold text-slate-900">{formatINR(listing.earned)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
