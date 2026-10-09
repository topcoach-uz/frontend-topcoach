type Mentor = { id: string; mentorProfile?: { major?: string; tags?: string[] | null; summary?: string } };
const tokens = (value: string) => value.toLowerCase().match(/[a-z]{3,}/g)?.filter(word => !['and', 'the', 'with', 'for', 'studies', 'science', 'sciences'].includes(word)) ?? [];

/** Recommend only real directory mentors with an overlapping subject. */
export function suggestMentors<T extends Mentor>(mentors: T[], majors: string[]): T[] {
  const subjects = new Set(majors.flatMap(tokens));
  return mentors.map(mentor => ({ mentor, score: tokens(`${mentor.mentorProfile?.major ?? ''} ${(mentor.mentorProfile?.tags ?? []).join(' ')}`).filter(word => subjects.has(word)).length }))
    .filter(item => item.score > 0).sort((a, b) => b.score - a.score || a.mentor.id.localeCompare(b.mentor.id)).slice(0, 3).map(item => item.mentor);
}
