import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as sass from 'sass';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../../../..');
const repoImporter: sass.FileImporter<'sync'> = {
  findFileUrl(url) {
    const m = url.match(/^\/?(src\/.+)$/);
    return m ? pathToFileURL(path.join(root, m[1])) : null;
  },
};
const css = () =>
  sass.compile(path.join(root, 'src/components/student-hub/ui/student-ui.scss'), {
    importers: [repoImporter],
    loadPaths: [root],
    logger: sass.Logger.silent,
  }).css;
// Literals that appear only as var() fallbacks are allowed; strip those first.
const withoutVarFallbacks = (s: string) => s.replace(/var\(--[a-z0-9-]+,\s*[^)]*\)/gi, 'var()');

describe('student UI stylesheet', () => {
  // Literal checks read this file's own source: the lg-* glass mixins it includes
  // carry their own solid fallbacks (#fff, contrast borders), which are allowed.
  const source = () =>
    fs
      .readFileSync(path.join(root, 'src/components/student-hub/ui/student-ui.scss'), 'utf8')
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');

  it('uses tokens instead of colour literals', () => {
    const body = withoutVarFallbacks(source())
      // rgba() tints are allowed (translucent fills, shadows); hex literals are not.
      .replace(/rgba?\([^)]*\)/g, 'rgba()');
    expect(body.match(/#[0-9a-f]{3,8}\b/gi) ?? []).toEqual([]);
  });

  it('uses motion tokens instead of duration literals', () => {
    // The two loops (spinner 800ms, shimmer 1.4s) are the only literal durations, per MOTION.md.
    const literals = (withoutVarFallbacks(source()).match(/\b\d+(\.\d+)?m?s\b/g) ?? []).filter(
      (d) => !['800ms', '1.4s'].includes(d),
    );
    expect(literals).toEqual([]);
  });

  it('prints each keyframe once', () => {
    const out = css();
    expect(out.split('@keyframes tc-spin').length - 1).toBe(1);
    expect(out.split('@keyframes tc-shimmer').length - 1).toBe(1);
  });

  it('rests loops under reduced motion', () => {
    expect(css()).toMatch(/prefers-reduced-motion:\s*reduce/);
  });

  it('gives buttons and rows a 44px tap target', () => {
    const out = css();
    for (const cls of ['.tc-btn', '.tc-row']) {
      const rule = out.match(new RegExp(`${cls.replace('.', '\\.')}\\s*\\{[^}]*\\}`));
      expect(rule?.[0], cls).toMatch(/min-height:\s*44px/);
    }
  });

  it('grows compact controls to 44px on touch screens', () => {
    const coarse = css().match(/@media \(pointer: coarse\)\s*\{([\s\S]*?)\}\s*\}/)?.[1] ?? '';
    expect(coarse).toMatch(/\.tc-chip/);
    expect(coarse).toMatch(/\.tc-btn--sm/);
    expect(coarse).toMatch(/min-height:\s*44px/);
  });

  it('status pills leave room for descenders (no clipped g, y, p)', () => {
    const rule = css().match(/\.tc-pill > span\s*\{([^}]*)\}/)?.[1] ?? '';
    const lh = Number(rule.match(/line-height:\s*([\d.]+)/)?.[1] ?? 0);
    expect(lh).toBeGreaterThanOrEqual(1.3);
  });

  it('list row titles wrap to two lines before truncating (long ru/kk titles)', () => {
    const rule = css().match(/\.tc-row__title\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(rule).toMatch(/-webkit-line-clamp:\s*2/);
    expect(rule).not.toMatch(/white-space:\s*nowrap/);
  });
});
