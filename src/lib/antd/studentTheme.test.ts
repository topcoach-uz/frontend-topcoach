import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { studentTheme } from './studentTheme';

// The Sass token map is the source of truth; the antd theme must mirror it exactly.
const scss = fs.readFileSync(path.resolve(__dirname, '../../styles/student-hub-design-system.scss'), 'utf8');
const mapBody = scss.match(/\$tc-colors:\s*\(([\s\S]*?)\);/)?.[1] ?? '';
const tokens: Record<string, string> = Object.fromEntries(
  [...mapBody.matchAll(/'([a-z-]+)':\s*(#[0-9a-f]{6})/gi)].map(([, name, hex]) => [name, hex.toLowerCase()]),
);
const t = studentTheme.token ?? {};
const lc = (v: unknown) => String(v).toLowerCase();

describe('student antd theme', () => {
  it('reads the Sass colour tokens', () => {
    expect(tokens.brand).toBe('#8b0000');
  });

  it('mirrors the brand, text and surface tokens', () => {
    expect(lc(t.colorPrimary)).toBe(tokens.brand);
    expect(lc(t.colorLink)).toBe(tokens.brand);
    expect(lc(t.colorPrimaryHover)).toBe(tokens['brand-hover']);
    expect(lc(t.colorLinkHover)).toBe(tokens['brand-hover']);
    expect(lc(t.colorBgLayout)).toBe(tokens.canvas);
    expect(lc(t.colorText)).toBe(tokens.text);
    expect(lc(t.colorTextHeading)).toBe(tokens.ink);
    expect(lc(t.colorTextSecondary)).toBe(tokens.muted);
    expect(lc(t.colorBorder)).toBe(tokens.line);
    expect(lc(t.controlItemBgActive)).toBe(tokens.blush);
    expect(lc(t.colorSuccess)).toBe(tokens.success);
    expect(lc(t.colorWarning)).toBe(tokens.warning);
    expect(lc(t.colorError)).toBe(tokens.danger);
  });

  it('makes buttons pills', () => {
    expect(studentTheme.components?.Button?.borderRadius).toBe(999);
  });

  it('uses the crimson focus ring, not grey or blue', () => {
    expect(studentTheme.components?.Input?.activeShadow).toBe('0 0 0 3px rgba(139, 0, 0, 0.14)');
  });

  it('contains no antd default blue', () => {
    const json = JSON.stringify(studentTheme).toLowerCase();
    for (const blue of ['#1677ff', '#e6f4ff', '#69b1ff', '#0958d9', '#bae0ff']) {
      expect(json).not.toContain(blue);
    }
  });
});
