import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        // Don't rewrite the path, just pass /api/* to backend
      },
    },
  },
  optimizeDeps: {
    include: ['socket.io-client'], // Explicitly include socket.io-client for pre-bundling
    force: false, // Set to true if you need to force re-optimization
  },
});
