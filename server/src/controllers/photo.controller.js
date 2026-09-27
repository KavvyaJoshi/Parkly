import { PHOTO_LIMITS } from '../constants/listing.js';
import { serializeSpace } from '../models/ParkingSpace.js';
import { imageStorage } from '../services/imageStorage.js';
import { AppError } from '../utils/AppError.js';
import { findOwnedSpace } from './listing.controller.js';

/** POST /api/listings/:id/photos — multipart `photos` (1–8 images). */
export async function uploadListingPhotos(req, res) {
  const space = await findOwnedSpace(req.params.id, req.user);
  const files = req.files ?? [];

  if (files.length === 0) throw new AppError('Choose at least one photo to upload', 400);
  if (space.photos.length + files.length > PHOTO_LIMITS.maxPerListing) {
    const remaining = PHOTO_LIMITS.maxPerListing - space.photos.length;
    throw new AppError(
      remaining > 0
        ? `You can add ${remaining} more photo${remaining === 1 ? '' : 's'} (max ${PHOTO_LIMITS.maxPerListing} per space)`
        : `This space already has the maximum of ${PHOTO_LIMITS.maxPerListing} photos`,
      400,
    );
  }
  if (!imageStorage.isConfigured()) {
    throw new AppError('Photo uploads aren’t set up on this server yet', 503);
  }

  const uploaded = [];
  try {
    for (const file of files) {
      uploaded.push(await imageStorage.upload(file.buffer, { folder: `parkly/listings/${space._id}` }));
    }
  } catch (err) {
    // Don't leave half an upload behind.
    await Promise.all(uploaded.map((photo) => imageStorage.destroy(photo.publicId)));
    console.error('[images] Upload failed:', err.message);
    throw new AppError('Photo upload failed. Please try again.', 502);
  }

  space.photos.push(...uploaded);
  await space.save();
  res.status(201).json({ success: true, listing: serializeSpace(space, { exact: true }) });
}

/** DELETE /api/listings/:id/photos/:photoId */
export async function deleteListingPhoto(req, res) {
  const space = await findOwnedSpace(req.params.id, req.user);
  const photo = space.photos.id(req.params.photoId);
  if (!photo) throw new AppError('Photo not found', 404);

  const { publicId } = photo;
  photo.deleteOne();
  await space.save();
  await imageStorage.destroy(publicId);

  res.json({ success: true, listing: serializeSpace(space, { exact: true }) });
}

/** PUT /api/listings/:id/photos/order — body { photoIds: [...] }; the first becomes the cover. */
export async function reorderListingPhotos(req, res) {
  const space = await findOwnedSpace(req.params.id, req.user);
  const { photoIds } = req.body;

  const current = space.photos.map((photo) => photo._id.toString());
  const isPermutation =
    photoIds.length === current.length && new Set(photoIds).size === current.length && photoIds.every((id) => current.includes(id));
  if (!isPermutation) throw new AppError('The photo order must include each of this space’s photos exactly once', 400);

  const byId = new Map(space.photos.map((photo) => [photo._id.toString(), photo.toObject()]));
  space.photos = photoIds.map((id) => byId.get(id));
  await space.save();

  res.json({ success: true, listing: serializeSpace(space, { exact: true }) });
}
