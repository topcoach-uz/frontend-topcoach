import { isMasterProgramMentorEmail } from './masterProgramMentors';

export type MentorshipType = 'bachelor' | 'master' | 'both';
export function mentorDisplay(profile: { mentorshipType?: MentorshipType; showPrice?: boolean }, email?: string | null) {
  // Fallback only while the backend migration is rolling out; saved values win.
  const legacyMaster = isMasterProgramMentorEmail(email);
  const type = profile.mentorshipType ?? (legacyMaster ? 'master' : 'bachelor');
  return {
    type,
    showPrice: profile.showPrice ?? !legacyMaster,
    label: type === 'master' ? 'Master’s mentorship' : type === 'both' ? 'Bachelor’s & Master’s mentorship' : 'Bachelor’s mentorship',
  };
}
