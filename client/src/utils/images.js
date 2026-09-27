// Cloudinary can resize and re-encode images on the fly via URL transformations.
// We request exactly the size each place needs, in the best format the browser supports.

const SIZES = {
  thumb: 'c_fill,g_auto,w_240,h_180',
  card: 'c_fill,g_auto,w_640,h_440',
  hero: 'c_fill,g_auto,w_1600,h_900',
};

/** Add a Cloudinary transformation to an image URL. Non-Cloudinary URLs are returned unchanged. */
export function imageUrl(url, size = 'card') {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  return url.replace('/upload/', `/upload/${SIZES[size]},q_auto,f_auto/`);
}

export const PHOTO_LIMITS = {
  maxPerListing: 8,
  maxFileBytes: 5 * 1024 * 1024,
  accept: 'image/jpeg,image/png,image/webp,image/heic,image/heif',
};

const ALLOWED_TYPES = PHOTO_LIMITS.accept.split(',');

/** Check chosen files before uploading. Returns an error message, or '' if all are fine. */
export function validatePhotoFiles(files, existingCount = 0) {
  if (existingCount + files.length > PHOTO_LIMITS.maxPerListing) {
    const remaining = PHOTO_LIMITS.maxPerListing - existingCount;
    return remaining > 0
      ? `You can add ${remaining} more photo${remaining === 1 ? '' : 's'} (max ${PHOTO_LIMITS.maxPerListing}).`
      : `You’ve reached the maximum of ${PHOTO_LIMITS.maxPerListing} photos.`;
  }
  const badType = files.find((f) => !ALLOWED_TYPES.includes(f.type));
  if (badType) return `“${badType.name}” isn’t a supported image. Use JPG, PNG, WebP or HEIC.`;
  const tooBig = files.find((f) => f.size > PHOTO_LIMITS.maxFileBytes);
  if (tooBig) return `“${tooBig.name}” is larger than 5 MB.`;
  return '';
}
