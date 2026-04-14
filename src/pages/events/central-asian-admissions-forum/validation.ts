import type { CaafDraft } from './types';

const STEP_COUNT = 4;

/** Returns an i18n key under `caafForum.validation.*`, or null if valid. */
export function validateCaafStep(step: number, d: CaafDraft): string | null {
  if (step === 0) {
    if (!d.fullName.trim()) return 'caafForum.validation.fullName';
    if (!d.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) return 'caafForum.validation.email';
    if (!d.phone.trim()) return 'caafForum.validation.phone';
    if (!d.countryCity.trim()) return 'caafForum.validation.countryCity';
    if (!d.participatingCountry) return 'caafForum.validation.participatingCountry';
    if (!d.categoryId) return 'caafForum.validation.category';
    if (d.categoryId === 'other' && !d.categoryOther.trim()) return 'caafForum.validation.categoryOther';
    return null;
  }
  if (step === 1) {
    if (!d.gradeOrYear.trim()) return 'caafForum.validation.grade';
    if (!d.destinationIds.length) return 'caafForum.validation.destinations';
    if (d.destinationIds.includes('other') && !d.destinationOther.trim()) return 'caafForum.validation.destinationOther';
    if (!d.intendedFieldOfStudy.trim()) return 'caafForum.validation.fieldOfStudy';
    return null;
  }
  if (step === 2) {
    if (!d.hearAbout.trim()) return 'caafForum.validation.hearAbout';
    if (!d.primaryGoal) return 'caafForum.validation.primaryGoal';
    if (!d.speakerQuestion.trim()) return 'caafForum.validation.speakerQuestion';
    return null;
  }
  if (step === 3) {
    if (!d.wantsConsultation) return 'caafForum.validation.consultation';
    if (!d.consentAccepted) return 'caafForum.validation.consent';
    return null;
  }
  return null;
}

export { STEP_COUNT };
