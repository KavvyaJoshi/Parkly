import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

import { Booking } from '../models/Booking.js';
import { ParkingSpace } from '../models/ParkingSpace.js';
import { User } from '../models/User.js';
import { PUNE_AREAS } from '../data/puneAreas.js';
import { DEMO_HOSTS, DEMO_LISTINGS, SCHEDULES } from './demoListings.js';

const round = (n) => Math.round(n * 1e6) / 1e6;

/**
 * Replace all demo hosts and demo listings. Real users and their listings are never touched.
 * Demo hosts get random passwords, so nobody can log in as them.
 */
export async function seedDemoData() {
  // Test bookings on demo spaces would point at spaces that no longer exist.
  await Booking.deleteMany({ isDemo: true });
  await ParkingSpace.deleteMany({ isDemo: true });
  await User.deleteMany({ isDemo: true });

  // Demo hosts share one hash of a random, never-stored password: nobody can log in as them,
  // and hashing once (instead of per host) keeps seeding fast. insertMany skips the
  // User pre-save hook, so the value is stored as-is.
  const unusablePasswordHash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 12);
  const createdHosts = await User.insertMany(
    DEMO_HOSTS.map((host) => ({
      name: host.name,
      email: host.email,
      password: unusablePasswordHash,
      isDemo: true,
    })),
  );
  const hosts = Object.fromEntries(DEMO_HOSTS.map((host, i) => [host.key, createdHosts[i]]));

  const areaByName = Object.fromEntries(PUNE_AREAS.map((area) => [area.name, area]));

  const documents = DEMO_LISTINGS.map((listing) => {
    const area = areaByName[listing.area];
    const [dLat, dLng] = listing.offset;
    return {
      owner: hosts[listing.host]._id,
      title: listing.title,
      description: listing.description,
      spaceType: listing.spaceType,
      vehicleSize: listing.vehicleSize,
      address: {
        line1: listing.line1,
        area: listing.area,
        landmark: listing.landmark,
        city: 'Pune',
        pincode: area.pincode,
      },
      location: { type: 'Point', coordinates: [round(area.lng + dLng), round(area.lat + dLat)] },
      pricePerHour: listing.pricePerHour,
      amenities: listing.amenities,
      rules: listing.rules,
      availability: SCHEDULES[listing.schedule],
      isPublished: true,
      isDemo: true,
    };
  });

  const spaces = await ParkingSpace.insertMany(documents);
  return { hosts: Object.keys(hosts).length, listings: spaces.length };
}
