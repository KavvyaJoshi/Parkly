import { Link } from 'react-router';
import { Car, Clock, MapPin } from 'lucide-react';

import ListingPhoto from '../listing/ListingPhoto.jsx';
import DemoBadge from '../listing/DemoBadge.jsx';
import { AMENITIES, VEHICLE_FITS } from '../../constants/listing.js';
import { formatAvailability } from '../../utils/availability.js';
import { formatDistance, formatHours, formatINR } from '../../utils/format.js';

/** A search result. `slotParams` (date/time/duration) are carried through to the details page. */
export default function ListingCard({ listing, duration, slotParams }) {
  const href = `/listings/${listing.id}${slotParams ? `?${slotParams}` : ''}`;
  const hours = Number(duration) || 0;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 transition hover:shadow-lg sm:flex-row">
      <div className="relative sm:w-56 sm:shrink-0">
        <ListingPhoto listing={listing} className="h-44 w-full sm:h-full" />
        {listing.isDemo && <DemoBadge className="absolute top-3 left-3" />}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900">
              <Link to={href} className="after:absolute after:inset-0">
                {listing.title}
              </Link>
            </h3>
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
              {listing.address.area}
              {listing.distanceMeters !== undefined && ` · ${formatDistance(listing.distanceMeters)} away`}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-lg font-bold text-slate-900">
              {formatINR(listing.pricePerHour)}
              <span className="text-sm font-normal text-slate-500">/hr</span>
            </p>
            {hours > 0 && (
              <p className="text-xs text-slate-500">
                {formatINR(listing.pricePerHour * hours)} for {formatHours(hours)}
              </p>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-slate-400" aria-hidden="true" />
            {formatAvailability(listing.availability)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Car className="h-4 w-4 text-slate-400" aria-hidden="true" />
            {VEHICLE_FITS[listing.vehicleSize]}
          </span>
        </div>

        {listing.amenities.length > 0 && (
          <ul className="mt-auto flex flex-wrap gap-2 pt-4" aria-label="Amenities">
            {listing.amenities.slice(0, 4).map((key) => {
              const { label, icon: Icon } = AMENITIES[key];
              return (
                <li
                  key={key}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {label}
                </li>
              );
            })}
            {listing.amenities.length > 4 && (
              <li className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                +{listing.amenities.length - 4} more
              </li>
            )}
          </ul>
        )}
      </div>
    </article>
  );
}
