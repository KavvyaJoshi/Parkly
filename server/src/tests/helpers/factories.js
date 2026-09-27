import { User } from '../../models/User.js';
import { signToken } from '../../utils/token.js';

let counter = 0;

/** Create a user directly in the database and return it with a valid auth header. */
export async function createUser(overrides = {}) {
  counter += 1;
  const user = await User.create({
    name: `Test User ${counter}`,
    email: `user${counter}@example.com`,
    password: 'parkly123',
    ...overrides,
  });
  return { user, auth: `Bearer ${signToken(user._id)}` };
}

/** A valid create-listing payload in Baner; override any field. */
export function listingPayload(overrides = {}) {
  return {
    title: 'Covered parking near Baner Road',
    description: 'Test space',
    spaceType: 'society',
    vehicleSize: 'sedan',
    address: { line1: 'Lane 5, Baner Road', area: 'Baner', pincode: '411045' },
    location: { lat: 18.56, lng: 73.787 },
    pricePerHour: 40,
    amenities: ['covered', 'cctv'],
    rules: ['No overnight parking'],
    availability: { is24x7: false, days: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '19:00' },
    isPublished: true,
    ...overrides,
  };
}
