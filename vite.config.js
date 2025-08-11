import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(fileURLToPath(new URL('.', import.meta.url)), 'index.html'),
      },
      output: {
        manualChunks: {
          // Keep React ecosystem together
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Mantine UI components (kept empty once migration is complete)
          'vendor-mantine': [],
          // Icons
          'vendor-icons': ['@tabler/icons-react'],
          // Data processing libraries (excluding ExcelJS)
          'vendor-data': ['js-yaml', '@ltd/j-toml', 'ajv', 'ajv-formats', 'better-ajv-errors'],
          // UI utilities
          'vendor-ui': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities', '@svgdotjs/svg.js', 'html2canvas'],
          // Syntax highlighting
          'vendor-syntax': ['prismjs']
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
    // Increase chunk size warning limit to account for ExcelJS dynamic chunk
    chunkSizeWarningLimit: 1000,
    // Enable source maps for better debugging in production
    sourcemap: true,
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
  // Optimize dependencies and prevent React duplication
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react/jsx-runtime',
      'react-router-dom',
      // Mantine deps removed after migration
      '@tabler/icons-react'
    ],
    exclude: ['exceljs']
  },
  resolve: {
    // Ensure React consistency across chunks
    dedupe: ['react', 'react-dom', 'react-router-dom'],
    alias: {
      // Add @ alias for src directory
      '@': resolve(fileURLToPath(new URL('.', import.meta.url)), 'src'),
      // Ensure consistent React imports
      'react': resolve(fileURLToPath(new URL('.', import.meta.url)), 'node_modules/react'),
      'react-dom': resolve(fileURLToPath(new URL('.', import.meta.url)), 'node_modules/react-dom')
    }
  }
})
