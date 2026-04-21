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
        //
        // CRITICAL: React + React-DOM + every `react-*` package must live in
        // the SAME chunk. If they land in different chunks, antd loads its
        // own copy of React internals and throws at runtime:
        //   "undefined is not an object (evaluating
        //    'Wj.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED')"
        // So `vendor-react` is checked first and sweeps up anything that
        // references React, including antd's internal scheduler deps.
        manualChunks: (id) => {
          if (!id.includes('node_modules')) {
            if (id.includes('/src/pages/admin/console/')) return 'admin-console';
            if (id.includes('/src/pages/mentor/console/')) return 'mentor-console';
            return undefined;
          }

          // React singleton + everything that depends on React internals.
          // Order matters: this must run before the antd/icons buckets.
          if (
            /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|react-redux|react-is|scheduler|use-sync-external-store)[\\/]/.test(
              id,
            )
          ) {
            return 'vendor-react';
          }

          // State / date libs with no React-internals dependency.
          if (
            id.includes('@reduxjs/toolkit') ||
            id.includes('redux') ||
            id.includes('dayjs')
          ) {
            return 'vendor-core';
          }

          if (id.includes('recharts') || id.includes('d3-')) return 'recharts';
          if (id.includes('@sentry/')) return 'sentry';
          if (id.includes('antd') || id.includes('@ant-design/')) return 'antd';
          if (id.includes('socket.io')) return 'socket';
          if (id.includes('lucide-react') || id.includes('@fortawesome/')) {
            return 'icons';
          }
          return undefined;
        },
      },
    },
  },
});
