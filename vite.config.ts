import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';

// Changes on every build, appended to the /locales/*.json request so a deploy
// invalidates the browser's copy. Lets src/lib/i18n drop `cache: 'no-cache'`,
// which was re-downloading the whole translation file on every single visit.
const LOCALE_VERSION = Date.now().toString(36);

// Vite only writes <link rel="modulepreload"> for the entry's STATIC import
// graph, so a route that is (correctly) lazy-loaded cannot start downloading
// until the entry has parsed and executed. The landing page is what an
// anonymous visitor actually came for, so give it the head start that the
// console chunks used to take by accident.
function preloadLandingChunk(): Plugin {
  return {
    name: 'preload-landing-chunk',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const bundle = ctx.bundle;
        if (!bundle) return html;
        const chunk = Object.values(bundle).find(
          (c) =>
            c.type === 'chunk' &&
            typeof c.facadeModuleId === 'string' &&
            /[\\/]src[\\/]pages[\\/]landing[\\/]index\.tsx?$/.test(c.facadeModuleId)
        );
        if (!chunk || chunk.type !== 'chunk') return html;
        const tag = `<link rel="modulepreload" crossorigin href="/${chunk.fileName}">`;
        return html.includes(tag) ? html : html.replace('</head>', `    ${tag}\n  </head>`);
      },
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths(), preloadLandingChunk()],
  define: {
    __LOCALE_VERSION__: JSON.stringify(LOCALE_VERSION),
  },
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
        // Module workers need a JavaScript MIME type. Use a fresh .js URL so
        // cached octet-stream headers on an older .mjs URL cannot break PDFs.
        assetFileNames: (asset) => asset.name?.endsWith('.mjs')
          ? 'assets/[name]-[hash].js'
          : 'assets/[name]-[hash][extname]',
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
        // NO manualChunks. Rollup's default splitting groups a module by the
        // set of entry points that reach it, which is what we want: code used
        // only by a lazy route lands in that route's chunk.
        //
        // Naming a manual chunk breaks that, because a named chunk becomes a
        // magnet for shared modules. The previous config named two —
        // 'admin-console' and 'mentor-console' — intending to keep two heavy
        // consoles out of everyone's way. It did the opposite. Measured on the
        // shipped build: `admin-console` was 6 238 KB of rendered code, of
        // which only 262 KB was actually src/pages/admin/console. The rest was
        // vendor code Rollup had merged in — react-dom, xlsx (558 KB), jspdf
        // (334 KB), pako, RTK Query, i18next. Because React itself lived in
        // there, the ENTRY statically imported the chunk, so index.html carried
        // <link rel="modulepreload"> for 3.1 MB that every anonymous visitor
        // had to download before React could mount.
        //
        // Removing it drops the pre-mount payload from 4 101 KB to 2 077 KB,
        // and xlsx/jspdf move into the lazy chunks that actually use them.
        //
        // If a vendor split is ever added back, remember the original warning
        // that sat here: anything importing React hooks (antd, @sentry/react,
        // recharts, react-redux, @reduxjs/toolkit) must stay in one chunk with
        // React, or you get "Cannot read .__SECRET_INTERNALS_DO_NOT_USE...".
      },
    },
  },
});
