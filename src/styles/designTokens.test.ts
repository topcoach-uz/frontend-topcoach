import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as sass from 'sass';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../..');

// Same resolution Vite gives the project's Sass: `/src/...` and `src/...` from the repo root.
const repoImporter: sass.FileImporter<'sync'> = {
  findFileUrl(url) {
    const m = url.match(/^\/?(src\/.+)$/);
    return m ? pathToFileURL(path.join(root, m[1])) : null;
  },
};
const compileFile = (rel: string) =>
  sass.compile(path.join(root, rel), { importers: [repoImporter], loadPaths: [root], logger: sass.Logger.silent }).css;
const compileString = (source: string) =>
  sass.compileString(source, { importers: [repoImporter], loadPaths: [root], logger: sass.Logger.silent }).css;
const occurrences = (haystack: string, needle: string) => haystack.split(needle).length - 1;

describe('student design tokens', () => {
  it('global.scss prints every core token once on :root', () => {
    const css = compileFile('src/styles/global.scss');
    for (const decl of [
      '--tc-brand: #8b0000',
      '--tc-brand-hover: #6e0000',
      '--tc-canvas: #fbf9f6',
      '--tc-ink: #221d1a',
      '--tc-text: #302b28',
      '--tc-muted: #6b625b',
      '--tc-blush: #f7e6e4',
      '--tc-radius-pill: 999px',
      '--tc-space-4: 16px',
      '--tc-text-h1: 28px',
      '--tc-dur-enter: 460ms',
      '--tc-ease: cubic-bezier(0.32, 0.72, 0, 1)',
      '--tc-focus-ring: 0 0 0 3px var(--tc-focus)',
    ]) {
      expect(occurrences(css, decl), decl).toBe(1);
    }
  });

  it('segmented and lens glass go solid under reduced transparency', () => {
    const css = compileString(`
      @use "src/styles/liquid-glass" as lg;
      .track { @include lg.lg-segment-track; }
      .thumb { @include lg.lg-segment-thumb; }
      .lens { @include lg.lg-lens; }
      .lens-light { @include lg.lg-lens-light; }
    `);
    expect(occurrences(css, 'prefers-reduced-transparency: reduce')).toBeGreaterThanOrEqual(4);
    expect(occurrences(css, 'backdrop-filter: none')).toBeGreaterThanOrEqual(4);
  });

  it('glass entrance and press use the motion tokens and rest under reduced motion', () => {
    const css = compileString(`
      @use "src/styles/liquid-glass" as lg;
      .enter { @include lg.lg-enter; }
      .press { @include lg.tc-press; }
    `);
    expect(css).toContain('var(--tc-dur-enter, 460ms)');
    expect(css).toContain('scale(0.97)');
    expect(occurrences(css, 'prefers-reduced-motion: reduce')).toBeGreaterThanOrEqual(2);
  });

  it('legacy student form rules are scoped to student pages and keep a focus ring', () => {
    const css = compileFile('src/components/student-hub/StudentHubLayout.scss');
    // Nothing may target bare antd inputs: that leaked into every area once a student page loaded.
    expect(css).not.toMatch(/(^|\}|,)\s*\.ant-(input|form-item|select)\b/m);
    expect(css).toContain('var(--tc-focus-ring)');
    // No focused field may lose its outline and ring.
    const focusRules = css.match(/[^{}]*:focus[^{}]*\{[^}]*\}/g) ?? [];
    const killers = focusRules.filter((rule) => /box-shadow:\s*none/.test(rule) && /outline:\s*none/.test(rule));
    expect(killers).toEqual([]);
  });

  it('an input inside an antd affix wrapper gets no second border', () => {
    const css = compileFile('src/components/student-hub/StudentHubLayout.scss');
    const rule = css.match(/[^{}]*\.ant-input-affix-wrapper\s*>\s*input\.ant-input[^{]*\{([^}]*)\}/);
    expect(rule, 'affix-wrapper inner input rule').not.toBeNull();
    expect(rule![1]).toMatch(/border:\s*none\s*!important/);
    expect(rule![1]).toMatch(/box-shadow:\s*none\s*!important/);
  });

  it('the legacy form rules are printed once, not by every importer', () => {
    const importers = [
      'src/pages/student-hub/profile/PersonalProfile.scss',
      'src/pages/student-hub/documents/DocumentsPage.scss',
      'src/components/student-hub/StudentHubErrorBoundary.scss',
    ];
    for (const file of importers) {
      expect(compileFile(file), file).not.toContain('ant-select-selection-overflow-item');
    }
  });

  it('the design-system partial emits no CSS when imported', () => {
    expect(compileString('@import "src/styles/student-hub-design-system";').trim()).toBe('');
  });
});
