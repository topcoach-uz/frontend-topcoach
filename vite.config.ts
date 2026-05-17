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
  css: {
    // Allow SCSS files to `@import 'src/...';` without relative-path noise.
    // Mirrors the TS `paths` alias `src/* → ./src/*`.
    preprocessorOptions: {
      scss: {
        includePaths: ['.'],
      },
    },
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
        // Only do ROUTE-level code splitting here. Manual vendor chunks are a
        // well-known footgun with React — any lib that imports React hooks
        // (antd, @sentry/react, recharts, react-redux, @reduxjs/toolkit, etc.)
        // must share the exact same React singleton. Splitting them into
        // separate chunks duplicates React and breaks with errors like
        //   "undefined is not an object (evaluating
        //    'Wj.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED')"
        // or "W.useLayoutEffect is undefined".
        //
        // So we leave node_modules chunking to Rollup's defaults (hoists
        // shared vendor code into a single chunk per entry), and only split
        // our own admin/mentor console pages since those are lazy-loaded and
        // bundle-heavy (recharts + antd tables) but unused by most visitors.
        manualChunks: (id) => {
          if (id.includes('/src/pages/admin/console/')) return 'admin-console';
          if (id.includes('/src/pages/mentor/console/')) return 'mentor-console';
          return undefined;
        },
      },
    },
  },
});
