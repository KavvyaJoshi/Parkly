import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';

import Alert from '../../components/ui/Alert.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import ListingForm from '../../components/host/ListingForm.jsx';
import PhotoManager from '../../components/host/PhotoManager.jsx';
import { useApiQuery } from '../../hooks/useApiQuery.js';
import { useAuth } from '../../hooks/useAuth.js';
import { listingsService } from '../../services/listings.service.js';

function EditListing({ id }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { data, error } = useApiQuery(`edit:${id}`, () => listingsService.getById(id));
  const [updated, setUpdated] = useState(null); // latest listing after photo changes

  if (error) return <Alert tone="error">{error.status === 404 ? 'Listing not found.' : error.message}</Alert>;
  if (!data) return <PageSpinner label="Loading listing" />;

  const listing = updated ?? data.listing;
  const ownerId = typeof listing.owner === 'object' ? listing.owner.id : listing.owner;
  if (ownerId !== user.id) return <Alert tone="error">You can only edit your own listings.</Alert>;

  const save = async (payload) => {
    await listingsService.update(id, payload);
    navigate('/host/listings', { state: { message: 'Your changes were saved.' } });
  };

  return (
    <div className="space-y-6">
      {location.state?.photoError && (
        <Alert tone="error">
          Your listing was saved, but the photos couldn’t be uploaded: {location.state.photoError} You can try again
          below.
        </Alert>
      )}
      <PhotoManager listing={listing} onChange={setUpdated} />
      <ListingForm listing={data.listing} onSubmit={save} />
    </div>
  );
}

export default function ListingFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const create = async (payload, { publish, photoFiles }) => {
    const { listing } = await listingsService.create({ ...payload, isPublished: publish });

    if (photoFiles.length) {
      try {
        await listingsService.uploadPhotos(listing.id, photoFiles);
      } catch (err) {
        // The listing exists; send the owner to its edit page to retry the photos.
        navigate(`/host/listings/${listing.id}/edit`, { replace: true, state: { photoError: err.message } });
        return;
      }
    }

    navigate('/host/listings', {
      state: {
        message: publish
          ? 'Your space is live! Drivers can now find and book it.'
          : 'Saved as a draft. Publish it when you’re ready.',
      },
    });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/host/listings" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Your listings
      </Link>
      <h1 className="mt-4 mb-6 text-2xl font-bold tracking-tight text-slate-900">
        {id ? 'Edit listing' : 'List your parking space'}
      </h1>
      {id ? <EditListing id={id} /> : <ListingForm onSubmit={create} />}
    </div>
  );
}
