export const SPACE_TYPES = ['driveway', 'society', 'garage', 'commercial', 'open_lot'];

// Largest vehicle a space fits, smallest to largest. A space that fits an SUV also fits a sedan.
export const VEHICLE_SIZES = ['hatchback', 'sedan', 'suv'];

export const AMENITIES = ['covered', 'cctv', 'security_guard', 'gated', 'ev_charging', 'well_lit'];

export const PRICE_LIMITS = { min: 10, max: 1000 };

// Parkly currently operates in Pune only; listings must fall inside this box.
export const SERVICE_AREA = {
  name: 'Pune',
  minLat: 18.35,
  maxLat: 18.75,
  minLng: 73.65,
  maxLng: 74.05,
};

export const PHOTO_LIMITS = {
  maxPerListing: 8,
  maxFileBytes: 5 * 1024 * 1024,
  // HEIC/HEIF covers photos taken on iPhones; Cloudinary converts them for delivery.
  mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
};

export const SEARCH_DEFAULTS = { radiusKm: 3, maxRadiusKm: 25, limit: 12, maxLimit: 50 };
