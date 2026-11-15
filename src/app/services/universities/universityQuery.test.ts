import { describe, expect, it } from 'vitest';
import { filterUniversityRows, slimUniversityRow } from './universityQuery';

const row = (id: string, country: string, majors: Array<{ name: string; type: string }>) => slimUniversityRow({
  id, location: { country: { en: country } }, majors,
  media: [{ tags: ['photo'] }, { tags: ['Official-Logo'] }],
});

describe('local university filters', () => {
  const rows = [
    row('a', 'United States', [{ name: 'Computer Science', type: 'undergraduate' }, { name: 'Law', type: 'graduate' }]),
    row('b', ' united states ', [{ name: 'Biology', type: 'undergraduate' }]),
    row('c', 'Canada', [{ name: 'Law', type: 'graduate' }]),
  ];
  it('drops heavy fields but keeps logo media and a subject index', () => {
    expect(rows[0].majors).toEqual([]);
    expect(rows[0].media).toHaveLength(1);
    expect(rows[0].ugMajorKeys).toEqual(['computer science']);
  });
  it('filters country exactly, ignoring case and spaces', () => {
    expect(filterUniversityRows(rows, { country: 'United States' }).map((r) => r.id)).toEqual(['a', 'b']);
  });
  it('filters by undergraduate subject only, like the server majorType filter', () => {
    expect(filterUniversityRows(rows, { majorName: 'computer science' }).map((r) => r.id)).toEqual(['a']);
    expect(filterUniversityRows(rows, { majorName: 'Law' })).toEqual([]);
  });
  it('returns everything without filters', () => {
    expect(filterUniversityRows(rows, {})).toBe(rows);
  });
});
