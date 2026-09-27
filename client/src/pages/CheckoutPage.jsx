import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import { ArrowLeft, CalendarDays, Car, Clock, MapPin } from 'lucide-react';

import Alert from '../components/ui/Alert.jsx';
import Button from '../components/ui/Button.jsx';
import Container from '../components/ui/Container.jsx';
import FormField from '../components/ui/FormField.jsx';
import Spinner, { PageSpinner } from '../components/ui/Spinner.jsx';
import DemoBadge from '../components/listing/DemoBadge.jsx';
import ListingPhoto from '../components/listing/ListingPhoto.jsx';
import { useApiQuery } from '../hooks/useApiQuery.js';
import { ApiError } from '../services/api.js';
import { bookingsService } from '../services/bookings.service.js';
import { listingsService } from '../services/listings.service.js';
import { formatTime12h, isOpenForSlot } from '../utils/availability.js';
import { isValidVehicleNumber, normalizeVehicleNumber } from '../utils/bookingTime.js';
import { combineDateAndTime } from '../utils/datetime.js';
import { formatHours, formatINR, formatShortDate } from '../utils/format.js';

const VEHICLE_KEY = 'parkly.vehicleNumber';

function readSavedVehicle() {
  try {
    return localStorage.getItem(VEHICLE_KEY) ?? '';
  } catch {
    return '';
  }
}

function saveVehicle(value) {
  try {
    localStorage.setItem(VEHICLE_KEY, value);
  } catch {
    // Not important if storage is unavailable.
  }
}

function endTimeLabel(time, hours) {
  const [h, m] = time.split(':').map(Number);
  const end = (h * 60 + m + hours * 60) % (24 * 60);
  const label = formatTime12h(`${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`);
  return h * 60 + m + hours * 60 >= 24 * 60 ? `${label} (next day)` : label;
}

export default function CheckoutPage() {
  const { listingId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const slot = { date: params.get('date'), time: params.get('time'), duration: params.get('duration') };
  const hours = Number(slot.duration);

  const { data, error, isLoading } = useApiQuery(listingId, () => listingsService.getById(listingId));
  const [vehicleNumber, setVehicleNumber] = useState(readSavedVehicle);
  const [vehicleError, setVehicleError] = useState('');
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Missing slot details (e.g. a hand-typed URL): send the user back to choose a time.
  if (!slot.date || !slot.time || !hours) return <Navigate to={`/listings/${listingId}`} replace />;

  if (error) {
    return (
      <Container className="py-16">
        <Alert tone="error">{error.status === 404 ? 'This parking space isn’t available.' : error.message}</Alert>
        <Button to="/search" variant="secondary" className="mt-6">
          Browse parking
        </Button>
      </Container>
    );
  }
  if (isLoading || !data) return <PageSpinner label="Loading booking details" />;

  const { listing } = data;
  const total = listing.pricePerHour * hours;
  const isPast = combineDateAndTime(slot.date, slot.time) < new Date();
  const isOpen = isOpenForSlot(listing.availability, slot);
  const listingUrl = `/listings/${listing.id}?${new URLSearchParams(slot)}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setFormError(null);

    if (!isValidVehicleNumber(vehicleNumber)) {
      setVehicleError('Enter a valid vehicle number, e.g. MH12AB1234');
      e.currentTarget.elements.namedItem('vehicleNumber')?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const { booking } = await bookingsService.create({
        spaceId: listing.id,
        date: slot.date,
        time: slot.time,
        duration: hours,
        vehicleNumber: normalizeVehicleNumber(vehicleNumber),
      });
      saveVehicle(normalizeVehicleNumber(vehicleNumber));
      navigate(`/bookings/${booking.id}`, { replace: true, state: { justBooked: true } });
    } catch (err) {
      const fieldError = err instanceof ApiError ? err.fieldErrors.vehicleNumber : undefined;
      if (fieldError) setVehicleError(fieldError);
      else setFormError({ message: err.message, conflict: err.status === 409 });
      setSubmitting(false);
    }
  };

  const summary = [
    { icon: CalendarDays, label: formatShortDate(slot.date) },
    { icon: Clock, label: `${formatTime12h(slot.time)} – ${endTimeLabel(slot.time, hours)} · ${formatHours(hours)}` },
  ];

  return (
    <Container className="py-8 sm:py-12">
      <Link to={listingUrl} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to listing
      </Link>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Confirm your booking</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_24rem]">
        <form noValidate onSubmit={handleSubmit} className="order-2 space-y-6 lg:order-1">
          {formError && (
            <Alert tone="error">
              <p>{formError.message}</p>
              {formError.conflict && (
                <Link to={listingUrl} className="mt-2 inline-block font-semibold underline">
                  Choose another time
                </Link>
              )}
            </Alert>
          )}
          {(isPast || !isOpen) && (
            <Alert tone="error">
              {isPast ? 'That start time has already passed.' : 'This space isn’t open for the whole of that time.'}{' '}
              <Link to={listingUrl} className="font-semibold underline">
                Pick a different time
              </Link>
            </Alert>
          )}

          <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
            <h2 className="flex items-center gap-2 font-semibold text-slate-900">
              <Car className="h-5 w-5 text-slate-400" aria-hidden="true" />
              Your vehicle
            </h2>
            <FormField
              className="mt-4"
              label="Vehicle registration number"
              name="vehicleNumber"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="MH12AB1234"
              hint="Shared with the host so they can recognise your car."
              value={vehicleNumber}
              onChange={(e) => {
                setVehicleNumber(e.target.value.toUpperCase());
                setVehicleError('');
              }}
              error={vehicleError}
              required
            />
          </section>

          <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
            <h2 className="font-semibold text-slate-900">Payment</h2>
            <p className="mt-2 text-sm text-slate-600">
              Online payment isn’t live yet, so no payment will be taken for this booking. You’ll see the total
              below for reference.
            </p>
          </section>

          <p className="text-sm text-slate-500">
            By confirming, you agree to follow the host’s house rules for this space.
          </p>

          <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={submitting || isPast || !isOpen}>
            {submitting && <Spinner />}
            {submitting ? 'Confirming…' : `Confirm booking · ${formatINR(total)}`}
          </Button>
        </form>

        <aside className="order-1 lg:order-2">
          <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 lg:sticky lg:top-24">
            <ListingPhoto listing={listing} className="h-36 w-full" />
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-slate-900">{listing.title}</p>
                {listing.isDemo && <DemoBadge />}
              </div>
              <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {listing.address.area}, Pune
              </p>

              <ul className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm text-slate-700">
                {summary.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    {label}
                  </li>
                ))}
              </ul>

              <dl className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm">
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
            </div>
          </div>
        </aside>
      </div>
    </Container>
  );
}
