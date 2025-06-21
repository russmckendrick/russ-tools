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
      output: {
        manualChunks: (id) => {
          // Vendor chunks for large libraries
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('@mantine/core')) {
              return 'vendor-mantine-core';
            }
            if (id.includes('@mantine/')) {
              return 'vendor-mantine-extended';
            }
            if (id.includes('@tabler/icons-react')) {
              return 'vendor-icons';
            }
            if (id.includes('prismjs')) {
              return 'vendor-syntax';
            }
            if (id.includes('js-yaml') || id.includes('@iarna/toml') || id.includes('ajv')) {
              return 'vendor-data';
            }
            if (id.includes('@dnd-kit') || id.includes('@svgdotjs') || id.includes('html2canvas')) {
              return 'vendor-ui';
            }
            // Default vendor chunk for other node_modules
            return 'vendor';
          }
        },
        // Optimize chunk sizes
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `img/[name]-[hash].${ext}`;
          }
          if (/\.(css)$/i.test(assetInfo.name)) {
            return `css/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        }
      }
    },
    // Increase chunk size warning limit since we're now splitting appropriately
    chunkSizeWarningLimit: 600,
    // Enable source maps for better debugging
    sourcemap: false,
    // Optimize build performance
    target: 'esnext',
    minify: 'esbuild'
  },
  // Ensure JSON files are properly handled
  json: {
    stringify: true
  },
  // Add global polyfill for Node.js libraries
  define: {
    global: 'globalThis',
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      '@mantine/core',
      '@mantine/hooks',
      '@tabler/icons-react'
    ],
    exclude: ['@iarna/toml']
  }
})
