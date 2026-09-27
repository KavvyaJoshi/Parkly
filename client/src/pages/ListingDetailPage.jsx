import { Link, useParams, useSearchParams } from 'react-router';
import { ArrowLeft, Car, Check, Clock, Info, MapPin, ScrollText, SquareParking, UserRound } from 'lucide-react';

import Alert from '../components/ui/Alert.jsx';
import Button from '../components/ui/Button.jsx';
import Container from '../components/ui/Container.jsx';
import { PageSpinner } from '../components/ui/Spinner.jsx';
import BookingPanel from '../components/listing/BookingPanel.jsx';
import DemoBadge from '../components/listing/DemoBadge.jsx';
import PhotoGallery from '../components/listing/PhotoGallery.jsx';
import { AMENITIES, SPACE_TYPES, VEHICLE_FITS } from '../constants/listing.js';
import { useApiQuery } from '../hooks/useApiQuery.js';
import { listingsService } from '../services/listings.service.js';
import { formatAvailability } from '../utils/availability.js';

const memberSince = (iso) => new Date(iso).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

function Section({ title, icon: Icon, children }) {
  return (
    <section className="border-t border-slate-200 py-8">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
        {Icon && <Icon className="h-5 w-5 text-slate-400" aria-hidden="true" />}
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function ListingDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { data, error, isLoading, retry } = useApiQuery(id, () => listingsService.getById(id));

  const initialSlot = {
    date: searchParams.get('date') ?? undefined,
    time: searchParams.get('time') ?? undefined,
    duration: searchParams.get('duration') ?? undefined,
  };

  if (error?.status === 404) {
    return (
      <Container className="flex flex-col items-center py-24 text-center">
        <SquareParking className="h-12 w-12 text-slate-300" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">This parking space isn’t available</h1>
        <p className="mt-2 text-slate-600">It may have been removed or unpublished by its owner.</p>
        <Button to="/search" className="mt-8">
          Browse parking
        </Button>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-16">
        <Alert tone="error">
          <p>{error.message}</p>
          <button type="button" onClick={retry} className="mt-2 font-semibold underline">
            Try again
          </button>
        </Alert>
      </Container>
    );
  }

  if (isLoading || !data) return <PageSpinner label="Loading parking space" />;

  const { listing } = data;
  const backParams = new URLSearchParams({ location: listing.address.area });
  searchParams.forEach((value, key) => backParams.set(key, value));

  const facts = [
    { icon: SquareParking, label: SPACE_TYPES[listing.spaceType] },
    { icon: Car, label: VEHICLE_FITS[listing.vehicleSize] },
    { icon: Clock, label: formatAvailability(listing.availability) },
  ];

  return (
    <Container className="py-8 sm:py-10">
      <Link
        to={`/search?${backParams}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to results
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{listing.title}</h1>
        {listing.isDemo && <DemoBadge />}
        {!listing.isPublished && (
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
            Unpublished
          </span>
        )}
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-slate-600">
        <MapPin className="h-4 w-4" aria-hidden="true" />
        {listing.address.area}, Pune
        {listing.address.landmark && ` · ${listing.address.landmark}`}
      </p>

      <div className="mt-6">
        <PhotoGallery listing={listing} />
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div>
          {listing.isDemo && (
            <Alert tone="info" className="mb-8">
              <strong>Demo listing.</strong> This is a sample space created to demonstrate Parkly. It isn’t a
              real parking space, so any booking made here is for testing only.
            </Alert>
          )}

          <ul className="grid gap-3 sm:grid-cols-3">
            {facts.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm font-medium text-slate-800">
                <Icon className="h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>

          {listing.description && (
            <Section title="About this space" icon={Info}>
              <p className="leading-7 whitespace-pre-line text-slate-700">{listing.description}</p>
            </Section>
          )}

          <Section title="Amenities" icon={Check}>
            {listing.amenities.length ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {listing.amenities.map((key) => {
                  const { label, icon: Icon } = AMENITIES[key];
                  return (
                    <li key={key} className="flex items-center gap-3 text-slate-700">
                      <Icon className="h-5 w-5 text-slate-500" aria-hidden="true" />
                      {label}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-slate-600">No listed amenities.</p>
            )}
          </Section>

          {listing.rules.length > 0 && (
            <Section title="House rules" icon={ScrollText}>
              <ul className="list-disc space-y-2 pl-5 text-slate-700">
                {listing.rules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="Location" icon={MapPin}>
            <p className="text-slate-700">
              {listing.address.line1 && <span className="block">{listing.address.line1}</span>}
              {listing.address.area}, Pune {listing.address.pincode}
              {listing.address.landmark && <span className="block text-slate-500">{listing.address.landmark}</span>}
            </p>
            {!listing.isExactLocation && (
              <p className="mt-3 text-sm text-slate-500">The exact address is shared once your booking is confirmed.</p>
            )}
          </Section>

          {listing.owner?.name && (
            <Section title="Your host" icon={UserRound}>
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700">
                  {listing.owner.name[0]}
                </span>
                <div>
                  <p className="font-medium text-slate-900">{listing.owner.name}</p>
                  <p className="text-sm text-slate-500">Hosting since {memberSince(listing.owner.memberSince)}</p>
                </div>
              </div>
            </Section>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <BookingPanel listing={listing} initial={initialSlot} />
        </aside>
      </div>
    </Container>
  );
}
