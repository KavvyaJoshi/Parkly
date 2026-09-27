import mongoose from 'mongoose';

export async function connectDB(uri) {
  if (!uri) {
    console.warn('[db] MONGODB_URI is not set - starting without a database connection.');
    return null;
  }

  mongoose.set('strictQuery', true);
  const conn = await mongoose.connect(uri);
  console.log(`[db] Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
}

export function getDbStatus() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[mongoose.connection.readyState] ?? 'unknown';
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
