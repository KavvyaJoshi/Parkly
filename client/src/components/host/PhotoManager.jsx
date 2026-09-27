import { useId, useState } from 'react';
import { ImagePlus, Star, Trash2 } from 'lucide-react';

import Alert from '../ui/Alert.jsx';
import Spinner from '../ui/Spinner.jsx';
import { listingsService } from '../../services/listings.service.js';
import { PHOTO_LIMITS, imageUrl, validatePhotoFiles } from '../../utils/images.js';

/** Upload, delete and choose the cover photo for an existing listing. Changes save immediately. */
export default function PhotoManager({ listing, onChange }) {
  const id = useId();
  const photos = listing.photos ?? [];
  const [busy, setBusy] = useState(null); // 'upload' | photo id
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const run = async (busyKey, action, successMessage) => {
    setBusy(busyKey);
    setError('');
    setStatus('');
    try {
      const { listing: updated } = await action();
      onChange(updated);
      setStatus(successMessage);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const addFiles = (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    const problem = validatePhotoFiles(files, photos.length);
    if (problem) {
      setError(problem);
      return;
    }
    run(
      'upload',
      () => listingsService.uploadPhotos(listing.id, files),
      `${files.length} photo${files.length === 1 ? '' : 's'} added.`,
    );
  };

  const makeCover = (photoId) =>
    run(
      photoId,
      () => listingsService.reorderPhotos(listing.id, [photoId, ...photos.map((p) => p.id).filter((pid) => pid !== photoId)]),
      'Cover photo updated.',
    );

  const remove = (photoId) => run(photoId, () => listingsService.deletePhoto(listing.id, photoId), 'Photo removed.');

  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 sm:p-8" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="text-lg font-semibold text-slate-900">
        Photos
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Listings with clear photos of the entrance and the spot get more bookings. Changes here save straight away.
      </p>

      {error && (
        <Alert tone="error" className="mt-4">
          {error}
        </Alert>
      )}
      <p className="sr-only" role="status">
        {status}
      </p>

      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {photos.map((photo, index) => (
          <li key={photo.id} className={`relative ${busy === photo.id ? 'opacity-50' : ''}`}>
            <img src={imageUrl(photo.url, 'thumb')} alt={`Photo ${index + 1}`} className="h-28 w-full rounded-xl object-cover" />
            {index === 0 ? (
              <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-slate-800">
                Cover
              </span>
            ) : (
              <button
                type="button"
                onClick={() => makeCover(photo.id)}
                disabled={Boolean(busy)}
                aria-label={`Make photo ${index + 1} the cover`}
                className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-slate-800 hover:bg-white"
              >
                <Star className="h-3 w-3" aria-hidden="true" />
                Make cover
              </button>
            )}
            <button
              type="button"
              onClick={() => remove(photo.id)}
              disabled={Boolean(busy)}
              aria-label={`Delete photo ${index + 1}`}
              className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-700 hover:bg-white"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </li>
        ))}

        {photos.length < PHOTO_LIMITS.maxPerListing && (
          <li>
            <label
              htmlFor={`${id}-input`}
              className={`flex h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 text-sm font-medium text-slate-600 hover:border-brand-400 hover:text-brand-700 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500 ${
                busy ? 'pointer-events-none opacity-60' : ''
              }`}
            >
              {busy === 'upload' ? <Spinner className="h-6 w-6" /> : <ImagePlus className="h-6 w-6" aria-hidden="true" />}
              {busy === 'upload' ? 'Uploading…' : 'Add photos'}
              <input
                id={`${id}-input`}
                type="file"
                accept={PHOTO_LIMITS.accept}
                multiple
                disabled={Boolean(busy)}
                onChange={addFiles}
                className="sr-only"
              />
            </label>
          </li>
        )}
      </ul>
      <p className="mt-2 text-sm text-slate-500">
        {photos.length} of {PHOTO_LIMITS.maxPerListing} photos · JPG, PNG, WebP or HEIC, up to 5 MB each.
      </p>
    </section>
  );
}
