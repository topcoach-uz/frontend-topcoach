import { CAAF_DRAFT_STORAGE_KEY, createEmptyCaafDraft, mergeCaafDraft, type CaafDraft } from './types';

export function readDraftFromStorage(): CaafDraft {
  if (typeof window === 'undefined') return createEmptyCaafDraft();
  try {
    const raw = window.localStorage.getItem(CAAF_DRAFT_STORAGE_KEY);
    if (!raw) return createEmptyCaafDraft();
    return mergeCaafDraft(JSON.parse(raw) as Partial<CaafDraft>);
  } catch {
    return createEmptyCaafDraft();
  }
}

/** True if the user has entered enough of the draft to treat as "resume" */
export function draftHasMeaningfulProgress(d: CaafDraft): boolean {
  return (
    d.fullName.trim() !== '' ||
    d.email.trim() !== '' ||
    d.phone.trim() !== '' ||
    d.countryCity.trim() !== '' ||
    Boolean(d.participatingCountry) ||
    Boolean(d.categoryId) ||
    d.gradeOrYear.trim() !== '' ||
    (d.destinationIds && d.destinationIds.length > 0) ||
    d.intendedFieldOfStudy.trim() !== '' ||
    d.hearAbout.trim() !== '' ||
    Boolean(d.primaryGoal) ||
    d.speakerQuestion.trim() !== '' ||
    Boolean(d.wantsConsultation)
  );
}
