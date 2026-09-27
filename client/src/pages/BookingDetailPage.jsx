import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { CalendarDays, Car, CheckCircle2, Navigation, Phone, ReceiptIndianRupee, ScrollText, UserRound } from 'lucide-react';

import Alert from '../components/ui/Alert.jsx';
import Button from '../components/ui/Button.jsx';
import Container from '../components/ui/Container.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import { PageSpinner } from '../components/ui/Spinner.jsx';
import BookingStatusBadge from '../components/booking/BookingStatusBadge.jsx';
import DemoBadge from '../components/listing/DemoBadge.jsx';
import ListingPhoto from '../components/listing/ListingPhoto.jsx';
import { useApiQuery } from '../hooks/useApiQuery.js';
import { bookingsService } from '../services/bookings.service.js';
import { formatBookingRange } from '../utils/bookingTime.js';
import { formatHours, formatINR } from '../utils/format.js';

function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex gap-4 px-5 py-4">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-sm text-slate-500">{label}</dt>
        <dd className="mt-0.5 font-medium text-slate-900">{children}</dd>
      </div>
    </div>
  );
}

export default function BookingDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const justBooked = Boolean(location.state?.justBooked);
  const { data, error, isLoading } = useApiQuery(id, () => bookingsService.getById(id));
  const [updated, setUpdated] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  if (error) {
    return (
      <Container className="py-16">
        <Alert tone="error">{error.status === 404 ? 'We couldn’t find this booking.' : error.message}</Alert>
        <Button to="/bookings" variant="secondary" className="mt-6">
          My bookings
        </Button>
      </Container>
    );
  }
  if (isLoading || !data) return <PageSpinner label="Loading booking" />;

  const booking = updated ?? data.booking;
  const { space } = booking;
  const isOwnerView = booking.viewerRole === 'owner';
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${space.location.lat},${space.location.lng}`;
  const contact = isOwnerView ? booking.driver : booking.host;
  const showBookedBanner = justBooked && booking.status === 'confirmed';

  const handleCancel = async () => {
    setCancelling(true);
    setCancelError('');
    try {
      const result = await bookingsService.cancel(booking.id);
      setUpdated(result.booking);
    } catch (err) {
      setCancelError(err.message);
    } finally {
      setCancelling(false);
      setConfirming(false);
    }
  };

  return (
    <Container className="py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        {showBookedBanner && (
          <div className="mb-8 rounded-2xl bg-emerald-50 p-6 text-center ring-1 ring-emerald-200" role="status">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" aria-hidden="true" />
            <h1 className="mt-3 text-2xl font-bold text-slate-900">Your parking is booked!</h1>
            <p className="mt-1 text-slate-600">
              Booking reference <span className="font-mono font-semibold text-slate-900">{booking.reference}</span>
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          {showBookedBanner ? (
            <h2 className="text-xl font-semibold text-slate-900">Booking details</h2>
          ) : (
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Booking <span className="font-mono">{booking.reference}</span>
            </h1>
          )}
          <BookingStatusBadge booking={booking} className="px-3 py-1 text-sm" />
        </div>

        {updated?.status === 'cancelled' && (
          <Alert tone="success" className="mt-6">
            Booking cancelled. The space has been released.
          </Alert>
        )}
        {booking.status === 'cancelled' && !updated && booking.cancelledBy && (
          <p className="mt-4 text-sm text-slate-500">
            {booking.cancelledBy === (isOwnerView ? 'owner' : 'driver')
              ? 'You cancelled this booking.'
              : `Cancelled by the ${booking.cancelledBy === 'owner' ? 'host' : 'driver'}.`}
          </p>
        )}
        {cancelError && (
          <Alert tone="error" className="mt-6">
            {cancelError}
          </Alert>
        )}

        {booking.isDemo && (
          <Alert tone="info" className="mt-6">
            This booking is for a <strong>demo listing</strong>, so it’s for testing only — the space isn’t real.
          </Alert>
        )}

        <div className="mt-6 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
          <div className="flex flex-col sm:flex-row">
            <ListingPhoto listing={space} className="h-40 w-full sm:h-auto sm:w-48" />
            <div className="flex-1 p-5">
              <div className="flex items-start justify-between gap-3">
                <Link to={`/listings/${space.id}`} className="font-semibold text-slate-900 hover:text-brand-700">
                  {space.title}
                </Link>
                {space.isDemo && <DemoBadge />}
              </div>
              {space.address.line1 && <p className="mt-2 text-slate-700">{space.address.line1}</p>}
              <p className="text-slate-600">
                {space.address.area}, Pune {space.address.pincode}
              </p>
              {space.address.landmark && <p className="text-sm text-slate-500">{space.address.landmark}</p>}
              {booking.status === 'confirmed' && (
                <Button href={directionsUrl} variant="secondary" size="sm" className="mt-4">
                  <Navigation className="h-4 w-4" aria-hidden="true" />
                  Get directions
                </Button>
              )}
            </div>
          </div>

          <dl className="divide-y divide-slate-200 border-t border-slate-200">
            <Row icon={CalendarDays} label="When">
              {formatBookingRange(booking.startTime, booking.endTime)} ({formatHours(booking.hours)})
            </Row>
            <Row icon={Car} label="Vehicle">
              <span className="font-mono">{booking.vehicleNumber}</span>
            </Row>
            {contact && (
              <Row icon={UserRound} label={isOwnerView ? 'Driver' : 'Host'}>
                {contact.name}
                {contact.phone && (
                  <a href={`tel:+91${contact.phone}`} className="ml-3 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    +91 {contact.phone}
                  </a>
                )}
              </Row>
            )}
            <Row icon={ReceiptIndianRupee} label="Price">
              {formatINR(booking.pricePerHour)} × {formatHours(booking.hours)} ={' '}
              <span className="font-semibold">{formatINR(booking.totalPrice)}</span>
              <span className="mt-1 block text-sm font-normal text-slate-500">
                Online payment isn’t live yet — no payment was taken.
              </span>
            </Row>
          </dl>
        </div>

        {space.rules?.length > 0 && (
          <section className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
            <h2 className="flex items-center gap-2 font-semibold text-slate-900">
              <ScrollText className="h-5 w-5 text-slate-400" aria-hidden="true" />
              House rules
            </h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-slate-700">
              {space.rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {isOwnerView ? (
            <Button to="/search">Find parking</Button>
          ) : (
            <>
              <Button to="/bookings">My bookings</Button>
              <Button to="/search" variant="secondary">
                Find more parking
              </Button>
            </>
          )}
          {booking.canCancel && (
            <Button variant="dangerOutline" className="sm:ml-auto" onClick={() => setConfirming(true)}>
              Cancel booking
            </Button>
          )}
        </div>

        <ConfirmDialog
          open={confirming}
          title="Cancel this booking?"
          description={
            isOwnerView
              ? 'The driver will lose this reservation and the time slot will become available again.'
              : 'Your reservation will be released and someone else may book this time slot.'
          }
          confirmLabel="Yes, cancel booking"
          cancelLabel="Keep booking"
          busy={cancelling}
          onConfirm={handleCancel}
          onCancel={() => setConfirming(false)}
        />
      </div>
    </Container>
  );
}
