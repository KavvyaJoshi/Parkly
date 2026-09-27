import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-only-jwt-secret',
    },
    globalSetup: './src/tests/helpers/globalSetup.js',
    setupFiles: './src/tests/helpers/setupDb.js',
    // Allow time for the in-memory MongoDB binary to download on first run.
    hookTimeout: 120_000,
  },
});
