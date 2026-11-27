import { describe, expect, it } from 'vitest';
import { isAlmostThere, pickMostProgressed, unitsLeftText } from './learningTracks';

const t = (completed: number, total: number, unitLabel = 'lessons') => ({
  completed,
  total,
  unitLabel,
  progressPct: total ? Math.round((completed / total) * 100) : 0,
});

describe('learningTracks', () => {
  it('formats units left', () => {
    expect(unitsLeftText(t(5, 10))).toBe('5 lessons left');
    expect(unitsLeftText(t(9, 10))).toBe('1 lesson left');
    expect(unitsLeftText(t(7, 8, 'weeks'))).toBe('1 week left');
    expect(unitsLeftText(t(10, 10))).toBeNull();
    expect(unitsLeftText(t(0, 0))).toBeNull();
  });
  it('flags almost there from 75% to <100%', () => {
    expect(isAlmostThere(t(3, 4))).toBe(true);
    expect(isAlmostThere(t(1, 2))).toBe(false);
    expect(isAlmostThere(t(4, 4))).toBe(false);
  });
  it('picks highest % not most remaining', () => {
    const a = { key: 'a', ...t(2, 100) };
    const b = { key: 'b', ...t(6, 8, 'weeks') };
    expect(pickMostProgressed([a, b])?.key).toBe('b');
  });
  it('skips finished, prefers started, falls back to not started', () => {
    const done = { key: 'd', ...t(4, 4) };
    const idle = { key: 'i', ...t(0, 10) };
    const live = { key: 'l', ...t(1, 10) };
    expect(pickMostProgressed([done, idle, live])?.key).toBe('l');
    expect(pickMostProgressed([done, idle])?.key).toBe('i');
    expect(pickMostProgressed([done])).toBeNull();
    expect(pickMostProgressed([])).toBeNull();
  });
});
