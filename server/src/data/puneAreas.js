// Approximate centre points of Pune neighbourhoods, used to turn a typed
// area name ("Baner") into a map location for nearby-parking searches.
export const PUNE_AREAS = [
  { name: 'Baner', lat: 18.559, lng: 73.7868, pincode: '411045' },
  { name: 'Hinjawadi', lat: 18.5913, lng: 73.7389, pincode: '411057' },
  { name: 'Viman Nagar', lat: 18.5679, lng: 73.9143, pincode: '411014' },
  { name: 'Koregaon Park', lat: 18.5362, lng: 73.894, pincode: '411001' },
  { name: 'Kalyani Nagar', lat: 18.5463, lng: 73.9033, pincode: '411006' },
  { name: 'Shivajinagar', lat: 18.5308, lng: 73.8475, pincode: '411005' },
  { name: 'Wakad', lat: 18.5989, lng: 73.7603, pincode: '411057' },
  { name: 'Aundh', lat: 18.558, lng: 73.8075, pincode: '411007' },
  { name: 'Kothrud', lat: 18.5074, lng: 73.8077, pincode: '411038' },
  { name: 'Hadapsar', lat: 18.5089, lng: 73.926, pincode: '411028' },
];

const normalize = (value) => value.toLowerCase().replace(/[^a-z]/g, '');

/** Find a known area by name, forgiving case/spacing ("viman nagar", "VimanNagar"). */
export function findArea(query = '') {
  const needle = normalize(query);
  if (!needle) return null;
  return PUNE_AREAS.find((area) => normalize(area.name) === needle) ?? null;
}
