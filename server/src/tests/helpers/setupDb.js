import { afterAll, afterEach, beforeAll, inject } from 'vitest';
import mongoose from 'mongoose';

// Each test file gets its own database so files can run in parallel safely.
const dbName = `parkly_test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

beforeAll(async () => {
  await mongoose.connect(inject('mongoUri'), { dbName });
  await mongoose.connection.syncIndexes();
});

afterEach(async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
