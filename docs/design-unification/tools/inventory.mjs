// Re-run: node docs/design-unification/tools/inventory.mjs "$(pwd)" docs/design-unification/inventory
// Read-only inventory of hardcoded design values in the in-scope student-facing code.
// Usage: node inventory.mjs <repoRoot> <outDir>
import fs from 'node:fs';
import path from 'node:path';

const [root, outDir] = process.argv.slice(2);
const IN_SCOPE = [
  'src/pages/auth', 'src/pages/onboarding', 'src/pages/student-hub', 'src/pages/learning',
  'src/components/layouts', 'src/components/student-hub', 'src/components/chat',
  'src/components/notifications', 'src/components/common', 'src/components/sat-prep',
  'src/components/referral', 'src/styles',
];
const EXT = /\.(scss|css|tsx|ts)$/;
const SKIP = /\.(test|spec)\.|\.d\.ts$|\/__/;
const TOKEN_FILES = /src\/styles\/(_liquid-glass|_editorial-tokens|student-hub-design-system|variables)\.scss$/;

const files = [];
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (EXT.test(e.name) && !SKIP.test(p.replace(/\\/g, '/'))) files.push(p);
  }
};
IN_SCOPE.forEach((d) => fs.existsSync(path.join(root, d)) && walk(path.join(root, d)));

// ── Proposed tokens ────────────────────────────────────────────────────
const COLOR_TOKENS = {
  '--tc-canvas': '#fbf9f6', '--tc-surface': '#ffffff', '--tc-surface-tonal': '#f5f2ee',
  '--tc-surface-sunk': '#efeae4', '--tc-line': '#e7e2dc', '--tc-line-strong': '#d8d0c8',
  '--tc-ink': '#221d1a', '--tc-text': '#302b28', '--tc-muted': '#6b625b', '--tc-subtle': '#9a9089',
  '--tc-brand': '#8b0000', '--tc-brand-hover': '#6e0000', '--tc-blush': '#f7e6e4',
  '--tc-success': '#2f7a4b', '--tc-warning': '#95580a', '--tc-danger': '#b4372b',
  '--tc-on-brand': '#ffffff',
};
const hexToRgb = (h) => {
  h = h.replace('#', '');
  if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const dist = (a, b) => Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0));
const nearestColor = (rgb) => {
  let best, bd = Infinity;
  for (const [t, hex] of Object.entries(COLOR_TOKENS)) {
    const d = dist(rgb, hexToRgb(hex));
    if (d < bd) { bd = d; best = t; }
  }
  return { token: best, d: Math.round(bd) };
};
const isOffBrandHue = (rgb) => {
  const [r, g, b] = rgb; const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max - min < 28) return false; // greyish
  // brand reds/warm neutrals are fine; flag blues, purples, greens, bright oranges/pinks
  if (b > r && b > g) return 'blue/purple';
  if (g > r && g > b) return 'green';
  if (r > 200 && g > 100 && b < 80) return 'orange/amber';
  if (r > 200 && b > 120 && g < 120) return 'pink';
  return false;
};
const pxOf = (v) => {
  const m = String(v).trim().match(/^(-?\d*\.?\d+)(px|rem|em)?$/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return m[2] === 'rem' || m[2] === 'em' ? n * 16 : n;
};
const radiusToken = (px) => {
  if (px == null) return null;
  if (px >= 99) return '--tc-radius-pill';
  if (px <= 0) return '(none)';
  const scale = [[6, 'xs'], [10, 'sm'], [12, 'sm'], [16, 'md'], [20, 'lg'], [22, 'lg'], [24, 'xl'], [28, 'xl']];
  let best = scale[0]; for (const s of scale) if (Math.abs(s[0] - px) < Math.abs(best[0] - px)) best = s;
  return `--tc-radius-${best[1]}`;
};
const typeToken = (px) => {
  if (px == null) return null;
  const scale = [[11, 'micro'], [12, 'caption'], [13, 'small'], [14, 'body-sm'], [15, 'body'], [16, 'body-lg'], [17, 'h3'], [20, 'h2'], [24, 'display-sm'], [28, 'h1'], [36, 'display']];
  let best = scale[0]; for (const s of scale) if (Math.abs(s[0] - px) < Math.abs(best[0] - px)) best = s;
  return `--tc-text-${best[1]}`;
};

// ── Scan ───────────────────────────────────────────────────────────────
const rows = { color: [], radius: [], shadow: [], fontSize: [], spacing: [], motion: [], fontFamily: [], zIndex: [] };
const perFile = {};
const bump = (f, k) => { perFile[f] ??= { color: 0, radius: 0, shadow: 0, fontSize: 0, spacing: 0, motion: 0, fontFamily: 0, zIndex: 0, lines: 0 }; perFile[f][k]++; };

for (const abs of files) {
  const rel = path.relative(root, abs).replace(/\\/g, '/');
  const isToken = TOKEN_FILES.test(rel);
  const isTs = /\.tsx?$/.test(rel);
  const lines = fs.readFileSync(abs, 'utf8').split(/\r?\n/);
  perFile[rel] ??= { color: 0, radius: 0, shadow: 0, fontSize: 0, spacing: 0, motion: 0, fontFamily: 0, zIndex: 0, lines: 0 };
  perFile[rel].lines = lines.length;
  if (isToken) continue; // token definitions are the source, not violations
  lines.forEach((line, i) => {
    const ln = i + 1; const where = `${rel}:${ln}`;
    const code = line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '');
    if (!code.trim()) return;
    if (/^\s*(import|export \{)/.test(code)) return;

    // colors
    for (const m of code.matchAll(/#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g)) {
      if (isTs && !/(color|background|border|fill|stroke|style|bg|shadow|#)/i.test(code)) continue;
      const hex = '#' + m[1].toLowerCase(); const rgb = hexToRgb(hex.slice(0, 7).length === 7 ? hex.slice(0, 7) : hex);
      const n = nearestColor(rgb);
      rows.color.push({ where, value: hex, token: n.token, delta: n.d, offBrand: isOffBrandHue(rgb) || '' }); bump(rel, 'color');
    }
    for (const m of code.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/g)) {
      const rgb = [m[1], m[2], m[3]].map(Number); const n = nearestColor(rgb);
      rows.color.push({ where, value: m[0].replace(/\s+/g, ''), token: n.token + (m[4] ? ` @${m[4]}` : ''), delta: n.d, offBrand: isOffBrandHue(rgb) || '' }); bump(rel, 'color');
    }
    // radius
    const rad = code.match(/(?:border-radius|borderRadius)\s*:\s*['"]?([^;,'"}]+)/);
    if (rad && !/var\(|\$|lg\./.test(rad[1])) {
      const first = rad[1].trim().split(/\s+/)[0];
      const px = /%$/.test(first) ? (parseFloat(first) >= 50 ? 999 : null) : pxOf(first);
      rows.radius.push({ where, value: rad[1].trim(), token: radiusToken(px) ?? '?' }); bump(rel, 'radius');
    }
    // shadow
    const sh = code.match(/(?:box-shadow|boxShadow)\s*:\s*['"]?([^;'"}]+)/);
    if (sh && !/var\(|\$|lg\.|none|inherit/.test(sh[1])) { rows.shadow.push({ where, value: sh[1].trim().slice(0, 110) }); bump(rel, 'shadow'); }
    // font-size
    const fs_ = code.match(/(?:font-size|fontSize)\s*:\s*['"]?([^;,'"}]+)/);
    if (fs_ && !/var\(|\$|inherit|clamp/.test(fs_[1])) {
      const px = pxOf(fs_[1].trim());
      rows.fontSize.push({ where, value: fs_[1].trim(), px: px ?? '', token: typeToken(px) ?? '?', offScale: px != null && ![11, 12, 13, 14, 15, 16, 17, 20, 24, 28, 36].includes(Math.round(px)) ? 'off-scale' : '' }); bump(rel, 'fontSize');
    }
    // font-family
    const ff = code.match(/(?:font-family|fontFamily)\s*:\s*['"]?([^;'"}]+)/);
    if (ff && !/var\(|\$|inherit/.test(ff[1])) { rows.fontFamily.push({ where, value: ff[1].trim().slice(0, 80) }); bump(rel, 'fontFamily'); }
    // spacing
    const sp = code.match(/(?:^|[\s{;])(margin|padding|gap|row-gap|column-gap|marginTop|marginBottom|paddingTop|paddingBottom|padding-[a-z]+|margin-[a-z]+)\s*:\s*['"]?([^;'"}]+)/);
    if (sp && !/var\(|\$|auto|inherit|calc/.test(sp[2])) {
      const vals = sp[2].trim().split(/\s+/).map(pxOf).filter((v) => v != null && v !== 0);
      const off = vals.filter((v) => Math.abs(v) % 4 !== 0);
      if (vals.length) { rows.spacing.push({ where, value: sp[2].trim(), offGrid: off.length ? off.join(',') : '' }); bump(rel, 'spacing'); }
    }
    // motion
    const mo = code.match(/(?:^|[\s{;])(transition(?:-duration|-timing-function)?|animation(?:-duration|-timing-function)?|transitionDuration)\s*:\s*['"]?([^;'"}]+)/);
    if (mo && !/none|inherit/.test(mo[2])) {
      const durs = [...mo[2].matchAll(/(\d*\.?\d+)(ms|s)\b/g)].map((d) => (d[2] === 's' ? parseFloat(d[1]) * 1000 : parseFloat(d[1])));
      const ease = (mo[2].match(/cubic-bezier\([^)]*\)|ease-in-out|ease-out|ease-in|linear|\bease\b|lg\.\$lg-ease|\$[a-z-]*ease[a-z-]*/g) || []).join(' ');
      rows.motion.push({ where, value: mo[2].trim().slice(0, 100), durations: durs.join(','), ease }); bump(rel, 'motion');
    }
    const zi = code.match(/(?:z-index|zIndex)\s*:\s*['"]?(-?\d+)/);
    if (zi) { rows.zIndex.push({ where, value: zi[1] }); bump(rel, 'zIndex'); }
  });
}

// ── Aggregate ──────────────────────────────────────────────────────────
const freq = (arr, key) => {
  const m = new Map(); for (const r of arr) m.set(r[key], (m.get(r[key]) || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};
fs.mkdirSync(outDir, { recursive: true });
const summary = {
  filesScanned: files.length,
  totals: Object.fromEntries(Object.entries(rows).map(([k, v]) => [k, v.length])),
  distinct: Object.fromEntries(Object.entries(rows).map(([k, v]) => [k, new Set(v.map((r) => r.value)).size])),
  topColors: freq(rows.color, 'value').slice(0, 40).map(([v, n]) => ({ v, n, token: rows.color.find((r) => r.value === v).token, offBrand: rows.color.find((r) => r.value === v).offBrand })),
  offBrandColorCount: rows.color.filter((r) => r.offBrand).length,
  offBrandByHue: freq(rows.color.filter((r) => r.offBrand), 'offBrand'),
  topRadius: freq(rows.radius, 'value').slice(0, 25),
  radiusByToken: freq(rows.radius, 'token'),
  topFontSize: freq(rows.fontSize, 'value').slice(0, 30),
  fontSizeOffScale: rows.fontSize.filter((r) => r.offScale).length,
  fontFamilies: freq(rows.fontFamily, 'value').slice(0, 15),
  spacingOffGrid: rows.spacing.filter((r) => r.offGrid).length,
  topShadows: freq(rows.shadow, 'value').slice(0, 15),
  durations: freq(rows.motion.flatMap((r) => r.durations.split(',').filter(Boolean).map((d) => ({ d }))), 'd').slice(0, 25),
  eases: freq(rows.motion.flatMap((r) => (r.ease || '(unspecified)').split(/ (?=cubic|ease|linear|lg|\$)/).map((e) => ({ e }))), 'e').slice(0, 20),
  zIndex: freq(rows.zIndex, 'value'),
  worstFiles: Object.entries(perFile).map(([f, c]) => [f, c.color + c.radius + c.shadow + c.fontSize + c.spacing + c.motion + c.fontFamily, c]).sort((a, b) => b[1] - a[1]).slice(0, 40),
};
fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 1));

// Full file:line inventory as markdown tables (one file per category).
const mdTable = (title, cols, data) => `# ${title}\n\nGenerated by the Phase 0 audit scan. ${data.length} rows.\n\n| ${cols.join(' | ')} |\n|${cols.map(() => '---').join('|')}|\n` +
  data.map((r) => `| ${cols.map((c) => String(r[c] ?? '').replace(/\|/g, '\\|')).join(' | ')} |`).join('\n') + '\n';
fs.writeFileSync(path.join(outDir, 'colors.md'), mdTable('Hardcoded colours', ['where', 'value', 'token', 'delta', 'offBrand'], rows.color));
fs.writeFileSync(path.join(outDir, 'radius.md'), mdTable('Hardcoded radii', ['where', 'value', 'token'], rows.radius));
fs.writeFileSync(path.join(outDir, 'shadows.md'), mdTable('Hardcoded shadows', ['where', 'value'], rows.shadow));
fs.writeFileSync(path.join(outDir, 'type.md'), mdTable('Hardcoded font sizes and families', ['where', 'value', 'px', 'token', 'offScale'], rows.fontSize) + '\n' + mdTable('Font families', ['where', 'value'], rows.fontFamily));
fs.writeFileSync(path.join(outDir, 'spacing.md'), mdTable('Hardcoded spacing (margin, padding, gap)', ['where', 'value', 'offGrid'], rows.spacing));
fs.writeFileSync(path.join(outDir, 'motion.md'), mdTable('Transitions and animations', ['where', 'value', 'durations', 'ease'], rows.motion) + '\n' + mdTable('z-index values', ['where', 'value'], rows.zIndex));
console.log(JSON.stringify({ filesScanned: summary.filesScanned, totals: summary.totals, distinct: summary.distinct, offBrand: summary.offBrandColorCount, fontSizeOffScale: summary.fontSizeOffScale, spacingOffGrid: summary.spacingOffGrid }, null, 1));
