import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
  // Ensure JSON files are properly handled
  json: {
    stringify: true
  },
  // Add global polyfill for Node.js libraries
  define: {
    global: 'globalThis',
  }
})
