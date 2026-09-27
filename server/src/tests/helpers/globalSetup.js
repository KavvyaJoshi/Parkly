import { MongoMemoryServer } from 'mongodb-memory-server';

// Starts one MongoDB for the whole test run.
// CI provides a real MongoDB service via MONGODB_TEST_URI; locally we spin up
// an in-memory MongoDB so no database installation is needed.
export default async function setup({ provide }) {
  if (process.env.MONGODB_TEST_URI) {
    provide('mongoUri', process.env.MONGODB_TEST_URI);
    return undefined;
  }

  const mongod = await MongoMemoryServer.create();
  provide('mongoUri', mongod.getUri());

  return async () => {
    await mongod.stop();
  };
}
