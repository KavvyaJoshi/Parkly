import multer from 'multer';

import { PHOTO_LIMITS } from '../constants/listing.js';
import { AppError } from '../utils/AppError.js';

const maxMb = PHOTO_LIMITS.maxFileBytes / (1024 * 1024);

const parser = multer({
  // Files are held in memory only long enough to stream them to Cloudinary.
  storage: multer.memoryStorage(),
  limits: { fileSize: PHOTO_LIMITS.maxFileBytes, files: PHOTO_LIMITS.maxPerListing },
  fileFilter(req, file, cb) {
    if (PHOTO_LIMITS.mimeTypes.includes(file.mimetype)) return cb(null, true);
    return cb(new AppError('Photos must be JPG, PNG, WebP or HEIC images', 400));
  },
}).array('photos', PHOTO_LIMITS.maxPerListing);

const MULTER_MESSAGES = {
  LIMIT_FILE_SIZE: `Each photo must be under ${maxMb} MB`,
  LIMIT_FILE_COUNT: `You can upload up to ${PHOTO_LIMITS.maxPerListing} photos at a time`,
  LIMIT_UNEXPECTED_FILE: `You can upload up to ${PHOTO_LIMITS.maxPerListing} photos at a time`,
};

/** Parse multipart `photos` fields into req.files, turning multer errors into friendly 400s. */
export function uploadPhotos(req, res, next) {
  parser(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return next(new AppError(MULTER_MESSAGES[err.code] ?? 'Upload failed', 400));
    }
    return next(err);
  });
}
