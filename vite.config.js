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
          // Vendor chunks for large libraries
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-mantine-core': ['@mantine/core'],
          'vendor-mantine-extended': [
            '@mantine/hooks', 
            '@mantine/notifications', 
            '@mantine/dropzone',
            '@mantine/dates'
          ],
          'vendor-icons': ['@tabler/icons-react'],
          'vendor-utils': [
            'dayjs', 
            'uuid', 
            'netmask', 
            'jwt-decode',
            'jose'
          ],
          'vendor-data': [
            'js-yaml', 
            '@iarna/toml', 
            'ajv', 
            'ajv-formats',
            'better-ajv-errors',
            'json-parse-even-better-errors',
            'json-source-map',
            'js-yaml-source-map'
          ],
          'vendor-ui': [
            '@dnd-kit/core',
            '@dnd-kit/sortable', 
            '@dnd-kit/utilities',
            '@svgdotjs/svg.js',
            'html2canvas'
          ],
          'vendor-syntax': ['prismjs']
        },
        // Optimize chunk sizes
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop().replace('.jsx', '').replace('.js', '') : 'chunk';
          return `js/[name]-[hash].js`;
        },
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
