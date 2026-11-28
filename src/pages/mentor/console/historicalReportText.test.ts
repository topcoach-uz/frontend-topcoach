import { describe, expect, it } from 'vitest';
import { historicalReportText } from './historicalReportText';
describe('Historical report presentation', () => {
  it('keeps notes and human-readable attendance without exposing import diagnostics', () => {
    const source='Session 6 | 2026-04-18 | Source status: missed_unspecified\nRecorded time: None; timezone: None; minutes: None\nFlags: internal_import_metadata\nMissed';
    const text=historicalReportText(source);
    expect(text).toContain('2026-04-18 | Missed');
    expect(text).toContain('Recorded time: not recorded');
    expect(text).not.toContain('Flags:');
  });
  it('shows workbook cells as labelled values while preserving narrative text', () => {
    expect(historicalReportText('{"Student:":"Kumush","research sessions":10}\nReviewed the draft.')).toBe('Student: Kumush\nresearch sessions: 10\nReviewed the draft.');
  });
});
