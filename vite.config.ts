import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: ['localhost', '127.0.0.1'],
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  optimizeDeps: {
    include: ['socket.io-client'],
    force: false,
  },
  build: {
    // Modern browsers only — smaller output, no legacy polyfills.
    target: 'es2020',
    sourcemap: false,
    cssCodeSplit: true,
    // Flag oversized chunks so they're obvious in CI output.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Split heavy, page-specific libs out of the main bundle so
        // the landing / mentors routes don't pay for recharts or admin code.
        manualChunks: (id) => {
          if (!id.includes('node_modules')) {
            // Keep the admin console out of the main app bundle.
            if (id.includes('/src/pages/admin/console/')) {
              return 'admin-console';
            }
            if (id.includes('/src/pages/mentor/console/')) {
              return 'mentor-console';
            }
            return undefined;
          }
          if (id.includes('recharts') || id.includes('d3-')) return 'recharts';
          if (id.includes('@sentry/')) return 'sentry';
          if (id.includes('antd') || id.includes('@ant-design/')) return 'antd';
          if (id.includes('socket.io')) return 'socket';
          if (id.includes('lucide-react') || id.includes('@fortawesome/')) {
            return 'icons';
          }
          if (
            id.includes('dayjs') ||
            id.includes('react-router') ||
            id.includes('react-redux') ||
            id.includes('@reduxjs/toolkit')
          ) {
            return 'vendor-core';
          }
          return undefined;
        },
      },
    },
  },
});
