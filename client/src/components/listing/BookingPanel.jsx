import { useId, useState } from 'react';
import { useLocation } from 'react-router';
import { CheckCircle2, XCircle } from 'lucide-react';

import Button from '../ui/Button.jsx';
import { DURATION_OPTIONS } from '../../data/areas.js';
import { useAuth } from '../../hooks/useAuth.js';
import { formatAvailability, isOpenForSlot } from '../../utils/availability.js';
import { formatHours, formatINR } from '../../utils/format.js';
import { combineDateAndTime, getNextSlot, toDateInputValue, toTimeInputValue } from '../../utils/datetime.js';

function initialSlot(initial) {
  const next = getNextSlot();
  return {
    date: initial.date || toDateInputValue(next),
    time: initial.time || toTimeInputValue(next),
    duration: initial.duration || '2',
  };
}

/** Price and slot picker shown beside a listing. */
export default function BookingPanel({ listing, initial = {} }) {
  const id = useId();
  const location = useLocation();
  const { user, status } = useAuth();
  const [slot, setSlot] = useState(() => initialSlot(initial));

  const hours = Number(slot.duration);
  const total = listing.pricePerHour * hours;
  const isPast = combineDateAndTime(slot.date, slot.time) < new Date();
  const isAligned = /:(00|30)$/.test(slot.time);
  const isOpen = isOpenForSlot(listing.availability, slot);
  const isOwner = user && listing.owner?.id === user.id;
  const canBook = !isPast && isAligned && isOpen;
  const checkoutUrl = `/book/${listing.id}?${new URLSearchParams(slot)}`;

  const handleChange = (e) => setSlot((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const durationOptions = DURATION_OPTIONS.includes(hours) ? DURATION_OPTIONS : [...DURATION_OPTIONS, hours].sort((a, b) => a - b);

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 shadow-slate-900/5 ring-slate-200">
      <p className="text-2xl font-bold text-slate-900">
        {formatINR(listing.pricePerHour)}
        <span className="text-base font-normal text-slate-500"> / hour</span>
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label htmlFor={`${id}-date`} className="form-label">
            Date
          </label>
          <input
            id={`${id}-date`}
            name="date"
            type="date"
            min={toDateInputValue(new Date())}
            value={slot.date}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        <div>
          <label htmlFor={`${id}-time`} className="form-label">
            Start time
          </label>
          <input
            id={`${id}-time`}
            name="time"
            type="time"
            step="1800"
            value={slot.time}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        <div>
          <label htmlFor={`${id}-duration`} className="form-label">
            Duration
          </label>
          <select
            id={`${id}-duration`}
            name="duration"
            value={slot.duration}
            onChange={handleChange}
            className="form-input"
          >
            {durationOptions.map((h) => (
              <option key={h} value={h}>
                {formatHours(h)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4" aria-live="polite">
        {isPast ? (
          <p className="flex items-start gap-2 text-sm text-red-700">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            That start time has already passed.
          </p>
        ) : !isAligned ? (
          <p className="flex items-start gap-2 text-sm text-red-700">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Bookings start on the hour or half-hour (e.g. 10:00 or 10:30).
          </p>
        ) : isOpen ? (
          <p className="flex items-start gap-2 text-sm text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Open for your selected time
          </p>
        ) : (
          <p className="flex items-start gap-2 text-sm text-red-700">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Not available at this time. Open {formatAvailability(listing.availability).replace(/^Open /, '')}.
            </span>
          </p>
        )}
      </div>

      <dl className="mt-5 space-y-2 border-t border-slate-200 pt-5 text-sm">
        <div className="flex justify-between text-slate-600">
          <dt>
            {formatINR(listing.pricePerHour)} × {formatHours(hours)}
          </dt>
          <dd>{formatINR(total)}</dd>
        </div>
        <div className="flex justify-between text-base font-semibold text-slate-900">
          <dt>Total</dt>
          <dd>{formatINR(total)}</dd>
        </div>
      </dl>

      <div className="mt-6">
        {isOwner ? (
          <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-600">This is your listing.</p>
        ) : status !== 'authenticated' ? (
          <Button to="/login" state={{ from: { ...location, pathname: `/book/${listing.id}`, search: `?${new URLSearchParams(slot)}` } }} size="lg" className="w-full">
            Log in to book
          </Button>
        ) : canBook ? (
          <Button to={checkoutUrl} size="lg" className="w-full">
            Book now
          </Button>
        ) : (
          <Button size="lg" className="w-full" disabled>
            Book now
          </Button>
        )}
        {!isOwner && <p className="mt-2 text-center text-xs text-slate-500">You won’t be charged yet</p>}
      </div>
    </div>
  );
}
