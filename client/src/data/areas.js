// Pune neighbourhoods Parkly currently serves.
// `fromPrice` values are indicative demo rates (INR per hour), not live prices.
// lat/lng are approximate area centres, used as a starting pin for new listings.
export const PUNE_AREAS = [
  { name: 'Baner', description: 'Offices, cafés and Baner–Balewadi High Street', fromPrice: 30, lat: 18.559, lng: 73.7868, pincode: '411045' },
  { name: 'Hinjawadi', description: 'Rajiv Gandhi Infotech Park, Phases 1–3', fromPrice: 20, lat: 18.5913, lng: 73.7389, pincode: '411057' },
  { name: 'Viman Nagar', description: 'Near Pune Airport and Phoenix Marketcity', fromPrice: 35, lat: 18.5679, lng: 73.9143, pincode: '411014' },
  { name: 'Koregaon Park', description: 'North Main Road, restaurants and nightlife', fromPrice: 60, lat: 18.5362, lng: 73.894, pincode: '411001' },
  { name: 'Kalyani Nagar', description: 'Business parks and Central Avenue', fromPrice: 35, lat: 18.5463, lng: 73.9033, pincode: '411006' },
  { name: 'Shivajinagar', description: 'FC Road, colleges and the district court', fromPrice: 40, lat: 18.5308, lng: 73.8475, pincode: '411005' },
  { name: 'Wakad', description: 'Residential hub off the Mumbai–Bengaluru Highway', fromPrice: 20, lat: 18.5989, lng: 73.7603, pincode: '411057' },
  { name: 'Aundh', description: 'ITI Road shopping and DP Road', fromPrice: 35, lat: 18.558, lng: 73.8075, pincode: '411007' },
  { name: 'Kothrud', description: 'Karve Road, Paud Road and nearby colleges', fromPrice: 25, lat: 18.5074, lng: 73.8077, pincode: '411038' },
  { name: 'Hadapsar', description: 'Magarpatta City and Amanora', fromPrice: 20, lat: 18.5089, lng: 73.926, pincode: '411028' },
];

export const DURATION_OPTIONS = [1, 2, 3, 4, 6, 8, 12];

// Listings must be inside this box (mirrors the API's service area).
export const SERVICE_AREA = { minLat: 18.35, maxLat: 18.75, minLng: 73.65, maxLng: 74.05 };
