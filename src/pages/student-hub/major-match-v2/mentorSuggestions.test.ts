import { describe, it, expect } from 'vitest';
import { suggestMentors } from './mentorSuggestions';
describe('mentor suggestions', () => {
  const mentors = [{ id: 'law', mentorProfile: { major: 'Law' } }, { id: 'cs', mentorProfile: { major: 'Computer Science', tags: ['programming'] } }];
  it('matches real mentors by subject and excludes unrelated mentors', () => {
    expect(suggestMentors(mentors, ['Computer Science']).map(item => item.id)).toEqual(['cs']);
  });
  it('does not invent a match when no subject overlaps', () => {
    expect(suggestMentors(mentors, ['Architecture'])).toEqual([]);
  });
});
