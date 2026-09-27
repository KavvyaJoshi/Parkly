import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Eye, EyeOff, MapPin, Pencil, Trash2 } from 'lucide-react';

import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import DemoBadge from '../../components/listing/DemoBadge.jsx';
import ListingPhoto from '../../components/listing/ListingPhoto.jsx';
import { SPACE_TYPES } from '../../constants/listing.js';
import { useApiQuery } from '../../hooks/useApiQuery.js';
import { listingsService } from '../../services/listings.service.js';
import { formatAvailability } from '../../utils/availability.js';
import { formatINR } from '../../utils/format.js';

export default function HostListingsPage() {
  const location = useLocation();
  const { data, error, retry } = useApiQuery('my-listings', listingsService.mine);
  const [overrides, setOverrides] = useState({}); // id -> updated listing, or null once deleted
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState(location.state?.message ?? '');
  const [actionError, setActionError] = useState('');
  const [toDelete, setToDelete] = useState(null);

  if (error) {
    return (
      <Alert tone="error">
        <p>{error.message}</p>
        <button type="button" onClick={retry} className="mt-2 font-semibold underline">
          Try again
        </button>
      </Alert>
    );
  }
  if (!data) return <PageSpinner label="Loading your listings" />;

  const listings = data.listings
    .map((listing) => (listing.id in overrides ? overrides[listing.id] : listing))
    .filter(Boolean);

  const run = async (id, action, successMessage) => {
    setBusyId(id);
    setActionError('');
    setMessage('');
    try {
      const result = await action();
      setOverrides((prev) => ({ ...prev, [id]: result }));
      setMessage(successMessage);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const togglePublished = (listing) =>
    run(
      listing.id,
      async () => (await listingsService.update(listing.id, { isPublished: !listing.isPublished })).listing,
      listing.isPublished ? `“${listing.title}” is now hidden from search.` : `“${listing.title}” is live in search.`,
    );

  const confirmDelete = async () => {
    const listing = toDelete;
    setToDelete(null);
    await run(
      listing.id,
      async () => {
        await listingsService.remove(listing.id);
        return null;
      },
      `“${listing.title}” was deleted.`,
    );
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Your listings</h1>
      </div>

      {message && (
        <Alert tone="success" className="mt-6">
          {message}
        </Alert>
      )}
      {actionError && (
        <Alert tone="error" className="mt-6">
          {actionError}
        </Alert>
      )}

      {listings.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-white px-6 py-16 text-center ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">You haven’t listed a space yet</h2>
          <p className="mt-1 text-slate-600">Add your first parking space to start earning.</p>
          <Button to="/host/listings/new" className="mt-6">
            List your space
          </Button>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {listings.map((listing) => {
            const busy = busyId === listing.id;
            return (
              <li key={listing.id}>
                <article className={`flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 sm:flex-row ${busy ? 'opacity-60' : ''}`}>
                  <ListingPhoto listing={listing} className="h-36 w-full sm:h-auto sm:w-48 sm:shrink-0" />
                  <div className="flex flex-1 flex-col gap-4 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              listing.isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {listing.isPublished ? 'Published' : 'Draft'}
                          </span>
                          {listing.isDemo && <DemoBadge />}
                        </div>
                        <h2 className="mt-2 font-semibold text-slate-900">{listing.title}</h2>
                        <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                          <MapPin className="h-4 w-4" aria-hidden="true" />
                          {listing.address.area} · {SPACE_TYPES[listing.spaceType]}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">{formatAvailability(listing.availability)}</p>
                      </div>
                      <p className="text-lg font-bold text-slate-900">
                        {formatINR(listing.pricePerHour)}
                        <span className="text-sm font-normal text-slate-500">/hr</span>
                      </p>
                    </div>

                    <div className="mt-auto flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" to={`/host/listings/${listing.id}/edit`}>
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        Edit
                      </Button>
                      <Button size="sm" variant="secondary" disabled={busy} onClick={() => togglePublished(listing)}>
                        {listing.isPublished ? (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                        {listing.isPublished ? 'Unpublish' : 'Publish'}
                      </Button>
                      <Link
                        to={`/listings/${listing.id}`}
                        className="inline-flex h-9 items-center px-2 text-sm font-medium text-brand-600 hover:text-brand-700"
                      >
                        View listing
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-auto text-red-700 hover:bg-red-50 hover:text-red-800"
                        disabled={busy}
                        onClick={() => setToDelete(listing)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this listing?"
        description={`“${toDelete?.title ?? ''}” will be removed permanently. If you just want to stop new bookings, unpublish it instead.`}
        confirmLabel="Delete listing"
        cancelLabel="Keep listing"
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
