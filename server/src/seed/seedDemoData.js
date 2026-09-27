import crypto from 'node:crypto';

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
  await ParkingSpace.deleteMany({ isDemo: true });
  await User.deleteMany({ isDemo: true });

  const hosts = {};
  for (const host of DEMO_HOSTS) {
    hosts[host.key] = await User.create({
      name: host.name,
      email: host.email,
      password: crypto.randomBytes(24).toString('hex'),
      isDemo: true,
    });
  }

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
