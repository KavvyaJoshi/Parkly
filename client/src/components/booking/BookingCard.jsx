import { Link } from 'react-router';
import { CalendarDays, Car, MapPin } from 'lucide-react';

import BookingStatusBadge from './BookingStatusBadge.jsx';
import ListingPhoto from '../listing/ListingPhoto.jsx';
import DemoBadge from '../listing/DemoBadge.jsx';
import { formatBookingRange } from '../../utils/bookingTime.js';
import { formatINR } from '../../utils/format.js';

export default function BookingCard({ booking }) {
  const { space } = booking;

  return (
    <article className="relative flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 transition hover:shadow-md sm:flex-row">
      <ListingPhoto listing={space} className="h-32 w-full sm:h-auto sm:w-40 sm:shrink-0" />
      <div className="flex flex-1 flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <BookingStatusBadge booking={booking} />
            {booking.isDemo && <DemoBadge />}
            <span className="font-mono text-xs text-slate-500">{booking.reference}</span>
          </div>
          <h3 className="mt-2 font-semibold text-slate-900">
            <Link to={`/bookings/${booking.id}`} className="after:absolute after:inset-0">
              {space.title}
            </Link>
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            <li className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              {formatBookingRange(booking.startTime, booking.endTime)}
            </li>
            <li className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              {space.address.area}, Pune
            </li>
            <li className="flex items-center gap-1.5">
              <Car className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              <span className="font-mono">{booking.vehicleNumber}</span>
            </li>
          </ul>
        </div>
        <p className="shrink-0 text-lg font-bold text-slate-900 sm:text-right">{formatINR(booking.totalPrice)}</p>
      </div>
    </article>
  );
}
