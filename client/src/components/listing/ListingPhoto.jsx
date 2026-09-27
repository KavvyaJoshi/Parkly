import { SquareParking } from 'lucide-react';
import { SPACE_TYPES } from '../../constants/listing.js';
import { imageUrl } from '../../utils/images.js';

const PLACEHOLDER_TONES = {
  driveway: 'from-amber-100 to-orange-200 text-orange-700',
  society: 'from-brand-100 to-violet-200 text-brand-700',
  garage: 'from-slate-100 to-slate-300 text-slate-700',
  commercial: 'from-sky-100 to-cyan-200 text-sky-700',
  open_lot: 'from-emerald-100 to-teal-200 text-emerald-700',
};

/** First listing photo, or a branded placeholder by space type until photos are uploaded. */
export default function ListingPhoto({ listing, className = '', priority = false, size = 'card' }) {
  const photo = listing.photos?.[0];

  if (photo) {
    return (
      <img
        src={imageUrl(photo.url, size)}
        alt={listing.title}
        className={`object-cover ${className}`}
        loading={priority ? undefined : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
      />
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 bg-gradient-to-br ${PLACEHOLDER_TONES[listing.spaceType] ?? PLACEHOLDER_TONES.garage} ${className}`}
      role="img"
      aria-label={`${SPACE_TYPES[listing.spaceType]} — no photos yet`}
    >
      <SquareParking className="h-10 w-10 opacity-70" aria-hidden="true" />
      <span className="text-xs font-semibold tracking-wide uppercase opacity-70">
        {SPACE_TYPES[listing.spaceType]}
      </span>
    </div>
  );
}
