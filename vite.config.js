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
        manualChunks: {
          // Keep React ecosystem together
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Mantine UI components
          'vendor-mantine': ['@mantine/core', '@mantine/hooks', '@mantine/notifications', '@mantine/dates', '@mantine/dropzone'],
          // Icons
          'vendor-icons': ['@tabler/icons-react'],
          // Data processing libraries
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
    // Increase chunk size warning limit since we're now splitting appropriately
    chunkSizeWarningLimit: 800,
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
      '@mantine/core',
      '@mantine/hooks',
      '@mantine/notifications',
      '@tabler/icons-react'
    ],
    exclude: ['exceljs']
  },
  resolve: {
    // Ensure React consistency across chunks
    dedupe: ['react', 'react-dom', 'react-router-dom'],
    alias: {
      // Ensure consistent React imports
      'react': resolve(__dirname, 'node_modules/react'),
      'react-dom': resolve(__dirname, 'node_modules/react-dom')
    }
  }
})
