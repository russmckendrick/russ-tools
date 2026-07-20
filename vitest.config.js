import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  test: {
    environment: 'node',
    // jsdom needs a real origin or it has no localStorage (opaque origins
    // carry no storage), and the lookup-tool tests exercise the storage shim.
    environmentOptions: {
      jsdom: { url: 'http://localhost/' },
    },
    // Repoints Node's experimental localStorage global at jsdom's — see the
    // comment in the setup file; without it storage tests no-op silently.
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
});
