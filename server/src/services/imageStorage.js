import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';

// Image storage backed by Cloudinary. Kept behind this small interface
// (isConfigured / upload / destroy) so the rest of the app — and the tests —
// don't depend on Cloudinary directly.

const { cloudName, apiKey, apiSecret } = env.cloudinary;
const configured = Boolean(cloudName && apiKey && apiSecret);

if (configured) {
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
}

export const imageStorage = {
  isConfigured: () => configured,

  /** Upload an image buffer. Resolves to { url, publicId }. */
  upload(buffer, { folder }) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          // Store at most 1600px on the long edge; originals from phones can be 4000px+.
          transformation: [{ width: 1600, height: 1600, crop: 'limit' }],
        },
        (err, result) => (err ? reject(err) : resolve({ url: result.secure_url, publicId: result.public_id })),
      );
      stream.end(buffer);
    });
  },

  /** Delete an image. Failures are logged, not thrown: a leftover file shouldn't break the user's action. */
  async destroy(publicId) {
    if (!publicId || !configured) return;
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    } catch (err) {
      console.warn(`[images] Could not delete ${publicId}: ${err.message}`);
    }
  },
};
