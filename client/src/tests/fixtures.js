export function makeListing(overrides = {}) {
  return {
    id: 'l1',
    title: 'Covered society parking near Baner–Balewadi High Street',
    description: 'Basement slot in a gated society.',
    spaceType: 'society',
    vehicleSize: 'suv',
    address: { area: 'Baner', landmark: 'Near Balewadi High Street', city: 'Pune', pincode: '411045' },
    location: { lat: 18.561, lng: 73.79 },
    isExactLocation: false,
    pricePerHour: 40,
    amenities: ['covered', 'cctv', 'security_guard', 'gated', 'ev_charging'],
    rules: ['Show your booking to the security guard'],
    photos: [],
    availability: { is24x7: false, days: [1, 2, 3, 4, 5, 6], startTime: '08:00', endTime: '20:00' },
    isPublished: true,
    isDemo: true,
    owner: { id: 'host1', name: 'Anjali Patwardhan', memberSince: '2026-01-10T00:00:00.000Z' },
    distanceMeters: 450,
    ...overrides,
  };
}

export function searchResponse(listings, overrides = {}) {
  return {
    success: true,
    listings,
    pagination: { page: 1, limit: 12, total: listings.length, totalPages: 1 },
    center: { lat: 18.559, lng: 73.7868, label: 'Baner' },
    sort: 'distance',
    ...overrides,
  };
}
