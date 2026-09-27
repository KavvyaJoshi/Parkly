import { useState } from 'react';

import ListingPhoto from './ListingPhoto.jsx';
import { imageUrl } from '../../utils/images.js';

/** Large main photo with clickable thumbnails. Falls back to the placeholder when there are no photos. */
export default function PhotoGallery({ listing }) {
  const photos = listing.photos ?? [];
  const [selected, setSelected] = useState(0);

  if (photos.length === 0) {
    return <ListingPhoto listing={listing} priority className="h-64 w-full rounded-3xl sm:h-96" />;
  }

  const current = photos[Math.min(selected, photos.length - 1)];

  return (
    <div className="space-y-3">
      <img
        src={imageUrl(current.url, 'hero')}
        alt={`${listing.title} — photo ${selected + 1} of ${photos.length}`}
        fetchPriority="high"
        className="h-64 w-full rounded-3xl bg-slate-100 object-cover sm:h-[28rem]"
      />
      {photos.length > 1 && (
        <ul className="flex gap-3 overflow-x-auto pb-1" aria-label="Photos">
          {photos.map((photo, index) => (
            <li key={photo.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setSelected(index)}
                aria-label={`Show photo ${index + 1}`}
                aria-pressed={index === selected}
                className={`block overflow-hidden rounded-xl ring-2 transition ${
                  index === selected ? 'ring-brand-600' : 'ring-transparent opacity-80 hover:opacity-100'
                }`}
              >
                <img src={imageUrl(photo.url, 'thumb')} alt="" loading="lazy" className="h-16 w-24 object-cover sm:h-20 sm:w-28" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
