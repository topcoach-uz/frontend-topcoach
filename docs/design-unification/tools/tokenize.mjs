#!/usr/bin/env node
// Replace colour, radius, font-size and transition-duration literals in student SCSS with --tc-* tokens.
//
//   node docs/design-unification/tools/tokenize.mjs [--dry] <file.scss> ...
//
// Exact matches map 1:1. Near matches (MAP_NEAR) unify off-scale values onto the
// nearest token, as PLAN-phase-3 step 5 describes. Skips Sass variable
// definitions, mixin arguments and Sass colour functions (rgba(#hex, a), mix(),
// darken() ...), where a CSS custom property can't go. Prints a per-file count.
import fs from 'node:fs';

const v = (n) => `var(--tc-${n})`;
const COLORS = {
  // exact
  '#fbf9f6': 'canvas', '#ffffff': 'surface', '#f5f2ee': 'surface-tonal', '#efeae4': 'surface-sunk',
  '#e7e2dc': 'line', '#d8d0c8': 'line-strong', '#221d1a': 'ink', '#302b28': 'text', '#6b625b': 'muted',
  '#9a9089': 'subtle', '#8b0000': 'brand', '#6e0000': 'brand-hover', '#5a0000': 'brand-press',
  '#f7e6e4': 'blush', '#f1d9d6': 'blush-strong', '#2f7a4b': 'success', '#eef5ef': 'success-bg',
  '#95580a': 'warning', '#fbf3e4': 'warning-bg', '#b4372b': 'danger', '#fdeceb': 'danger-bg',
  // near
  '#655c55': 'muted', '#6e6a66': 'muted', '#7a756f': 'muted', '#606976': 'muted', '#667085': 'muted',
  '#6b7280': 'muted', '#5f6672': 'muted', '#5b6472': 'muted', '#596575': 'muted', '#4d5868': 'muted',
  '#302f2d': 'text', '#3f3a36': 'text', '#323947': 'text',
  '#8a8178': 'subtle', '#8a8079': 'subtle', '#a39a92': 'subtle',
  '#ece7e1': 'line', '#ede9e3': 'line', '#f1ece6': 'line', '#d8d1c9': 'line-strong',
  '#f3f1ed': 'surface-tonal', '#f6f3ef': 'surface-tonal', '#f7f5f2': 'surface-tonal', '#f6f1ec': 'surface-tonal',
  '#fcfaf8': 'canvas', '#fbf7f4': 'canvas',
  '#f6e8e7': 'blush', '#fbeeed': 'blush', '#fff4f3': 'blush',
  '#6d0000': 'brand-hover', '#750000': 'brand-hover', '#7b1f2f': 'brand-hover',
  '#b3261e': 'danger', '#b42318': 'danger',
  '#8a5a00': 'warning', '#9a5b00': 'warning', '#fff4e5': 'warning-bg', '#fbf1dd': 'warning-bg',
  '#1f7a45': 'success', '#e9f6ee': 'success-bg',
};
const RADIUS = { '6px': 'xs', '10px': 'sm', '12px': 'sm', '14px': 'md', '16px': 'md', '18px': 'lg', '20px': 'lg', '22px': 'xl', '24px': 'xl', '999px': 'pill', '9999px': 'pill', '100px': 'pill' };
const FONT = { '11px': 'micro', '12px': 'caption', '13px': 'small', '14px': 'body-sm', '15px': 'body', '16px': 'body-lg', '17px': 'h3', '20px': 'h2', '28px': 'h1', '36px': 'display' };

// Nearest duration token (MOTION.md: no other durations).
const dur = (d) => {
  const ms = d.endsWith('ms') ? parseFloat(d) : parseFloat(d) * 1000;
  return v(ms <= 150 ? 'dur-1' : ms <= 260 ? 'dur-2' : ms <= 390 ? 'dur-3' : 'dur-enter');
};

const SASS_FN = /(rgba?|mix|darken|lighten|transparentize|fade-out|fade-in|opacify|adjust-hue|saturate|desaturate|color\.\w+)\(\s*$/;

function tokenizeDecl(prop, value, stats) {
  const p = prop.toLowerCase();
  const val = value.trim();
  if (p.startsWith('--')) return value;
  const imp = /\s*!important$/.exec(val);
  const core = imp ? val.slice(0, imp.index) : val;
  const lead = value.match(/^\s*/)[0];
  const trail = value.match(/\s*$/)[0];
  const keep = (x) => `${lead}${x}${imp ? imp[0] : ''}${trail}`;
  if (p === 'border-radius' && RADIUS[core]) { stats.radius++; return keep(v(`radius-${RADIUS[core]}`)); }
  if (p === 'font-size' && FONT[core]) { stats.font++; return keep(v(`text-${FONT[core]}`)); }
  if (p === 'transition-duration' && /^\d+m?s$/.test(core)) { stats.motion++; return keep(dur(core)); }
  if (p === 'transition' && !/\b(all|var\(--tc-)/.test(core)) {
    const parts = core.split(/,(?![^(]*\))/).map((part) => {
      const bits = part.trim().split(/\s+(?![^(]*\))/);
      const [what, d, ...rest] = bits;
      if (!d || !/^\d+m?s$/.test(d)) return part.trim();
      const moves = /^(transform|translate|scale|rotate)$/.test(what);
      const fades = /^(opacity|color|background(-color)?|border(-color)?|box-shadow|fill|stroke|outline(-color)?)$/.test(what);
      let ease = rest.join(' ');
      const delay = /\d+m?s$/.test(ease.split(' ').pop() || '') ? ` ${ease.split(' ').pop()}` : '';
      if (moves) ease = v('ease'); else if (fades) ease = v('ease-fade');
      else return part.trim();
      stats.motion++;
      return `${what} ${dur(d)} ${ease}${delay}`;
    });
    return keep(parts.join(', '));
  }
  return value.replace(/#([0-9a-f]{6}|[0-9a-f]{3})\b/gi, (m, _h, off, s) => {
    if (SASS_FN.test(s.slice(0, off))) return m;
    let hex = m.toLowerCase();
    if (hex.length === 4) hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
    let name = COLORS[hex];
    if (hex === '#ffffff') name = p === 'color' || p === 'fill' || p === 'stroke' ? 'on-brand' : 'surface';
    if (!name) return m;
    stats.color++; return v(name);
  });
}

// Every `prop: value` that ends in `;` or `}` on the line (so one-line rules work
// too). Selectors like `a:hover {` never end in `;`/`}` and are left alone.
function tokenizeLine(line, stats) {
  const t = line.trim();
  if (t.startsWith('$') || t.startsWith('@') || t.startsWith('//')) return line;
  const code = line.replace(/\/\/.*$/, (c) => (/https?:$/.test(line.slice(0, line.indexOf(c))) ? c : ''));
  const comment = line.slice(code.length);
  return code.replace(/(^|[;{\s])([a-z-]+)(\s*:)([^;{}]+)(?=;|\s*}|\s*$)/gi, (m, pre, prop, colon, value) => {
    if (/^\s*\$|@include/.test(value)) return m;
    return `${pre}${prop}${colon}${tokenizeDecl(prop, value, stats)}`;
  }) + comment;
}

const argv = process.argv.slice(2);
const dry = argv.includes('--dry');
for (const file of argv.filter((a) => a !== '--dry')) {
  const src = fs.readFileSync(file, 'utf8');
  const stats = { color: 0, radius: 0, font: 0, motion: 0 };
  const next = src.split('\n').map((l) => tokenizeLine(l, stats)).join('\n');
  if (!dry && next !== src) fs.writeFileSync(file, next);
  console.log(`${file}: colours ${stats.color}, radius ${stats.radius}, font-size ${stats.font}, motion ${stats.motion}`);
}
