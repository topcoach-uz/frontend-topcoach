/**
 * PDF.js worker setup.
 *
 * Configures the global worker source for react-pdf using Vite's `?url`
 * import so the worker is bundled and versioned alongside the app. This
 * avoids CDN dependencies + version-skew issues between `pdfjs-dist` and
 * `react-pdf`.
 *
 * Import this file ONCE (at module top of any component that uses
 * react-pdf's <Document>) — the side-effect is registering the worker.
 */
import { pdfjs } from 'react-pdf';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
