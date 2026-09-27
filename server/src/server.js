import { createApp } from './app.js';
import { checkProductionConfig, env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';

async function start() {
  if (env.isProduction) {
    const { missing, warnings } = checkProductionConfig();
    warnings.forEach((warning) => console.warn(`[config] ${warning}`));
    if (missing.length) {
      console.error(`[config] Missing required environment variables: ${missing.join(', ')}`);
      process.exit(1);
    }
  }

  try {
    await connectDB(env.mongoUri);
  } catch (err) {
    console.error('[db] Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`[server] Parkly API listening on http://localhost:${env.port} (${env.nodeEnv})`);
    console.log(`[server] Allowed browser origins (CORS): ${env.clientUrls.join(', ')}`);
  });

  const shutdown = (signal) => {
    console.log(`[server] ${signal} received, shutting down...`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();
