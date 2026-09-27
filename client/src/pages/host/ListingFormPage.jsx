import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';

import Alert from '../../components/ui/Alert.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import ListingForm from '../../components/host/ListingForm.jsx';
import { useApiQuery } from '../../hooks/useApiQuery.js';
import { useAuth } from '../../hooks/useAuth.js';
import { listingsService } from '../../services/listings.service.js';

function EditListing({ id }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, error } = useApiQuery(`edit:${id}`, () => listingsService.getById(id));

  if (error) return <Alert tone="error">{error.status === 404 ? 'Listing not found.' : error.message}</Alert>;
  if (!data) return <PageSpinner label="Loading listing" />;

  const ownerId = typeof data.listing.owner === 'object' ? data.listing.owner.id : data.listing.owner;
  if (ownerId !== user.id) return <Alert tone="error">You can only edit your own listings.</Alert>;

  const save = async (payload) => {
    await listingsService.update(id, payload);
    navigate('/host/listings', { state: { message: 'Your changes were saved.' } });
  };

  return <ListingForm listing={data.listing} onSubmit={save} />;
}

export default function ListingFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const create = async (payload, { publish }) => {
    await listingsService.create({ ...payload, isPublished: publish });
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
