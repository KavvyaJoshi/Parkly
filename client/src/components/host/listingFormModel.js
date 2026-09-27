import { PUNE_AREAS, SERVICE_AREA } from '../../data/areas.js';

export const ALL_DAYS = [1, 2, 3, 4, 5, 6, 0]; // Monday-first for display
export const DAY_LABELS = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };

const areaByName = (name) => PUNE_AREAS.find((a) => a.name === name);

/** Form state for a new listing, or one pre-filled from an existing listing (owner view). */
export function initialFormValues(listing) {
  if (!listing) {
    const area = PUNE_AREAS[0];
    return {
      title: '',
      description: '',
      spaceType: 'society',
      vehicleSize: 'sedan',
      area: area.name,
      line1: '',
      landmark: '',
      pincode: area.pincode,
      lat: String(area.lat),
      lng: String(area.lng),
      locationSource: 'area',
      pricePerHour: '40',
      is24x7: false,
      days: [1, 2, 3, 4, 5, 6],
      startTime: '08:00',
      endTime: '20:00',
      amenities: [],
      rulesText: '',
    };
  }

  return {
    title: listing.title,
    description: listing.description ?? '',
    spaceType: listing.spaceType,
    vehicleSize: listing.vehicleSize,
    area: listing.address.area,
    line1: listing.address.line1 ?? '',
    landmark: listing.address.landmark ?? '',
    pincode: listing.address.pincode,
    lat: String(listing.location.lat),
    lng: String(listing.location.lng),
    locationSource: 'saved',
    pricePerHour: String(listing.pricePerHour),
    is24x7: listing.availability.is24x7,
    days: listing.availability.days,
    startTime: listing.availability.startTime,
    endTime: listing.availability.endTime,
    amenities: listing.amenities,
    rulesText: listing.rules.join('\n'),
  };
}

/** When the area changes, move a pin/PIN that still point at the old area's defaults. */
export function applyAreaChange(values, nextAreaName) {
  const prev = areaByName(values.area);
  const next = areaByName(nextAreaName);
  const updated = { ...values, area: nextAreaName };
  if (!next) return updated;
  if (values.locationSource === 'area') {
    updated.lat = String(next.lat);
    updated.lng = String(next.lng);
  }
  if (!values.pincode || values.pincode === prev?.pincode) updated.pincode = next.pincode;
  return updated;
}

const rulesFrom = (text) =>
  text
    .split('\n')
    .map((rule) => rule.trim())
    .filter(Boolean);

export function validateListing(v) {
  const errors = {};
  if (v.title.trim().length < 5) errors.title = 'Give your space a title of at least 5 characters';
  if (v.line1.trim().length < 5) errors.line1 = 'Enter the street address';
  if (!/^[1-9]\d{5}$/.test(v.pincode.trim())) errors.pincode = 'Enter a valid 6-digit PIN code';

  const lat = Number(v.lat);
  const lng = Number(v.lng);
  const inPune =
    lat >= SERVICE_AREA.minLat && lat <= SERVICE_AREA.maxLat && lng >= SERVICE_AREA.minLng && lng <= SERVICE_AREA.maxLng;
  if (!v.lat || !v.lng || Number.isNaN(lat) || Number.isNaN(lng) || !inPune) {
    errors.location = 'The map pin must be inside Pune';
  }

  const price = Number(v.pricePerHour);
  if (!Number.isInteger(price) || price < 10 || price > 1000) {
    errors.pricePerHour = 'Enter a whole-rupee price between ₹10 and ₹1,000';
  }

  if (!v.is24x7) {
    if (v.days.length === 0) errors.days = 'Choose at least one day';
    if (v.startTime >= v.endTime) errors.endTime = 'Closing time must be after opening time';
  }
  if (rulesFrom(v.rulesText).length > 10) errors.rulesText = 'Add up to 10 rules';
  return errors;
}

/** Convert form state into the API payload. */
export function toPayload(v) {
  return {
    title: v.title.trim(),
    description: v.description.trim(),
    spaceType: v.spaceType,
    vehicleSize: v.vehicleSize,
    address: {
      line1: v.line1.trim(),
      area: v.area,
      pincode: v.pincode.trim(),
      ...(v.landmark.trim() && { landmark: v.landmark.trim() }),
    },
    location: { lat: Number(v.lat), lng: Number(v.lng) },
    pricePerHour: Number(v.pricePerHour),
    amenities: v.amenities,
    rules: rulesFrom(v.rulesText),
    availability: v.is24x7
      ? { is24x7: true, days: [0, 1, 2, 3, 4, 5, 6], startTime: '00:00', endTime: '23:59' }
      : { is24x7: false, days: v.days, startTime: v.startTime, endTime: v.endTime },
  };
}

// API field paths -> form field names, for showing server-side errors in the right place.
const SERVER_FIELD_MAP = {
  'address.line1': 'line1',
  'address.pincode': 'pincode',
  'address.landmark': 'landmark',
  'address.area': 'area',
  'location.lat': 'location',
  'location.lng': 'location',
  'availability.days': 'days',
  'availability.endTime': 'endTime',
  'availability.startTime': 'endTime',
  rules: 'rulesText',
};

export function mapServerErrors(fieldErrors) {
  const mapped = {};
  Object.entries(fieldErrors).forEach(([field, message]) => {
    const key = SERVER_FIELD_MAP[field] ?? field.split('.')[0];
    mapped[key] ??= message;
  });
  return mapped;
}
