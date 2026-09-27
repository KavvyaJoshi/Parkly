import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
    css: false,
    // Form tests simulate real typing, which is slow on busy machines and shared CI
    // runners; the 5s default leaves too little headroom.
    testTimeout: 15_000,
  },
});
