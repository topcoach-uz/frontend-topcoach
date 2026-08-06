#!/usr/bin/env node
/**
 * Adds the MM3 *chrome* keys (intro / runner nav / analyzing / results /
 * validation) to all four locale files.
 *
 * Companion to `mm3-locale-gen.cjs`, which handles question CONTENT. This one
 * harvests keys straight from the components: every `t('majorMatch3.x', 'y')`
 * call in the MM3 files becomes key `majorMatch3.x` with English value `y`, so
 * the locale files can never drift from what the code actually asks for.
 *
 *   node scripts/mm3-chrome-locale-gen.cjs           # write missing keys
 *   node scripts/mm3-chrome-locale-gen.cjs --check   # verify only, no writes
 *
 * Idempotent: an existing key is NEVER overwritten, so translated values
 * survive re-runs.
 *
 * ⚠️ Reads and writes ONE locale at a time, immediately before writing. Other
 * agents edit these same four files concurrently; reading all four up front and
 * writing later silently drops their keys.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LOCALES = ['en', 'ru', 'kk', 'uz'];
const LOCALE_DIR = path.join(ROOT, 'public', 'locales');

const SOURCE_FILES = [
  'src/pages/student-hub/major-match-v2/MajorMatchV2Page.tsx',
  'src/pages/student-hub/major-match-v2/components/MM3Intro.tsx',
  'src/pages/student-hub/major-match-v2/components/MM3Runner.tsx',
  'src/pages/student-hub/major-match-v2/components/MM3Analyzing.tsx',
  'src/pages/student-hub/major-match-v2/components/MM3Results.tsx',
  'src/pages/student-hub/major-match-v2/components/MM3Inputs.tsx',
];

/** Match t('majorMatch3.key', 'fallback') / "fallback", across line breaks. */
const CALL_RE =
  /t\(\s*'(majorMatch3\.[A-Za-z0-9_.]+)'\s*,\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/g;

const unescape = (s) => s.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\');

function harvest() {
  const found = new Map();
  for (const rel of SOURCE_FILES) {
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) {
      console.warn(`  ! missing source file, skipped: ${rel}`);
      continue;
    }
    const src = fs.readFileSync(file, 'utf8');
    let m;
    while ((m = CALL_RE.exec(src)) !== null) {
      const key = m[1];
      const value = unescape(m[2] !== undefined ? m[2] : m[3]);
      if (!found.has(key)) found.set(key, value);
    }
  }
  return found;
}

function sortedByKey(obj) {
  return Object.fromEntries(Object.keys(obj).sort().map((k) => [k, obj[k]]));
}

function main() {
  const check = process.argv.includes('--check');
  const harvested = harvest();
  console.log(`Harvested ${harvested.size} majorMatch3 chrome keys from components.\n`);

  let missingTotal = 0;
  const counts = {};

  for (const locale of LOCALES) {
    const file = path.join(LOCALE_DIR, `${locale}.json`);
    // Read immediately before writing — never hoisted out of this loop.
    const current = JSON.parse(fs.readFileSync(file, 'utf8'));

    const missing = [];
    for (const [key, value] of harvested) {
      if (!(key in current)) {
        missing.push(key);
        current[key] = value; // English seed; translated in a later native pass.
      }
    }
    missingTotal += missing.length;

    if (missing.length && !check) {
      fs.writeFileSync(file, `${JSON.stringify(sortedByKey(current), null, 2)}\n`, 'utf8');
    }
    counts[locale] = Object.keys(current).length;
    console.log(
      `  ${locale}: ${missing.length} missing${check ? ' (check only)' : ' → added'}, ${counts[locale]} keys total`,
    );
  }

  const totals = new Set(Object.values(counts));
  console.log('');
  if (totals.size !== 1) {
    console.error(`✗ KEY-COUNT PARITY BROKEN: ${JSON.stringify(counts)}`);
    process.exit(1);
  }
  console.log(`✓ Parity holds: all four locales at ${[...totals][0]} keys.`);

  if (check && missingTotal > 0) {
    console.error(`✗ ${missingTotal} key(s) missing — run without --check.`);
    process.exit(1);
  }
  process.exit(0);
}

main();
