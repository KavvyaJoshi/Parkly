import { useEffect, useId, useMemo, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';

import { PHOTO_LIMITS, validatePhotoFiles } from '../../utils/images.js';

/**
 * Choose photos for a listing that doesn't exist yet. Files are kept locally
 * (with previews) and uploaded by the parent after the listing is created.
 */
export default function PhotoPicker({ files, onChange }) {
  const id = useId();
  const [error, setError] = useState('');

  // Object URLs for previews; revoked when files change or the picker unmounts.
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const addFiles = (e) => {
    const chosen = [...e.target.files];
    e.target.value = ''; // allow choosing the same file again later
    const problem = validatePhotoFiles(chosen, files.length);
    setError(problem);
    if (!problem) onChange([...files, ...chosen]);
  };

  return (
    <div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {files.map((file, index) => (
          <li key={`${file.name}-${index}`} className="relative">
            <img src={previews[index]} alt={`Selected photo ${index + 1}`} className="h-28 w-full rounded-xl object-cover" />
            {index === 0 && (
              <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-slate-800">
                Cover
              </span>
            )}
            <button
              type="button"
              onClick={() => onChange(files.filter((_, i) => i !== index))}
              aria-label={`Remove photo ${index + 1}`}
              className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 hover:bg-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </li>
        ))}
        {files.length < PHOTO_LIMITS.maxPerListing && (
          <li>
            <label
              htmlFor={`${id}-input`}
              className="flex h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 text-sm font-medium text-slate-600 hover:border-brand-400 hover:text-brand-700 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500"
            >
              <ImagePlus className="h-6 w-6" aria-hidden="true" />
              Add photos
              <input id={`${id}-input`} type="file" accept={PHOTO_LIMITS.accept} multiple onChange={addFiles} className="sr-only" />
            </label>
          </li>
        )}
      </ul>
      <p className="mt-2 text-sm text-slate-500">
        Up to {PHOTO_LIMITS.maxPerListing} photos, 5 MB each. The first one is the cover. Show the entrance and the spot itself.
      </p>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
