/**
 * Renders College Board HTML (with embedded <math>/MathML and inline SVG)
 * sanitized via DOMPurify, then asks MathJax to typeset the resulting subtree.
 *
 * MathJax is fetched once from cdn.jsdelivr.net the first time a SatHtml
 * mounts. Subsequent renders just re-typeset.
 */

import React, { useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';

// ─── MathJax loader ────────────────────────────────────────────────────────
let mathjaxPromise: Promise<void> | null = null;

function ensureMathJax(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if ((window as any).MathJax?.typesetPromise) return Promise.resolve();
  if (mathjaxPromise) return mathjaxPromise;

  mathjaxPromise = new Promise<void>((resolve, reject) => {
    // Use SVG output (mml-svg). CHTML rendered each character as a separate
    // <mjx-c> element with `font-family: MJXZERO, MJXTEX`, but for glyphs
    // not in the MathJax font (notably commas inside numbers like
    // <mn>15,000</mn>) the browser fell back to the parent serif font,
    // which threw off the metrics and visually split the number into
    // "1 5,000". SVG output embeds the glyphs directly in a single SVG
    // per expression — no font fallback, no parent-CSS interference.
    (window as any).MathJax = {
      loader: { load: ['input/mml', 'output/svg'] },
      startup: { typeset: false },
      svg: { fontCache: 'local', scale: 1 },
      options: { renderActions: { addMenu: [] } },
    };
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/mml-svg.js';
    script.async = true;
    script.onload = () => {
      const mj = (window as any).MathJax;
      if (mj?.startup?.promise) mj.startup.promise.then(() => resolve()).catch(reject);
      else resolve();
    };
    script.onerror = () => reject(new Error('Failed to load MathJax'));
    document.head.appendChild(script);
  });
  return mathjaxPromise;
}

// ─── Sanitizer config ─────────────────────────────────────────────────────
// CB's HTML uses MathML and inline SVG. DOMPurify strips both by default,
// so we explicitly allowlist their tags + attrs. The config is global to
// avoid re-creating on every render.
const SANITIZE_CONFIG: DOMPurify.Config = {
  ADD_TAGS: [
    // MathML
    'math', 'mrow', 'mi', 'mn', 'mo', 'msup', 'msub', 'msubsup', 'mfrac',
    'msqrt', 'mroot', 'mtext', 'mspace', 'mtable', 'mtr', 'mtd', 'mstyle',
    'mover', 'munder', 'munderover', 'mfenced', 'mphantom', 'menclose',
    'maction', 'merror', 'mlabeledtr', 'mpadded',
    // SVG (used for graphs/figures)
    'svg', 'g', 'path', 'rect', 'line', 'circle', 'ellipse', 'polygon',
    'polyline', 'text', 'tspan', 'use', 'defs', 'clipPath', 'marker',
    'pattern', 'mask', 'linearGradient', 'radialGradient', 'stop', 'title',
    'desc', 'foreignObject',
    // misc
    'figure', 'figcaption',
  ],
  ADD_ATTR: [
    // MathML
    'alttext', 'mathvariant', 'displaystyle', 'scriptlevel', 'mathsize',
    'mathcolor', 'mathbackground', 'linethickness', 'numalign', 'denomalign',
    'open', 'close', 'separators', 'rspace', 'lspace',
    // SVG
    'xmlns', 'xmlns:xlink', 'xlink:href', 'viewBox', 'preserveAspectRatio',
    'd', 'fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width',
    'stroke-opacity', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin',
    'transform', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry',
    'width', 'height', 'points', 'offset', 'gradientUnits', 'gradientTransform',
    'patternUnits', 'patternTransform', 'spreadMethod', 'text-anchor',
    'font-family', 'font-size', 'font-weight', 'font-style', 'baseline-shift',
    'dominant-baseline', 'role', 'aria-label', 'aria-labelledby',
  ],
};

// CB ships question text with screen-reader verbalizations baked in
// ("0 comma 3", "y equals 0") so assistive tech reads coordinates correctly.
// Sighted users see those verbalizations as broken prose, so we rewrite them
// in text nodes only — attributes (incl. aria-label) stay untouched, so SR
// announcements are preserved.
const COORD_PAIR_RE = /(-?\d[\d.]*)\s+comma\s+(-?\d[\d.]*)/g;

const humanizeVerbalizations = (html: string): string => {
  if (!html || typeof document === 'undefined') return html;
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const walker = document.createTreeWalker(tpl.content, NodeFilter.SHOW_TEXT);
  let n: Node | null;
  while ((n = walker.nextNode())) {
    if (!n.nodeValue) continue;
    const next = n.nodeValue.replace(COORD_PAIR_RE, '$1, $2');
    if (next !== n.nodeValue) n.nodeValue = next;
  }
  return tpl.innerHTML;
};

interface Props {
  html: string;
  /** Adds a wrapper className. */
  className?: string;
  /** Inline style on the wrapper. */
  style?: React.CSSProperties;
}

const SatHtml: React.FC<Props> = ({ html, className, style }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    let cancelled = false;
    ensureMathJax()
      .then(() => {
        if (cancelled || !ref.current) return;
        const mj = (window as any).MathJax;
        if (mj?.typesetPromise) mj.typesetPromise([ref.current]).catch(() => {});
      })
      .catch(() => {
        // Fail silently — base64-PNG questions still render fine,
        // and MathML degrades gracefully in modern browsers without MathJax.
      });
    return () => {
      cancelled = true;
    };
  }, [html]);

  const safe = humanizeVerbalizations(DOMPurify.sanitize(html ?? '', SANITIZE_CONFIG));

  return (
    <div
      ref={ref}
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
};

export default SatHtml;
