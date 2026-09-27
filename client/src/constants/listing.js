import { Camera, Lightbulb, Lock, ShieldCheck, Umbrella, Zap } from 'lucide-react';

export const SPACE_TYPES = {
  driveway: 'Private driveway',
  society: 'Society parking',
  garage: 'Garage',
  commercial: 'Commercial / office',
  open_lot: 'Open lot',
};

export const VEHICLE_SIZES = {
  hatchback: 'Hatchback',
  sedan: 'Sedan',
  suv: 'SUV',
};

// A space rated for a size also fits smaller vehicles.
export const VEHICLE_FITS = {
  hatchback: 'Fits a hatchback',
  sedan: 'Fits up to a sedan',
  suv: 'Fits up to an SUV',
};

export const AMENITIES = {
  covered: { label: 'Covered', icon: Umbrella },
  cctv: { label: 'CCTV', icon: Camera },
  security_guard: { label: 'Security guard', icon: ShieldCheck },
  gated: { label: 'Gated', icon: Lock },
  ev_charging: { label: 'EV charging', icon: Zap },
  well_lit: { label: 'Well lit', icon: Lightbulb },
};

export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Recommended' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'distance', label: 'Distance' },
  { value: 'newest', label: 'Newest' },
];

export const PRICE_OPTIONS = [20, 30, 40, 50, 60, 80, 100];

export const RADIUS_OPTIONS = [1, 3, 5, 10];
