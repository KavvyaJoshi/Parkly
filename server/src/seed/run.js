// Usage: npm run seed
// Adds (or refreshes) the demo hosts and demo Pune listings in the database from MONGODB_URI.
import mongoose from 'mongoose';

import { env } from '../config/env.js';
import { connectDB } from '../config/db.js';
import { seedDemoData } from './seedDemoData.js';

if (!env.mongoUri) {
  console.error('[seed] MONGODB_URI is not set. Add it to server/.env first.');
  process.exit(1);
}

try {
  await connectDB(env.mongoUri);
  await mongoose.connection.syncIndexes();
  const result = await seedDemoData();
  console.log(`[seed] Done: ${result.listings} demo listings from ${result.hosts} demo hosts.`);
} catch (err) {
  console.error('[seed] Failed:', err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
